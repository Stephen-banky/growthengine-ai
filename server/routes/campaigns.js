const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');
const AIService = require('../services/aiService');

router.use(authenticateToken);

// Get all campaigns
router.get('/', (req, res) => {
  const campaigns = db.prepare(`
    SELECT c.*,
      COALESCE(SUM(m.impressions), 0) as total_impressions,
      COALESCE(SUM(m.clicks), 0) as total_clicks,
      COALESCE(SUM(m.conversions), 0) as total_conversions,
      COALESCE(SUM(m.leads_generated), 0) as total_leads,
      COALESCE(SUM(m.revenue), 0) as total_revenue
    FROM campaigns c
    LEFT JOIN campaign_metrics m ON c.id = m.campaign_id
    WHERE c.business_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(req.user.id);
  res.json(campaigns);
});

// Create campaign
router.post('/', (req, res) => {
  const id = uuid();
  const { name, type, platforms, target_audience, budget, content, start_date, end_date } = req.body;
  db.prepare(`
    INSERT INTO campaigns (id, business_id, name, type, platforms, target_audience, budget, content, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, type, JSON.stringify(platforms), JSON.stringify(target_audience), budget, JSON.stringify(content), start_date, end_date);

  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
  res.json(campaign);
});

// AI-generate campaign strategy
router.post('/ai-strategy', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const strategy = await AIService.generateCampaignStrategy({
      businessInfo: { name: business.name, industry: business.industry, website: business.website },
      goal: req.body.goal,
      budget: req.body.budget,
      duration: req.body.duration,
      targetMarket: req.body.targetMarket
    });
    res.json(strategy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaign metrics
router.get('/:id/metrics', (req, res) => {
  const metrics = db.prepare(`
    SELECT * FROM campaign_metrics WHERE campaign_id = ? ORDER BY date DESC
  `).all(req.params.id);
  res.json(metrics);
});

// Launch campaign
router.post('/:id/launch', async (req, res) => {
  try {
    db.prepare("UPDATE campaigns SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?")
      .run(req.params.id, req.user.id);

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    // Trigger platform publishing via PlatformService here
    res.json({ ...campaign, status: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pause campaign
router.post('/:id/pause', (req, res) => {
  db.prepare("UPDATE campaigns SET status = 'paused', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND business_id = ?")
    .run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
