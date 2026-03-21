const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Get connected platforms
router.get('/', (req, res) => {
  const connections = db.prepare('SELECT id, platform, account_name, status, connected_at FROM platform_connections WHERE business_id = ?').all(req.user.id);
  res.json(connections);
});

// Connect platform
router.post('/connect', (req, res) => {
  const id = uuid();
  const { platform, account_id, account_name, access_token, refresh_token, token_expires_at, metadata } = req.body;
  db.prepare(`
    INSERT INTO platform_connections (id, business_id, platform, account_id, account_name, access_token, refresh_token, token_expires_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, platform, account_id, account_name, access_token, refresh_token, token_expires_at, JSON.stringify(metadata));
  res.json({ id, platform, account_name, status: 'active' });
});

// Disconnect platform
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM platform_connections WHERE id = ? AND business_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

// Get available platforms info
router.get('/available', (req, res) => {
  res.json([
    { id: 'facebook', name: 'Facebook', icon: 'facebook', category: 'social', features: ['posts', 'ads', 'messenger', 'groups'] },
    { id: 'instagram', name: 'Instagram', icon: 'instagram', category: 'social', features: ['posts', 'stories', 'reels', 'ads'] },
    { id: 'twitter', name: 'X (Twitter)', icon: 'twitter', category: 'social', features: ['tweets', 'ads', 'spaces'] },
    { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', category: 'social', features: ['posts', 'ads', 'inmails'] },
    { id: 'tiktok', name: 'TikTok', icon: 'tiktok', category: 'social', features: ['videos', 'ads', 'shop'] },
    { id: 'youtube', name: 'YouTube', icon: 'youtube', category: 'social', features: ['videos', 'shorts', 'ads'] },
    { id: 'whatsapp', name: 'WhatsApp Business', icon: 'whatsapp', category: 'messaging', features: ['messages', 'templates', 'catalog'] },
    { id: 'email', name: 'Email (SMTP)', icon: 'email', category: 'messaging', features: ['campaigns', 'sequences', 'automation'] },
    { id: 'google_ads', name: 'Google Ads', icon: 'google', category: 'advertising', features: ['search', 'display', 'shopping', 'youtube'] }
  ]);
});

module.exports = router;
