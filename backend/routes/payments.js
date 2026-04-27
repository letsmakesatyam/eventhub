const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');
const { generateQRCode, buildTicketPayload } = require('../utils/qrcode');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Get event
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'published' && event.status !== 'ongoing') {
      return res.status(400).json({ error: 'Event is not available for registration' });
    }

    // Check capacity
    if (event.registrations_count >= event.capacity) {
      return res.status(400).json({ error: 'Event is sold out' });
    }

    // Check duplicate registration
    const { data: existing } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('user_id', req.user.id)
      .eq('event_id', event_id)
      .neq('status', 'cancelled')
      .single();

    if (existing) {
      return res.status(409).json({ error: 'You are already registered for this event' });
    }

    // Free event - skip payment
    if (event.price === 0) {
      return res.json({
        free: true,
        event_id,
        message: 'Free event - proceed to register directly'
      });
    }

    // Create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(event.price * 100), // paise
      currency: 'INR',
      receipt: `receipt_${uuidv4().slice(0, 8)}`,
      notes: {
        event_id,
        user_id: req.user.id,
        event_title: event.title
      }
    });

    // Store pending registration
    const { data: registration, error: regErr } = await supabase
      .from('registrations')
      .insert({
        user_id: req.user.id,
        event_id,
        status: 'pending',
        razorpay_order_id: order.id,
        amount_paid: event.price
      })
      .select()
      .single();

    if (regErr) throw regErr;

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      registration_id: registration.id,
      event: {
        title: event.title,
        price: event.price
      }
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registration_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification data missing' });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Mark registration as failed
      await supabase
        .from('registrations')
        .update({ status: 'failed' })
        .eq('id', registration_id);

      return res.status(400).json({ error: 'Payment verification failed - invalid signature' });
    }

    // Get registration
    const { data: registration, error: regErr } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('id', registration_id)
      .eq('user_id', req.user.id)
      .single();

    if (regErr || !registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // Generate ticket
    const ticketId = uuidv4();
    const qrPayload = buildTicketPayload(ticketId, registration.event_id, req.user.id);
    const qrCode = await generateQRCode(qrPayload);

    // Update registration + create ticket atomically
    const { error: updateErr } = await supabase
      .from('registrations')
      .update({
        status: 'confirmed',
        razorpay_payment_id,
        razorpay_signature,
        confirmed_at: new Date().toISOString()
      })
      .eq('id', registration_id);

    if (updateErr) throw updateErr;

    // Create ticket
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        registration_id,
        user_id: req.user.id,
        event_id: registration.event_id,
        qr_code: qrCode,
        qr_data: qrPayload,
        status: 'valid'
      })
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    // Increment registrations count
    await supabase.rpc('increment_registrations_count', { event_id: registration.event_id });

    res.json({
      message: 'Payment verified and ticket generated',
      ticket: {
        id: ticket.id,
        qr_code: ticket.qr_code,
        event: registration.events
      }
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// POST /api/payments/register-free
router.post('/register-free', authenticate, async (req, res) => {
  try {
    const { event_id } = req.body;

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.price > 0) return res.status(400).json({ error: 'This event requires payment' });

    // Duplicate check
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('event_id', event_id)
      .neq('status', 'cancelled')
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Already registered for this event' });
    }

    const { data: registration, error: regErr } = await supabase
      .from('registrations')
      .insert({
        user_id: req.user.id,
        event_id,
        status: 'confirmed',
        amount_paid: 0,
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (regErr) throw regErr;

    const ticketId = uuidv4();
    const qrPayload = buildTicketPayload(ticketId, event_id, req.user.id);
    const qrCode = await generateQRCode(qrPayload);

    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .insert({
        id: ticketId,
        registration_id: registration.id,
        user_id: req.user.id,
        event_id,
        qr_code: qrCode,
        qr_data: qrPayload,
        status: 'valid'
      })
      .select()
      .single();

    if (ticketErr) throw ticketErr;

    await supabase.rpc('increment_registrations_count', { event_id });

    res.status(201).json({
      message: 'Registered successfully',
      ticket: { id: ticket.id, qr_code: ticket.qr_code, event }
    });
  } catch (err) {
    console.error('Free register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
