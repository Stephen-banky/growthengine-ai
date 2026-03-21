const router = require('express').Router();
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// Dashboard overview stats
router.get('/dashboard', (req, res) => {
  const bid = req.user.id;
  const stats = {
    totalLeads: db.prepare('SELECT COUNT(*) as c FROM leads WHERE business_id = ?').get(bid).c,
    newLeadsToday: db.prepare("SELECT COUNT(*) as c FROM leads WHERE business_id = ? AND created_at >= date('now')").get(bid).c,
    newLeadsWeek: db.prepare("SELECT COUNT(*) as c FROM leads WHERE business_id = ? AND created_at >= date('now', '-7 days')").get(bid).c,
    activeCampaigns: db.prepare("SELECT COUNT(*) as c FROM campaigns WHERE business_id = ? AND status = 'active'").get(bid).c,
    totalCampaigns: db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE business_id = ?').get(bid).c,
    totalSpend: db.prepare('SELECT COALESCE(SUM(spent), 0) as s FROM campaigns WHERE business_id = ?').get(bid).s,
    totalRevenue: db.prepare('SELECT COALESCE(SUM(revenue), 0) as r FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).r,
    totalImpressions: db.prepare('SELECT COALESCE(SUM(impressions), 0) as i FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).i,
    totalClicks: db.prepare('SELECT COALESCE(SUM(clicks), 0) as cl FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).cl,
    totalConversions: db.prepare('SELECT COALESCE(SUM(conversions), 0) as cv FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).cv,
    conversionRate: 0,
    connectedPlatforms: db.prepare("SELECT COUNT(*) as c FROM platform_connections WHERE business_id = ? AND status = 'active'").get(bid).c,
    leadsByStatus: db.prepare('SELECT status, COUNT(*) as count FROM leads WHERE business_id = ? GROUP BY status').all(bid),
    leadsBySource: db.prepare('SELECT source, COUNT(*) as count FROM leads WHERE business_id = ? GROUP BY source ORDER BY count DESC LIMIT 10').all(bid),
    topCampaigns: db.prepare(`
      SELECT c.name, c.status, COALESCE(SUM(m.conversions), 0) as conversions,
        COALESCE(SUM(m.revenue), 0) as revenue, COALESCE(SUM(m.impressions), 0) as impressions
      FROM campaigns c LEFT JOIN campaign_metrics m ON c.id = m.campaign_id
      WHERE c.business_id = ? GROUP BY c.id ORDER BY conversions DESC LIMIT 5
    `).all(bid)
  };

  if (stats.totalClicks > 0) {
    stats.conversionRate = ((stats.totalConversions / stats.totalClicks) * 100).toFixed(2);
  }

  res.json(stats);
});

// Funnel analytics
router.get('/funnel', (req, res) => {
  const bid = req.user.id;
  const funnel = {
    awareness: db.prepare('SELECT COALESCE(SUM(impressions), 0) as value FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).value,
    interest: db.prepare('SELECT COALESCE(SUM(clicks), 0) as value FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).value,
    consideration: db.prepare('SELECT COALESCE(SUM(leads_generated), 0) as value FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).value,
    intent: db.prepare("SELECT COUNT(*) as value FROM leads WHERE business_id = ? AND status IN ('qualified', 'nurturing')").get(bid).value,
    conversion: db.prepare('SELECT COALESCE(SUM(conversions), 0) as value FROM campaign_metrics cm JOIN campaigns c ON cm.campaign_id = c.id WHERE c.business_id = ?').get(bid).value
  };
  res.json(funnel);
});

// Performance over time
router.get('/timeline', (req, res) => {
  const { days = 30 } = req.query;
  const data = db.prepare(`
    SELECT m.date, SUM(m.impressions) as impressions, SUM(m.clicks) as clicks,
      SUM(m.conversions) as conversions, SUM(m.spend) as spend, SUM(m.revenue) as revenue
    FROM campaign_metrics m JOIN campaigns c ON m.campaign_id = c.id
    WHERE c.business_id = ? AND m.date >= date('now', '-' || ? || ' days')
    GROUP BY m.date ORDER BY m.date
  `).all(req.user.id, parseInt(days));
  res.json(data);
});

// Platform performance comparison
router.get('/platforms', (req, res) => {
  const data = db.prepare(`
    SELECT m.platform, SUM(m.impressions) as impressions, SUM(m.clicks) as clicks,
      SUM(m.conversions) as conversions, SUM(m.spend) as spend, SUM(m.revenue) as revenue,
      AVG(m.ctr) as avg_ctr, AVG(m.conversion_rate) as avg_conversion_rate
    FROM campaign_metrics m JOIN campaigns c ON m.campaign_id = c.id
    WHERE c.business_id = ?
    GROUP BY m.platform
  `).all(req.user.id);
  res.json(data);
});

module.exports = router;
