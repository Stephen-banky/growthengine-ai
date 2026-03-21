const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');
const RecruitmentService = require('../services/recruitmentService');

router.use(authenticateToken);

// ==================== JOB POSTINGS ====================

// Get all job postings
router.get('/jobs', (req, res) => {
  const jobs = db.prepare(`
    SELECT * FROM job_postings WHERE business_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  res.json(jobs);
});

// Create job posting
router.post('/jobs', (req, res) => {
  const id = uuid();
  const { title, department, location, type, salary_min, salary_max, description, requirements, benefits } = req.body;
  db.prepare(`
    INSERT INTO job_postings (id, business_id, title, department, location, type, salary_min, salary_max, description, requirements, benefits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, title, department, location, type, salary_min, salary_max, description, JSON.stringify(requirements), JSON.stringify(benefits));
  res.json(db.prepare('SELECT * FROM job_postings WHERE id = ?').get(id));
});

// AI-generate job ad content
router.post('/jobs/:id/generate-ad', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM job_postings WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.user.id);

    const adContent = await RecruitmentService.generateJobAd({
      role: job.title,
      company: { name: business.name, industry: business.industry, website: business.website },
      industry: business.industry,
      location: job.location,
      type: job.type,
      salary: job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'Competitive',
      requirements: JSON.parse(job.requirements || '[]'),
      benefits: JSON.parse(job.benefits || '[]'),
      tone: req.body.tone,
      platforms: req.body.platforms || ['linkedin', 'facebook', 'twitter', 'indeed']
    });

    // Store generated content
    db.prepare('UPDATE job_postings SET ai_ad_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(JSON.stringify(adContent), job.id);

    res.json(adContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Launch recruitment campaign across platforms
router.post('/jobs/:id/launch-campaign', async (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM job_postings WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const adContent = JSON.parse(job.ai_ad_content || '{}');
    const connections = db.prepare("SELECT * FROM platform_connections WHERE business_id = ? AND status = 'active'").all(req.user.id);
    const platforms = req.body.platforms || ['linkedin', 'facebook', 'twitter'];

    const results = await RecruitmentService.launchRecruitmentCampaign(connections, adContent, req.body.budget, platforms);

    // Create campaign record
    const campaignId = uuid();
    db.prepare(`
      INSERT INTO campaigns (id, business_id, name, type, platforms, budget, status)
      VALUES (?, ?, ?, 'recruitment', ?, ?, 'active')
    `).run(campaignId, req.user.id, `Hiring: ${job.title}`, JSON.stringify(platforms), req.body.budget || 0);

    db.prepare("UPDATE job_postings SET status = 'active', campaign_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(campaignId, job.id);

    res.json({ campaignId, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== APPLICANTS ====================

// Get applicants for a job
router.get('/jobs/:id/applicants', (req, res) => {
  const applicants = db.prepare(`
    SELECT * FROM applicants WHERE job_id = ? ORDER BY score DESC, created_at DESC
  `).all(req.params.id);
  res.json(applicants);
});

// Add applicant (manual or webhook)
router.post('/jobs/:id/applicants', (req, res) => {
  const id = uuid();
  const { name, email, phone, resume_url, linkedin_url, source, cover_letter, experience_years, skills } = req.body;
  db.prepare(`
    INSERT INTO applicants (id, job_id, business_id, name, email, phone, resume_url, linkedin_url, source, cover_letter, experience_years, skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user.id, name, email, phone, resume_url, linkedin_url, source, cover_letter, experience_years, JSON.stringify(skills));
  res.json(db.prepare('SELECT * FROM applicants WHERE id = ?').get(id));
});

// AI-score applicant
router.post('/applicants/:id/score', async (req, res) => {
  try {
    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ? AND business_id = ?').get(req.params.id, req.user.id);
    if (!applicant) return res.status(404).json({ error: 'Applicant not found' });

    const job = db.prepare('SELECT * FROM job_postings WHERE id = ?').get(applicant.job_id);

    const scoring = await RecruitmentService.scoreApplicant(
      {
        name: applicant.name, experience_years: applicant.experience_years,
        skills: JSON.parse(applicant.skills || '[]'), linkedin_url: applicant.linkedin_url
      },
      { title: job.title, requirements: JSON.parse(job.requirements || '[]') }
    );

    db.prepare('UPDATE applicants SET score = ?, ai_analysis = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(scoring.score, JSON.stringify(scoring), scoring.interviewRecommendation ? 'interview' : 'review', applicant.id);

    res.json({ ...applicant, score: scoring.score, aiAnalysis: scoring });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update applicant status
router.patch('/applicants/:id', (req, res) => {
  const { status, notes } = req.body;
  if (status) db.prepare('UPDATE applicants SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  if (notes) db.prepare('UPDATE applicants SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(notes, req.params.id);
  res.json(db.prepare('SELECT * FROM applicants WHERE id = ?').get(req.params.id));
});

// Generate outreach to passive candidate
router.post('/outreach', async (req, res) => {
  try {
    const result = await RecruitmentService.generateCandidateOutreach(
      req.body.candidateProfile,
      req.body.jobInfo,
      req.body.channel || 'linkedin'
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recruitment dashboard stats
router.get('/stats', (req, res) => {
  const bid = req.user.id;
  res.json({
    activeJobs: db.prepare("SELECT COUNT(*) as c FROM job_postings WHERE business_id = ? AND status = 'active'").get(bid).c,
    totalJobs: db.prepare('SELECT COUNT(*) as c FROM job_postings WHERE business_id = ?').get(bid).c,
    totalApplicants: db.prepare('SELECT COUNT(*) as c FROM applicants WHERE business_id = ?').get(bid).c,
    newApplicantsToday: db.prepare("SELECT COUNT(*) as c FROM applicants WHERE business_id = ? AND created_at >= date('now')").get(bid).c,
    newApplicantsWeek: db.prepare("SELECT COUNT(*) as c FROM applicants WHERE business_id = ? AND created_at >= date('now', '-7 days')").get(bid).c,
    interviewStage: db.prepare("SELECT COUNT(*) as c FROM applicants WHERE business_id = ? AND status = 'interview'").get(bid).c,
    hired: db.prepare("SELECT COUNT(*) as c FROM applicants WHERE business_id = ? AND status = 'hired'").get(bid).c,
    bySource: db.prepare('SELECT source, COUNT(*) as count FROM applicants WHERE business_id = ? GROUP BY source ORDER BY count DESC').all(bid),
    byStatus: db.prepare('SELECT status, COUNT(*) as count FROM applicants WHERE business_id = ? GROUP BY status').all(bid),
    avgScore: db.prepare('SELECT AVG(score) as avg FROM applicants WHERE business_id = ? AND score > 0').get(bid).avg || 0,
    topJobs: db.prepare(`
      SELECT jp.title, jp.status, COUNT(a.id) as applicants, AVG(a.score) as avg_score
      FROM job_postings jp LEFT JOIN applicants a ON jp.id = a.job_id
      WHERE jp.business_id = ? GROUP BY jp.id ORDER BY applicants DESC LIMIT 5
    `).all(bid)
  });
});

module.exports = router;
