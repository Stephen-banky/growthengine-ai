const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const AIService = require('../services/aiService');
const db = require('../../config/database');

router.use(authenticateToken);

// Generate content for any platform
router.post('/generate-content', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const result = await AIService.generateContent({
      ...req.body,
      businessInfo: { name: business.name, industry: business.industry, website: business.website }
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate email sequence
router.post('/email-sequence', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const result = await AIService.generateEmailSequence({
      businessInfo: { name: business.name, industry: business.industry },
      trigger: req.body.trigger,
      goal: req.body.goal,
      emailCount: req.body.emailCount
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate targeting
router.post('/targeting', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const result = await AIService.generateTargeting(
      { name: business.name, industry: business.industry },
      req.body.productInfo
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optimize ad copy
router.post('/optimize-ad', async (req, res) => {
  try {
    const result = await AIService.optimizeAdCopy(req.body.currentAd, req.body.performanceData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Score lead
router.post('/score-lead', async (req, res) => {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);
    const result = await AIService.scoreLead(req.body.leadData, { name: business.name, industry: business.industry });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
