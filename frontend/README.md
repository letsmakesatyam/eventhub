# EventHub Frontend

Modern React SaaS frontend for the EventHub Event Registration & Ticketing Platform.

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + custom design system
- **Routing**: React Router v6
- **HTTP**: Axios with retry + server-wake detection
- **Icons**: Lucide React
- **Dates**: date-fns
- **QR Scanner**: html5-qrcode

## Quick Start

```bash
cd frontend
npm install
cp .env.example .env     # fill in your backend URL and Razorpay key
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. `https://your-api.onrender.com`) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay test key ID |

## Folder Structure

```
src/
├── App.jsx                   # Router, layout, protected routes
├── main.jsx                  # Entry point
├── index.css                 # Global styles + Tailwind + design tokens
├── lib/
│   └── api.js                # Axios client, all API functions, retry logic
├── context/
│   ├── AuthContext.jsx        # Auth state (login/logout/register)
│   └── ToastContext.jsx       # Toast notification system
├── hooks/
│   └── useServerStatus.js    # Backend wake detection + auto-retry
├── components/
│   ├── ui/
│   │   ├── Navbar.jsx         # Sticky nav with auth state
│   │   └── ServerStatusBanner.jsx  # "Server waking up" banner
│   └── events/
│       └── EventCard.jsx      # Event card + skeleton loader
└── pages/
    ├── HomePage.jsx           # Landing page
    ├── EventsPage.jsx         # Browse & filter events
    ├── EventDetailPage.jsx    # Event detail + Razorpay checkout
    ├── AuthPages.jsx          # Login + Register
    ├── MyTicketsPage.jsx      # User's tickets with QR display
    └── admin/
        ├── AdminDashboardPage.jsx   # Stats overview
        ├── AdminEventsPage.jsx      # CRUD events
        ├── AdminScannerPage.jsx     # QR scan validation
        ├── AdminRevenuePage.jsx     # Revenue by event
        └── AdminAttendeesPage.jsx   # Attendee list + CSV export
```

## Key Features

### Backend Resilience (Render Cold Start)
When the backend is sleeping (Render free tier), the app:
1. Detects the connection failure
2. Shows "Server is waking up, please wait..." banner
3. Auto-retries with exponential backoff (up to 10 attempts)
4. Restores normal UI when server responds

### Payment Flow
1. User clicks "Register Now"
2. Backend creates Razorpay order
3. Razorpay checkout modal opens
4. User completes payment
5. Backend verifies signature
6. Ticket + QR code generated
7. User redirected to My Tickets

### Admin Features
- Dashboard with KPI stats
- Full event CRUD with modal form
- QR scanner (camera + manual entry)
- Revenue report by event
- Attendee list with CSV export

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# From frontend/ directory
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_URL = https://your-api.onrender.com
# VITE_RAZORPAY_KEY_ID = rzp_test_...
```

Or push to GitHub and import project in Vercel dashboard.
