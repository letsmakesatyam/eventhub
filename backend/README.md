# EventHub Backend API

Production-ready REST API for the EventHub Event Registration & Ticketing Platform.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Payments**: Razorpay (test mode)
- **QR**: qrcode npm package

## Quick Start

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 5000) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (from Supabase dashboard) |
| `JWT_SECRET` | Random 32+ char string for JWT signing |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `RAZORPAY_KEY_ID` | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test key secret |
| `FRONTEND_URL` | Frontend URL for CORS |

## Database Setup

1. Go to [Supabase](https://supabase.com) → New Project
2. Open SQL Editor
3. Paste and run the contents of `config/schema.sql`
4. Copy your Project URL and Service Role Key to `.env`

## API Endpoints

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Events
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | List published events | No |
| GET | `/api/events/all` | List all events | Admin |
| GET | `/api/events/:id` | Get event details | No |
| POST | `/api/events` | Create event | Admin |
| PUT | `/api/events/:id` | Update event | Admin |
| DELETE | `/api/events/:id` | Delete event | Admin |

### Payments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments/create-order` | Create Razorpay order | Yes |
| POST | `/api/payments/verify` | Verify payment & generate ticket | Yes |
| POST | `/api/payments/register-free` | Register for free event | Yes |

### Tickets
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tickets/my` | Get user's tickets | Yes |
| GET | `/api/tickets/:id` | Get ticket by ID | Yes |
| POST | `/api/tickets/validate` | Validate QR scan | Admin |

### Admin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Overall stats | Admin |
| GET | `/api/admin/revenue` | Revenue by event | Admin |
| GET | `/api/admin/events/:id/attendees` | Attendees list | Admin |
| GET | `/api/admin/users` | All users | Admin |

## cURL Test Examples

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@test.com","password":"Test@123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"Test@123"}'

# Get events (replace TOKEN)
curl http://localhost:5000/api/events

# Create order (replace TOKEN and EVENT_ID)
curl -X POST http://localhost:5000/api/payments/create-order \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"EVENT_UUID"}'

# Validate ticket (admin only)
curl -X POST http://localhost:5000/api/tickets/validate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"qr_data":"{\"ticketId\":\"...\",\"eventId\":\"...\",\"userId\":\"...\"}"}'
```

## Edge Cases Handled
- Duplicate registration → 409 Conflict
- Invalid payment signature → 400 + mark failed
- Sold-out event → 400 Bad Request
- Already checked-in ticket → 400 with timestamp
- Expired JWT → 401 Unauthorized
- Non-admin access to admin routes → 403 Forbidden

## Deploy to Render

1. Push to GitHub
2. New Web Service on Render → connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables in Render dashboard
6. Deploy!
