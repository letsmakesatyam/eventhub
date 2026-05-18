require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const paymentsRoutes = require('./routes/payments');
const ticketsRoutes = require('./routes/tickets');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middlewares
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl, mobile)
    if (!origin) return callback(null, true);
    // Allow any *.onrender.com (covers all Render deployments)
    if (/^https:\/\/[^.]+\.onrender\.com$/.test(origin)) return callback(null, true);
    // Allow any *.vercel.app
    if (/^https:\/\/[^.]+\.vercel\.app$/.test(origin)) return callback(null, true);
    // Allow explicit list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed - ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight for all routes
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' }
});

app.use(limiter);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check - critical for Render cold start detection
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'EventHub API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/docs'
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/admin', adminRoutes);

// API docs (basic)
app.get('/api/docs', (req, res) => {
  res.json({
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      events: ['GET /api/events', 'GET /api/events/:id', 'POST /api/events (admin)', 'PUT /api/events/:id (admin)'],
      payments: ['POST /api/payments/create-order', 'POST /api/payments/verify', 'POST /api/payments/register-free'],
      tickets: ['GET /api/tickets/my', 'GET /api/tickets/:id', 'POST /api/tickets/validate (admin)'],
      admin: ['GET /api/admin/dashboard', 'GET /api/admin/revenue', 'GET /api/admin/events/:id/attendees']
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 EventHub API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});

module.exports = app;