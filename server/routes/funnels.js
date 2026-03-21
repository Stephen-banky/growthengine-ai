const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM funnels WHERE business_id = ? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/', (req, res) => {
  const id = uuid();
  const { name, stages, conversion_targets } = req.body;
  db.prepare('INSERT INTO funnels (id, business_id, name, stages, conversion_targets) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, name, JSON.stringify(stages), JSON.stringify(conversion_targets));
  res.json(db.prepare('SELECT * FROM funnels WHERE id = ?').get(id));
});

router.post('/:id/event', (req, res) => {
  const id = uuid();
  const { lead_id, stage, action, metadata } = req.body;
  db.prepare('INSERT INTO funnel_events (id, funnel_id, lead_id, stage, action, metadata) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, lead_id, stage, action, JSON.stringify(metadata));
  res.json({ success: true });
});

router.get('/:id/analytics', (req, res) => {
  const events = db.prepare(`
    SELECT stage, COUNT(DISTINCT lead_id) as leads, COUNT(*) as events
    FROM funnel_events WHERE funnel_id = ? GROUP BY stage
  `).all(req.params.id);
  res.json(events);
});

module.exports = router;
