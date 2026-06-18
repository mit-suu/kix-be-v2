const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const route = require('./routes');
const logger = require('./middlewares/logger');
const setupSwagger = require('./config/swagger');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000', // Web
  'http://localhost:3001',  // Vite dev server (fallback port)
  'http://localhost:8081',  // Expo app
  'http://localhost:19006', // Expo web
  'https://kix-fe.vercel.app',
  'https://kix.trantuanhiep.site',
  'https://kix-iw8jj7fjg-tieens-04s-projects.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile native, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true, // Cho phép gửi cookie (refresh token httpOnly)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.options('{*any}', cors(corsOptions)); // Xử lý preflight request
app.use(cors(corsOptions));

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
logger(app);

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'KIX API is running',
    dbState: mongoose.connection.readyState,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: {
      state: mongoose.connection.readyState,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  });
});

// ── SWAGGER ───────────────────────────────────────────────────────────────────
setupSwagger(app);

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();

  return res.status(503).json({
    success: false,
    message: 'Database is not connected',
    dbState: mongoose.connection.readyState,
  });
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
route(app);

module.exports = app;
