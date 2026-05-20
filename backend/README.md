# EventHub — Backend

REST API built with Express.js, backed by Supabase (PostgreSQL). Handles authentication, event management, Razorpay payments, ticket generation, and admin operations.

## Tech

- **Node.js + Express** for the HTTP layer
- **Supabase** as the database (using the JS client with service role key — bypasses RLS)
- **JWT** for stateless auth (`jsonwebtoken` + `bcryptjs`)
- **Razorpay** for payment order creation and signature verification
- **qrcode** package for generating base64 QR images on ticket creation
- **helmet + express-rate-limit** for basic hardening

## Setup

```bash
npm install
cp .env.example .env
npm run dev       # nodemon, restarts on changes
npm start         # production
```

## Environment variables

| Variable | What it's for |
|---|---|
| `PORT` | Port to listen on (default 5000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase dashboard |
| `JWT_SECRET` | Any long random string for signing tokens |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard (test mode) |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard (test mode) |
| `FRONTEND_URL` | Allowed CORS origin |

## Database

Run `config/schema.sql` once in Supabase SQL Editor to create all tables and indexes. The schema has four tables:

- `users` — with a role column (`user` / `admin`)
- `events` — created by admins, with capacity, price, status
- `registrations` — one per user per event, stores Razorpay IDs
- `tickets` — generated after confirmed payment, holds QR data and check-in status

There's also a stored function `increment_registrations_count` used after each successful registration.

## API

### Auth

```
POST /api/auth/register     { name, email, password, role? }
POST /api/auth/login        { email, password }
GET  /api/auth/me           → current user (requires token)
```

### Events

```
GET    /api/events           public — published events only
GET    /api/events/all       admin — all events including drafts
GET    /api/events/:id       public
POST   /api/events           admin — create
PUT    /api/events/:id       admin — update
DELETE /api/events/:id       admin — delete
```

### Payments

```
POST /api/payments/create-order      { event_id } → Razorpay order
POST /api/payments/verify            { razorpay_order_id, payment_id, signature, event_id }
POST /api/payments/register-free     { event_id } → skip payment, generate ticket directly
```

The verify endpoint checks the Razorpay HMAC signature, marks the registration as confirmed, and generates the ticket + QR code in one transaction.

### Tickets

```
GET  /api/tickets/my              user's own tickets
GET  /api/tickets/:id             single ticket by ID
POST /api/tickets/validate        admin — { qr_data, event_id } → check-in
```

The validate endpoint decodes the QR JSON, checks the ticket belongs to the requested event, marks it `used`, and records `checked_in_at`.

### Admin

```
GET /api/admin/dashboard                 stats scoped to this admin's events
GET /api/admin/revenue                   revenue breakdown per event
GET /api/admin/events/:id/attendees      attendee list for one event
GET /api/admin/users                     users who registered for this admin's events
POST /api/admin/create-admin             create another admin account
```

All admin routes require a valid JWT and `role = 'admin'`.

## Error handling

A few edge cases worth knowing:

- Duplicate registration returns 409
- Registering for a sold-out event returns 400
- Invalid Razorpay signature returns 400 and marks the registration as `failed`
- Scanning an already-used ticket returns 400 with the original `checked_in_at` timestamp
- Expired/missing JWT returns 401; non-admin on admin route returns 403

## Deploy to Render

1. Push to GitHub
2. New Web Service → connect repo → set root to `backend/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add env variables in the Render dashboard
