// Input validation & sanitization middleware

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // strip angle brackets (basic XSS)
    .trim()
    .substring(0, 5000); // max length cap
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      clean[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      clean[key] = value.map(v => typeof v === 'string' ? sanitizeString(v) : v);
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeObject(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// Middleware: sanitize all req.body strings
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate auth registration input
function validateRegistration(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || name.length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !isValidEmail(email)) errors.push('Valid email is required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }
  next();
}

// Validate login input
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  next();
}

module.exports = { sanitizeBody, validateRegistration, validateLogin, isValidEmail };
