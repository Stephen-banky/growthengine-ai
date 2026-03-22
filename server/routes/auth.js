const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin } = require('../middleware/validate');

// Rate limit auth routes (brute force protection)
router.use(authRateLimit);

// Register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password, industry, website } = req.body;
    const existing = db.prepare('SELECT id FROM businesses WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const id = uuid();
    const password_hash = await bcrypt.hash(password, 12);
    db.prepare(
      'INSERT INTO businesses (id, name, email, password_hash, industry, website) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, email, password_hash, industry || '', website || '');

    const token = generateToken({ id, email, name });
    res.json({ token, business: { id, name, email, industry, website, plan: 'starter' } });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const business = db.prepare('SELECT * FROM businesses WHERE email = ?').get(email);
    if (!business) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, business.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken({ id: business.id, email: business.email, name: business.name });
    delete business.password_hash;
    res.json({ token, business });
  } catch (err) {
    console.error('[AUTH] Login error:', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Refresh token (extend session without re-login)
router.post('/refresh', authenticateToken, (req, res) => {
  try {
    const business = db.prepare('SELECT id, email, name FROM businesses WHERE id = ?').get(req.user.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    const token = generateToken({ id: business.id, email: business.email, name: business.name });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });
  delete business.password_hash;
  res.json(business);
});

module.exports = router;
