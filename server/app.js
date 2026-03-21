require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', engine: 'GrowthEngine AI', mode: 'serverless' });
});

module.exports = { app };
