const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: get all event IDs created by this admin
async function getAdminEventIds(adminId) {
  const { data } = await supabase
    .from('events')
    .select('id')
    .eq('created_by', adminId);
  return (data || []).map(e => e.id);
}

// GET /api/admin/dashboard - Stats scoped to the logged-in admin's events
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const eventIds = await getAdminEventIds(req.user.id);

    if (eventIds.length === 0) {
      return res.json({
        stats: { total_events: 0, total_registrations: 0, total_revenue: 0, checked_in: 0 },
        recent_registrations: []
      });
    }

    const [
      { count: totalEvents },
      { count: totalRegistrations },
      { data: revenueData },
      { count: checkedIn },
      { data: recentRegistrations }
    ] = await Promise.all([
      supabase.from('events').select('*', { count: 'exact', head: true }).eq('created_by', req.user.id),
      supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').in('event_id', eventIds),
      supabase.from('registrations').select('amount_paid').eq('status', 'confirmed').in('event_id', eventIds),
      supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'used').in('event_id', eventIds),
      supabase
        .from('registrations')
        .select(`
          id, status, amount_paid, confirmed_at,
          users (name, email),
          events (title, event_date)
        `)
        .eq('status', 'confirmed')
        .in('event_id', eventIds)
        .order('confirmed_at', { ascending: false })
        .limit(10)
    ]);

    const totalRevenue = (revenueData || []).reduce(
      (sum, r) => sum + (r.amount_paid || 0), 0
    );

    res.json({
      stats: {
        total_events: totalEvents || 0,
        total_registrations: totalRegistrations || 0,
        total_revenue: totalRevenue,
        checked_in: checkedIn || 0
      },
      recent_registrations: recentRegistrations || []
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/events/:eventId/attendees - Scoped to admin's own events
router.get('/events/:eventId/attendees', authenticate, requireAdmin, async (req, res) => {
  try {
    // Ensure the event belongs to this admin
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', req.params.eventId)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (!event) {
      return res.status(403).json({ error: 'Event not found or access denied' });
    }

    const { data: attendees, error } = await supabase
      .from('registrations')
      .select(`
        id, status, amount_paid, confirmed_at,
        users (id, name, email),
        tickets (id, status, checked_in_at)
      `)
      .eq('event_id', req.params.eventId)
      .order('confirmed_at', { ascending: false });

    if (error) throw error;
    res.json({ attendees });
  } catch (err) {
    console.error('Attendees error:', err);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

// GET /api/admin/revenue - Revenue for this admin's events only
router.get('/revenue', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        id, title, event_date, price, capacity, registrations_count,
        registrations (amount_paid, status)
      `)
      .eq('created_by', req.user.id)
      .order('event_date', { ascending: false });

    if (error) throw error;

    const revenueByEvent = (events || []).map(event => {
      const confirmed = (event.registrations || []).filter(r => r.status === 'confirmed');
      const revenue = confirmed.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
      return {
        id: event.id,
        title: event.title,
        event_date: event.event_date,
        price: event.price,
        capacity: event.capacity,
        registrations_count: event.registrations_count,
        revenue,
        confirmed_count: confirmed.length
      };
    });

    res.json({ revenue_by_event: revenueByEvent });
  } catch (err) {
    console.error('Revenue error:', err);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// GET /api/admin/users - Users who registered for this admin's events
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const eventIds = await getAdminEventIds(req.user.id);

    if (eventIds.length === 0) {
      return res.json({ users: [] });
    }

    // Find users with confirmed registrations for this admin's events
    const { data: registrations } = await supabase
      .from('registrations')
      .select('user_id')
      .in('event_id', eventIds)
      .eq('status', 'confirmed');

    const userIds = [...new Set((registrations || []).map(r => r.user_id))];

    if (userIds.length === 0) {
      return res.json({ users: [] });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, created_at')
      .in('id', userIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ users });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/create-admin - Create a new admin account
router.post('/create-admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: 'admin'
      })
      .select('id, name, email, role, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Admin account created successfully', user });
  } catch (err) {
    console.error('Create admin error:', err);
    res.status(500).json({ error: 'Failed to create admin account' });
  }
});

module.exports = router;
