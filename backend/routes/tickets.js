const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tickets/my - User's tickets
router.get('/my', authenticate, async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (id, title, event_date, end_date, location, venue, image_url, category),
        registrations (status, amount_paid, confirmed_at)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tickets });
  } catch (err) {
    console.error('Get tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id - Get single ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const query = supabase
      .from('tickets')
      .select(`
        *,
        events (id, title, event_date, end_date, location, venue, image_url, category, description),
        registrations (status, amount_paid, confirmed_at),
        users!user_id (name, email)
      `)
      .eq('id', req.params.id);

    // Admin can see any ticket, users can see only theirs
    if (req.user.role !== 'admin') {
      query.eq('user_id', req.user.id);
    }

    const { data: ticket, error } = await query.single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets/validate - Admin: QR scan validation
router.post('/validate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { qr_data } = req.body;

    if (!qr_data) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    let parsed;
    try {
      parsed = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data;
    } catch {
      return res.status(400).json({ error: 'Invalid QR code format', valid: false });
    }

    const { ticketId, eventId, userId } = parsed || {};

    if (!ticketId || !eventId || !userId) {
      return res.status(400).json({ error: 'Malformed QR code', valid: false });
    }

    // Get ticket with full details
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (id, title, event_date, location),
        users!user_id (id, name, email)
      `)
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found', valid: false });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({
        error: 'Ticket already used',
        valid: false,
        checked_in_at: ticket.checked_in_at,
        attendee: ticket.users
      });
    }

    if (ticket.status === 'cancelled' || ticket.status === 'invalid') {
      return res.status(400).json({ error: 'Ticket is not valid', valid: false });
    }

    // Mark as used
    const { error: updateErr } = await supabase
      .from('tickets')
      .update({
        status: 'used',
        checked_in_at: new Date().toISOString(),
        checked_in_by: req.user.id
      })
      .eq('id', ticketId);

    if (updateErr) throw updateErr;

    res.json({
      valid: true,
      message: 'Check-in successful!',
      attendee: {
        name: ticket.users.name,
        email: ticket.users.email
      },
      event: ticket.events,
      ticket_id: ticketId
    });
  } catch (err) {
    console.error('Validate ticket error:', err);
    res.status(500).json({ error: 'Validation failed', valid: false });
  }
});

// GET /api/tickets/event/:eventId - Admin: list all tickets for an event
router.get('/event/:eventId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        users!user_id (id, name, email),
        registrations (amount_paid, confirmed_at)
      `)
      .eq('event_id', req.params.eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ tickets });
  } catch (err) {
    console.error('Get event tickets error:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

module.exports = router;
