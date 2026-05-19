const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/tickets/my - User's own tickets
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

// GET /api/tickets/:id - Get single ticket (own, or admin for their events)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const query = supabase
      .from('tickets')
      .select(`
        *,
        events (id, title, event_date, end_date, location, venue, image_url, category, description, created_by),
        registrations (status, amount_paid, confirmed_at),
        users!user_id (name, email)
      `)
      .eq('id', req.params.id);

    if (req.user.role !== 'admin') {
      query.eq('user_id', req.user.id);
    }

    const { data: ticket, error } = await query.single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Admin can only view tickets for their own events
    if (req.user.role === 'admin' && ticket.events?.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ ticket });
  } catch (err) {
    console.error('Get ticket error:', err);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// POST /api/tickets/validate - Admin: QR scan validation (own events only)
// Requires event_id in body to lock validation to a specific event
router.post('/validate', authenticate, requireAdmin, async (req, res) => {
  try {
    const { qr_data, event_id } = req.body;

    if (!qr_data) {
      return res.status(400).json({ error: 'QR data is required' });
    }
    if (!event_id) {
      return res.status(400).json({ error: 'event_id is required — select an event before scanning', valid: false });
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

    // Verify the selected event belongs to this admin
    const { data: ownedEvent } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', event_id)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (!ownedEvent) {
      return res.status(403).json({ error: 'Event not found or access denied', valid: false });
    }

    // Ticket must be for the selected event
    if (eventId !== event_id) {
      return res.status(400).json({
        error: `This ticket is not for "${ownedEvent.title}"`,
        valid: false
      });
    }

    // Get ticket with full details
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        events (id, title, event_date, location, created_by),
        users!user_id (id, name, email)
      `)
      .eq('id', ticketId)
      .eq('event_id', event_id)
      .single();

    if (error || !ticket) {
      return res.status(404).json({ error: 'Ticket not found', valid: false });
    }

    // Final ownership check (defence in depth)
    if (ticket.events?.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to validate tickets for this event', valid: false });
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

// GET /api/tickets/event/:eventId - Admin: list tickets for own event only
router.get('/event/:eventId', authenticate, requireAdmin, async (req, res) => {
  try {
    // Verify event belongs to this admin
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('id', req.params.eventId)
      .eq('created_by', req.user.id)
      .maybeSingle();

    if (!event) {
      return res.status(403).json({ error: 'Event not found or access denied' });
    }

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
