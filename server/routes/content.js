const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');
const AIService = require('../services/aiService');
const PlatformService = require('../services/platformService');

router.use(authenticateToken);

// Get all content
router.get('/', (req, res) => {
  const { status, platform, type } = req.query;
  let query = 'SELECT * FROM content WHERE business_id = ?';
  const params = [req.user.id];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (platform) { query += ' AND platform = ?'; params.push(platform); }
  if (type) { query += ' AND type = ?'; params.push(type); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

// AI Generate content
router.post('/generate', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const content = await AIService.generateContent({
      platform: req.body.platform,
      businessInfo: { name: business.name, industry: business.industry, website: business.website },
      productInfo: req.body.productInfo,
      targetAudience: req.body.targetAudience,
      contentType: req.body.contentType,
      tone: req.body.tone,
      language: req.body.language
    });

    // Save generated content
    const id = uuid();
    db.prepare(`
      INSERT INTO content (id, business_id, type, platform, title, body, hashtags, cta, ai_generated, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'draft')
    `).run(id, req.user.id, req.body.contentType || 'post', req.body.platform, content.headline, content.body, JSON.stringify(content.hashtags), content.cta);

    res.json({ id, ...content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish content to platforms
router.post('/:id/publish', async (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM content WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const connections = db.prepare('SELECT * FROM platform_connections WHERE business_id = ? AND status = ?').all(req.user.id, 'active');
    const platforms = req.body.platforms || [content.platform];

    const results = await PlatformService.publishToMultiplePlatforms(connections, {
      text: `${content.title}\n\n${content.body}`,
      platforms,
      link: req.body.link,
      imageUrl: req.body.imageUrl
    });

    db.prepare("UPDATE content SET status = 'published', published_at = CURRENT_TIMESTAMP WHERE id = ?").run(content.id);
    res.json({ results, content: { ...content, status: 'published' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Schedule content
router.post('/:id/schedule', (req, res) => {
  const { scheduled_at } = req.body;
  db.prepare("UPDATE content SET status = 'scheduled', scheduled_at = ? WHERE id = ? AND business_id = ?")
    .run(scheduled_at, req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
