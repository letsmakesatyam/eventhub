-- EventHub Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  venue TEXT DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 100,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  registrations_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- ============================================
-- REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- ============================================
-- TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,   -- base64 QR image
  qr_data TEXT NOT NULL,   -- JSON payload encoded in QR
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'invalid')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(status);

-- ============================================
-- STORED FUNCTION: increment_registrations_count
-- ============================================
CREATE OR REPLACE FUNCTION increment_registrations_count(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET registrations_count = registrations_count + 1,
      updated_at = NOW()
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (optional - using service role)
-- ============================================
-- If you want to use RLS, enable it below.
-- Since we use service_role key in backend, RLS is bypassed.
-- Uncomment below only if you switch to anon key:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SEED: Create default admin user
-- (password: Admin@123)
-- ============================================
-- Run this after signup to promote a user to admin:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@eventhub.com';

-- ============================================
-- SAMPLE DATA (optional)
-- ============================================
-- INSERT INTO events (title, description, event_date, location, venue, capacity, price, category, status)
-- VALUES 
--   ('Tech Summit 2025', 'Annual technology conference', '2025-06-15 09:00:00+05:30', 'Mumbai', 'Bombay Exhibition Centre', 500, 999, 'Technology', 'published'),
--   ('Design Workshop', 'Hands-on UX design workshop', '2025-07-01 10:00:00+05:30', 'Bangalore', 'WeWork Prestige', 50, 499, 'Design', 'published'),
--   ('Startup Meetup', 'Monthly startup networking event', '2025-06-20 18:00:00+05:30', 'Delhi', 'India Habitat Centre', 200, 0, 'Networking', 'published');
