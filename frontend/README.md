# EventHub — Frontend

React + Vite frontend for the EventHub platform. Covers public event discovery, user registration and ticketing flow, and an admin dashboard for event management.

## Tech

- **React 18** with functional components throughout
- **Vite** for dev server and builds
- **Tailwind CSS** with a custom design system (CSS variables for theming, dark mode via `.dark` class)
- **React Router v6** with `HashRouter` (so it works on Vercel without needing rewrites)
- **Axios** with a custom retry wrapper that handles Render cold starts
- **Lucide React** for icons
- **html5-qrcode** for camera-based QR scanning in the admin scanner page

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key ID for the checkout modal |

## Pages

**Public**
- `/` — landing page
- `/events` — browse events, filter by category
- `/events/:id` — event detail with registration / Razorpay checkout button

**Auth**
- `/login`
- `/register`
- `/register-admin` — creates an admin account directly

**User (requires login)**
- `/my-tickets` — list of registered tickets with QR code display

**Admin (requires admin role)**
- `/admin` — dashboard with summary stats and quick links
- `/admin/events` — create, edit, delete events via a modal form
- `/admin/scanner` — validate tickets by camera scan or manual QR data entry
- `/admin/revenue` — revenue breakdown by event
- `/admin/attendees/:eventId` — attendees for a specific event
- `/admin/users` — view registered users, create new admin accounts

## A few implementation notes

**Render cold start handling** — The backend on Render's free plan goes to sleep after inactivity. `useServerStatus.js` detects this by watching for network errors, shows a "server is waking up" banner, and retries with exponential backoff (up to 10 attempts, max 15s between retries). This way the UI never just breaks.

**Dark mode** — Uses Tailwind's class strategy (`darkMode: 'class'`). A `ThemeProvider` toggles `.dark` on the `<html>` element and persists the preference to localStorage. All components use `dark:` variants explicitly.

**Payment flow** — The `EventDetailPage` calls the backend to create a Razorpay order, opens the Razorpay JS checkout modal, then sends the payment signature to `/api/payments/verify` for server-side validation before a ticket is issued.

**QR scanner** — `html5-qrcode` is loaded lazily (dynamic import) to avoid bundling it when not needed. The scanner page requires selecting an event first; the event ID is sent alongside the QR data to the validate endpoint so a ticket can't accidentally be checked in for the wrong event.

**Protected routes** — `ProtectedRoute` reads from `AuthContext`. Admin routes additionally check `user.role === 'admin'` and redirect to `/` if not met.

## Project structure

```
src/
├── App.jsx                    routes, layout, ProtectedRoute
├── index.css                  global styles, Tailwind base, dark mode tokens
├── lib/
│   └── api.js                 Axios instance + all API call functions
├── context/
│   ├── AuthContext.jsx         login / logout / register state
│   ├── ThemeContext.jsx        dark/light toggle
│   └── ToastContext.jsx        toast notification queue
├── hooks/
│   └── useServerStatus.js     backend wake detection
├── components/
│   ├── ui/Navbar.jsx
│   ├── ui/ServerStatusBanner.jsx
│   └── events/EventCard.jsx
└── pages/
    ├── HomePage.jsx
    ├── EventsPage.jsx
    ├── EventDetailPage.jsx
    ├── AuthPages.jsx           LoginPage, RegisterPage, AdminRegisterPage
    ├── MyTicketsPage.jsx
    └── admin/
        ├── AdminDashboardPage.jsx
        ├── AdminEventsPage.jsx
        ├── AdminScannerPage.jsx
        ├── AdminRevenuePage.jsx
        ├── AdminAttendeesPage.jsx
        └── AdminUsersPage.jsx
```

## Build & deploy

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build locally
```

For Vercel: import the repo, set root directory to `frontend/`, framework preset to Vite, and add the two env variables. That's it.
