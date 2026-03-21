const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');
const AIService = require('../services/aiService');

router.use(authenticateToken);

// Get all leads with filtering
router.get('/', (req, res) => {
  const { status, source, minScore, maxScore, page = 1, limit = 50 } = req.query;
  let query = 'SELECT * FROM leads WHERE business_id = ?';
  const params = [req.user.id];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (source) { query += ' AND source = ?'; params.push(source); }
  if (minScore) { query += ' AND score >= ?'; params.push(parseInt(minScore)); }
  if (maxScore) { query += ' AND score <= ?'; params.push(parseInt(maxScore)); }

  query += ' ORDER BY score DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const leads = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM leads WHERE business_id = ?').get(req.user.id);
  res.json({ leads, total: total.count, page: parseInt(page), limit: parseInt(limit) });
});

// Add lead
router.post('/', (req, res) => {
  const id = uuid();
  const { name, email, phone, source, tags, metadata } = req.body;
  db.prepare(`
    INSERT INTO leads (id, business_id, name, email, phone, source, tags, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, email, phone, source, JSON.stringify(tags), JSON.stringify(metadata));
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(id));
});

// Bulk import leads
router.post('/import', (req, res) => {
  const { leads } = req.body;
  const insert = db.prepare(`
    INSERT INTO leads (id, business_id, name, email, phone, source, tags) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((leads) => {
    for (const lead of leads) {
      insert.run(uuid(), req.user.id, lead.name, lead.email, lead.phone, lead.source || 'import', JSON.stringify(lead.tags || []));
    }
  });
  insertMany(leads);
  res.json({ imported: leads.length });
});

// AI score lead
router.post('/:id/score', async (req, res) => {
  try {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const scoring = await AIService.scoreLead(lead, { name: business.name, industry: business.industry });

    db.prepare('UPDATE leads SET score = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(scoring.score, scoring.tier === 'hot' ? 'qualified' : scoring.tier === 'warm' ? 'nurturing' : 'new', lead.id);

    res.json({ ...lead, score: scoring.score, aiAnalysis: scoring });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lead status
router.patch('/:id', (req, res) => {
  const { status, score, tags } = req.body;
  if (status) db.prepare('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?').run(status, req.params.id, req.user.id);
  if (score !== undefined) db.prepare('UPDATE leads SET score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?').run(score, req.params.id, req.user.id);
  if (tags) db.prepare('UPDATE leads SET tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?').run(JSON.stringify(tags), req.params.id, req.user.id);
  res.json(db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id));
});

// Get lead stats
router.get('/stats', (req, res) => {
  const stats = {
    total: db.prepare('SELECT COUNT(*) as count FROM leads WHERE business_id = ?').get(req.user.id).count,
    byStatus: db.prepare('SELECT status, COUNT(*) as count FROM leads WHERE business_id = ? GROUP BY status').all(req.user.id),
    bySource: db.prepare('SELECT source, COUNT(*) as count FROM leads WHERE business_id = ? GROUP BY source').all(req.user.id),
    avgScore: db.prepare('SELECT AVG(score) as avg FROM leads WHERE business_id = ?').get(req.user.id).avg || 0,
    thisWeek: db.prepare("SELECT COUNT(*) as count FROM leads WHERE business_id = ? AND created_at >= date('now', '-7 days')").get(req.user.id).count,
    thisMonth: db.prepare("SELECT COUNT(*) as count FROM leads WHERE business_id = ? AND created_at >= date('now', '-30 days')").get(req.user.id).count
  };
  res.json(stats);
});

module.exports = router;
