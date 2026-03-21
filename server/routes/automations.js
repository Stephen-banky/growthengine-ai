const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM automations WHERE business_id = ? ORDER BY created_at DESC').all(req.user.id));
});

router.post('/', (req, res) => {
  const id = uuid();
  const { name, trigger_type, trigger_config, actions } = req.body;
  db.prepare('INSERT INTO automations (id, business_id, name, trigger_type, trigger_config, actions) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.user.id, name, trigger_type, JSON.stringify(trigger_config), JSON.stringify(actions));
  res.json(db.prepare('SELECT * FROM automations WHERE id = ?').get(id));
});

router.patch('/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE automations SET status = ? WHERE id = ? AND business_id = ?').run(status, req.params.id, req.user.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM automations WHERE id = ? AND business_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
