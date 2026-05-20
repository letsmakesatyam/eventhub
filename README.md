# EventHub

A full-stack event management and ticketing platform. Users can browse events, register, pay via Razorpay, and get a QR-coded ticket. Admins can create and manage events, view registrations, track revenue, and scan tickets at the venue using a live QR scanner.

**Live demo:** https://eventhub-82tl.onrender.com &nbsp;·&nbsp; **Backend API:** https://eventhub-backend-2lfd.onrender.com

> The backend runs on Render's free tier and may take ~30 seconds to wake up on first visit. The UI handles this automatically with a retry banner.

---

## Screenshots

### Home Page
| Light | Dark |
|---|---|
| ![Home light](screenshots/01_home_light.png) | ![Home dark](screenshots/01_home_dark.png) |

### Events Browser
| Light | Dark |
|---|---|
| ![Events light](screenshots/02_events_light.png) | ![Events dark](screenshots/02_events_dark.png) |

### Event Detail + Registration
| Light | Dark |
|---|---|
| ![Event detail light](screenshots/03_event_detail_light.png) | ![Event detail dark](screenshots/03_event_detail_dark.png) |

### Admin Dashboard
| Light | Dark |
|---|---|
| ![Dashboard light](screenshots/06_admin_dashboard_light.png) | ![Dashboard dark](screenshots/06_admin_dashboard_dark.png) |

### Admin Events + Create Event Modal
| Light | Dark |
|---|---|
| ![Events admin light](screenshots/07_admin_events_light.png) | ![Events admin dark](screenshots/07_admin_events_dark.png) |
| ![Create modal light](screenshots/08_create_event_modal_light.png) | ![Create modal dark](screenshots/08_create_event_modal_dark.png) |

### QR Ticket Scanner
| Light | Dark |
|---|---|
| ![Scanner light](screenshots/09_qr_scanner_light.png) | ![Scanner dark](screenshots/09_qr_scanner_dark.png) |

### Revenue Analytics
| Light | Dark |
|---|---|
| ![Revenue light](screenshots/10_revenue_light.png) | ![Revenue dark](screenshots/10_revenue_dark.png) |

### My Tickets (with QR code)
| Light | Dark |
|---|---|
| ![Tickets light](screenshots/12_my_tickets_light.png) | ![Tickets dark](screenshots/12_my_tickets_dark.png) |

### Mobile Responsive
| Light | Dark |
|---|---|
| ![Mobile home light](screenshots/14_mobile_home_light.png) | ![Mobile home dark](screenshots/14_mobile_home_dark.png) |

---

## What it does

- Browse and filter events by category
- Register for free events instantly, or go through Razorpay checkout for paid ones
- After payment, a unique QR-coded ticket is generated and shown under "My Tickets"
- Admins get a dashboard with stats, event CRUD, a QR scanner for check-ins, and a per-event revenue breakdown

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios |
| **Backend** | Node.js, Express.js, JWT, bcrypt, Razorpay SDK |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | Vercel (frontend) · Render (backend) · Supabase (database) |

---

## Project Structure

```
eventhub/
├── backend/          Express API — auth, events, payments, tickets, admin
│   ├── config/       schema.sql + Supabase client
│   ├── middleware/   JWT auth + admin guard
│   ├── routes/       auth, events, payments, tickets, admin
│   └── server.js
│
└── frontend/         React app — public pages + protected user/admin views
    └── src/
        ├── pages/    HomePage, EventsPage, AuthPages, MyTicketsPage, admin/*
        ├── context/  AuthContext, ThemeContext, ToastContext
        ├── lib/      api.js (Axios + retry)
        └── components/
```

---

## Local Setup

You'll need Node 18+, a Supabase project, and Razorpay test keys.

### 1. Database
Open SQL Editor in your Supabase dashboard and run `backend/config/schema.sql`.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, RAZORPAY_* keys
npm run dev
```
Runs on `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5000
# VITE_RAZORPAY_KEY_ID=rzp_test_...
npm run dev
```
Runs on `http://localhost:5173`.

### 4. Create your first admin
Register through the UI, then run in Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Root dir: `frontend/`, framework: Vite |
| Backend | Render | Build: `npm install`, start: `node server.js` |
| Database | Supabase | Free tier, run `schema.sql` once |

### Razorpay test card
```
Card number : 4111 1111 1111 1111
Expiry      : any future date
CVV         : any 3 digits
OTP         : 1234
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | harshit@eventhub.com | 123456 |
| Admin | admin@eventhub.com | 123456 |
| User | arjun@gmail.com | 123456 |
| User | sneha@gmail.com | 123456 |
| User | rohan@gmail.com | 123456 |
| (+ 5 more users) | *@gmail.com | 123456 |

---

## Key Technical Decisions

**Supabase with service-role key** — The backend uses Supabase's service-role key, which bypasses Row-Level Security. This keeps the implementation simple and lets the API layer handle all access control via JWT and role checks.

**HashRouter for frontend routing** — The React app uses `HashRouter` so it works on static hosts like Vercel without needing server-side URL rewrites.

**Server-side payment verification** — Razorpay payments are verified server-side using HMAC-SHA256. The frontend cannot mark a payment as successful — only the backend can, after signature verification.

**Render cold start handling** — The frontend detects `ERR_NETWORK` errors from a sleeping Render server, shows a "waking up" banner, and retries with exponential backoff (up to 10 attempts, max 15s delay).

**Ambiguous FK fix** — The `tickets` table has two foreign keys to `users` (`user_id` and `checked_in_by`). All Supabase queries use explicit FK hints (`users!user_id(...)`) to avoid PostgREST ambiguity errors.

---

## Security

- Passwords hashed with bcrypt (cost 12)
- JWT with configurable expiry on all protected routes
- Razorpay webhook signature verified with HMAC-SHA256 before any ticket is issued
- Admin routes double-protected: JWT + `role === 'admin'` middleware check
- Rate limiting: 100 req/15min general, 20 req/15min on auth endpoints
- `helmet.js` for HTTP security headers (HSTS, X-Frame-Options, etc.)
- CORS restricted to configured `FRONTEND_URL` only

---

## About

Built by **Satyam Revgade** — Computer Engineering student at VIT Mumbai.

Project documentation: [`Project_Report.pdf`](Project_Report.pdf)
