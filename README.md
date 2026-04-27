# 🎟 EventHub — Event Registration & Ticketing Platform

A complete, production-ready SaaS platform for event discovery, registration, Razorpay payments, and QR-based ticket validation.

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        FRONTEND                          │
│  React + Vite + Tailwind CSS (Vercel)                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ │
│  │  Events    │  │  Tickets   │  │   Admin Dashboard  │ │
│  │  Browser   │  │  (My QR)   │  │  (CRUD + Scanner)  │ │
│  └────────────┘  └────────────┘  └────────────────────┘ │
└──────────────────┬───────────────────────────────────────┘
                   │ Axios (REST API)
                   │
┌──────────────────▼───────────────────────────────────────┐
│                        BACKEND                           │
│  Node.js + Express.js (Render)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │   Auth   │ │  Events  │ │ Payments │ │  Tickets  │  │
│  │  (JWT)   │ │  (CRUD)  │ │(Razorpay)│ │(QR+Valid) │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
└──────────┬─────────────────────────────┬─────────────────┘
           │ Supabase SDK               │ Razorpay SDK
           ▼                            ▼
┌──────────────────┐          ┌────────────────────┐
│    Supabase      │          │   Razorpay API     │
│  (PostgreSQL)    │          │   (Test Mode)      │
│  users           │          │   INR Payments     │
│  events          │          └────────────────────┘
│  registrations   │
│  tickets         │
└──────────────────┘
```

## 📊 Data Flow

```
User → Browse Events → Select Event → Register
  ↓
[Paid Event]                    [Free Event]
  ↓                                 ↓
Razorpay Checkout           Register directly
  ↓                                 ↓
Payment verified            ┌────────────────┐
  ↓                         │ Ticket created │
Generate Ticket ────────────│ QR Code issued │
                            └────────────────┘
                                    ↓
                            Admin scans QR at venue
                                    ↓
                            Ticket marked "used"
                            Check-in recorded
```

## 📁 Project Structure

```
eventhub/
├── backend/
│   ├── config/
│   │   ├── supabase.js        # DB client
│   │   └── schema.sql         # Full database schema
│   ├── middleware/
│   │   └── auth.js            # JWT + admin guard
│   ├── routes/
│   │   ├── auth.js            # Register, login, me
│   │   ├── events.js          # CRUD events
│   │   ├── payments.js        # Razorpay + free registration
│   │   ├── tickets.js         # My tickets + QR validation
│   │   └── admin.js           # Dashboard, revenue, attendees
│   ├── utils/
│   │   └── qrcode.js          # QR generation utility
│   ├── tests/
│   │   └── api.test.sh        # cURL test examples
│   ├── server.js              # Express app entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
└── frontend/
    ├── src/
    │   ├── App.jsx              # Router + protected routes
    │   ├── main.jsx
    │   ├── index.css            # Tailwind + design tokens
    │   ├── lib/api.js           # Axios client + retry logic
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── hooks/
    │   │   └── useServerStatus.js
    │   ├── components/
    │   │   ├── ui/Navbar.jsx
    │   │   ├── ui/ServerStatusBanner.jsx
    │   │   └── events/EventCard.jsx
    │   └── pages/
    │       ├── HomePage.jsx
    │       ├── EventsPage.jsx
    │       ├── EventDetailPage.jsx
    │       ├── AuthPages.jsx
    │       ├── MyTicketsPage.jsx
    │       └── admin/
    │           ├── AdminDashboardPage.jsx
    │           ├── AdminEventsPage.jsx
    │           ├── AdminScannerPage.jsx
    │           ├── AdminRevenuePage.jsx
    │           └── AdminAttendeesPage.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    ├── .env.example
    └── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free at supabase.com)
- A Razorpay account (test keys at dashboard.razorpay.com)

### Step 1: Database Setup
1. Go to [Supabase](https://supabase.com) → New Project
2. SQL Editor → paste contents of `backend/config/schema.sql` → Run
3. Copy your **Project URL** and **Service Role Key**

### Step 2: Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase URL, keys, JWT secret, Razorpay keys
npm run dev
```
Backend runs at: `http://localhost:5000`

### Step 3: Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000
# Set VITE_RAZORPAY_KEY_ID=rzp_test_...
npm run dev
```
Frontend runs at: `http://localhost:5173`

### Step 4: Create Admin User
1. Register a user through the UI
2. In Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🌐 Deployment

### Backend → Render

1. Push to GitHub
2. [render.com](https://render.com) → New → Web Service
3. Connect GitHub repo → select `backend/` as root
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
5. Environment Variables (add all from `.env.example`):
   ```
   NODE_ENV=production
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   JWT_SECRET=your-32-char-secret
   JWT_EXPIRES_IN=7d
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   FRONTEND_URL=https://your-app.vercel.app
   ```
6. Deploy → copy your Render URL

### Frontend → Vercel

1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. Environment Variables:
   ```
   VITE_API_URL=https://your-api.onrender.com
   VITE_RAZORPAY_KEY_ID=rzp_test_...
   ```
5. Deploy

### Razorpay Test Cards
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: `1234`

---

## 🧪 Running Tests

```bash
cd backend
chmod +x tests/api.test.sh
./tests/api.test.sh
```

---

## 🔐 Security Features
- JWT authentication with expiry
- bcrypt password hashing (cost 12)
- Rate limiting (100 req/15min, 20 auth req/15min)
- Razorpay signature verification (HMAC-SHA256)
- Admin role guard on all admin routes
- Helmet.js HTTP security headers
- CORS allowlist

## ⚡ Backend Resilience
When the Render backend is asleep (cold start), the frontend:
- Detects the network failure automatically
- Shows a friendly "Server is waking up, please wait..." banner
- Auto-retries with exponential backoff (up to 10 attempts, max 15s delay)
- Never shows a broken/crashed UI
- Restores normally once server is online
