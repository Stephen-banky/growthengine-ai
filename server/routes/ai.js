const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimiter');
const AIService = require('../services/aiService');
const db = require('../../config/database');

router.use(authenticateToken);
router.use(aiRateLimit); // Protect expensive AI API calls

// Helper: get business info or fallback defaults (handles in-memory DB reset in serverless)
function getBusinessInfo(userId) {
  try {
    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(userId);
    if (business) return { name: business.name, industry: business.industry, website: business.website };
  } catch (e) { /* db not ready or user not found */ }
  return { name: 'My Business', industry: 'General', website: '' };
}

// Generate content for any platform
router.post('/generate-content', async (req, res) => {
  try {
    const dbInfo = getBusinessInfo(req.user.id);
    // Map frontend fields to what AIService expects
    const businessInfo = {
      name: req.body.businessName || dbInfo.name,
      industry: req.body.industry || dbInfo.industry,
      website: dbInfo.website || ''
    };
    const result = await AIService.generateContent({
      platform: req.body.platform,
      businessInfo,
      productInfo: req.body.topic || req.body.productInfo || 'General marketing',
      targetAudience: req.body.targetAudience || 'Broad audience',
      contentType: req.body.contentType || 'promotional',
      tone: req.body.tone || 'professional',
      language: req.body.language || 'English'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate email sequence
router.post('/email-sequence', async (req, res) => {
  try {
    const businessInfo = getBusinessInfo(req.user.id);
    const result = await AIService.generateEmailSequence({
      businessInfo,
      trigger: req.body.trigger,
      goal: req.body.goal,
      emailCount: req.body.emailCount
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate targeting / strategy
router.post('/targeting', async (req, res) => {
  try {
    const dbInfo = getBusinessInfo(req.user.id);
    const businessInfo = {
      name: req.body.businessName || dbInfo.name,
      industry: req.body.industry || dbInfo.industry,
      website: dbInfo.website || ''
    };
    const result = await AIService.generateTargeting(
      businessInfo,
      req.body.productInfo || req.body.goal || 'General marketing'
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
    const businessInfo = getBusinessInfo(req.user.id);
    const result = await AIService.scoreLead(req.body.leadData, businessInfo);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
