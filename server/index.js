require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { generalRateLimit } = require('./middleware/rateLimiter');
const { sanitizeBody } = require('./middleware/validate');

// ========== ENV VALIDATION ==========
const missingCritical = [];
if (!process.env.JWT_SECRET) missingCritical.push('JWT_SECRET');
if (missingCritical.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('FATAL: Missing critical environment variables:', missingCritical.join(', '));
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

// Socket.io with restricted CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5000', 'https://aigrowtengine.netlify.app'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Production-appropriate logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeBody);
app.use('/api', generalRateLimit);

// API Routes
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

// Serve static files from project root (index.html dashboard)
app.use(express.static(path.join(__dirname, '..')));

// Fallback: serve index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('[WS] Client connected:', socket.id);

  socket.on('join-business', (businessId) => {
    socket.join(`business-${businessId}`);
  });

  socket.on('disconnect', () => {
    console.log('[WS] Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    engine: 'GrowthEngine AI',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[ERROR]', new Date().toISOString(), req.method, req.path, err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║        GROWTHENGINE AI - Server Running       ║
  ║        Port: ${PORT}                             ║
  ║        Environment: ${process.env.NODE_ENV || 'development'}            ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = { app, io };
