require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { generalRateLimit } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/validate');

// ========== ENV VALIDATION ==========
const requiredEnvWarnings = [];
const envChecks = {
  JWT_SECRET: 'Auth tokens will use insecure default secret',
  ANTHROPIC_API_KEY: 'AI features will run in demo mode'
};
for (const [key, warning] of Object.entries(envChecks)) {
  if (!process.env[key]) {
    requiredEnvWarnings.push(`⚠ Missing ${key}: ${warning}`);
  }
}
if (requiredEnvWarnings.length > 0) {
  console.warn('\n=== ENVIRONMENT WARNINGS ===');
  requiredEnvWarnings.forEach(w => console.warn(w));
  console.warn('============================\n');
}

const app = express();

// ========== SECURITY MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS: restrict to known origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5000', 'https://aigrowtengine.netlify.app'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    callback(null, true); // Permissive for now; tighten in production
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global input sanitization
app.use(sanitizeBody);

// Global rate limiting on all API routes
app.use('/api', generalRateLimit);

// ========== REQUEST LOGGING ==========
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for']
    };
    if (res.statusCode >= 400) {
      console.error('[API]', JSON.stringify(logEntry));
    } else if (process.env.NODE_ENV !== 'production' || req.path === '/api/health') {
      // In production, only log errors and health checks to reduce noise
    } else {
      console.log('[API]', JSON.stringify(logEntry));
    }
    originalEnd.apply(this, args);
  };
  next();
});

// ========== API ROUTES ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/content', require('./routes/content'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/funnels', require('./routes/funnels'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/media', require('./routes/media'));
app.use('/api/recruitment', require('./routes/recruitment'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    engine: 'GrowthEngine AI',
    mode: 'serverless',
    uptime: process.uptime(),
    envWarnings: requiredEnvWarnings.length
  });
});

// ========== GLOBAL ERROR HANDLER ==========
app.use((err, req, res, _next) => {
  console.error('[UNHANDLED ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

module.exports = { app };
