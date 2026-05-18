const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/events - Public: list all events
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.in('status', ['published', 'ongoing']);
    }

    const { data: events, error, count } = await query;
    if (error) throw error;

    res.json({ events, total: count });
  } catch (err) {
    console.error('Get events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/all - Admin: list all events including drafts
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        registrations:registrations(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ events });
  } catch (err) {
    console.error('Get all events error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Public: get single event
router.get('/:id', async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - Admin: create event
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, description, event_date, end_date, location,
      venue, capacity, price, image_url, category, status = 'published'
    } = req.body;

    if (!title || !event_date || !location || !capacity) {
      return res.status(400).json({ error: 'Title, date, location, and capacity are required' });
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: title.trim(),
        description: description?.trim() || '',
        event_date,
        end_date: end_date || null,
        location: location.trim(),
        venue: venue?.trim() || '',
        capacity: Number(capacity),
        price: Number(price) || 0,
        image_url: image_url?.trim() || null,
        category: category || 'General',
        status,
        created_by: req.user.id,
        registrations_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Admin: update event
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title, description, event_date, end_date, location,
      venue, capacity, price, image_url, category, status
    } = req.body;

    const { data: event, error } = await supabase
      .from('events')
      .update({
        title, description, event_date, end_date, location,
        venue, capacity: Number(capacity), price: Number(price),
        image_url, category, status,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Event updated', event });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Admin: delete event
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
