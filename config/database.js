const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'growthengine.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize all tables
db.exec(`
  -- Users / Businesses
  CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    logo_url TEXT,
    plan TEXT DEFAULT 'starter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Connected platform accounts
  CREATE TABLE IF NOT EXISTS platform_connections (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    account_id TEXT,
    account_name TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    status TEXT DEFAULT 'active',
    metadata TEXT,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Leads / Contacts
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT,
    source_campaign_id TEXT,
    status TEXT DEFAULT 'new',
    score INTEGER DEFAULT 0,
    tags TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Campaigns
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    platforms TEXT,
    target_audience TEXT,
    budget REAL DEFAULT 0,
    spent REAL DEFAULT 0,
    content TEXT,
    ai_generated INTEGER DEFAULT 0,
    schedule TEXT,
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Campaign Performance Metrics
  CREATE TABLE IF NOT EXISTS campaign_metrics (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    date DATE NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend REAL DEFAULT 0,
    revenue REAL DEFAULT 0,
    ctr REAL DEFAULT 0,
    cpc REAL DEFAULT 0,
    cpl REAL DEFAULT 0,
    conversion_rate REAL DEFAULT 0,
    roas REAL DEFAULT 0,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  -- Content Library
  CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    campaign_id TEXT,
    type TEXT NOT NULL,
    platform TEXT,
    title TEXT,
    body TEXT,
    media_urls TEXT,
    hashtags TEXT,
    cta TEXT,
    ai_generated INTEGER DEFAULT 0,
    performance_score REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    scheduled_at DATETIME,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Funnels
  CREATE TABLE IF NOT EXISTS funnels (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    stages TEXT NOT NULL,
    conversion_targets TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Funnel Stage Tracking
  CREATE TABLE IF NOT EXISTS funnel_events (
    id TEXT PRIMARY KEY,
    funnel_id TEXT NOT NULL,
    lead_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    action TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (funnel_id) REFERENCES funnels(id),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
  );

  -- Automation Workflows
  CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    trigger_config TEXT,
    actions TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    executions INTEGER DEFAULT 0,
    last_executed DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- A/B Test Variants
  CREATE TABLE IF NOT EXISTS ab_tests (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    content TEXT,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    confidence REAL DEFAULT 0,
    is_winner INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
  );

  -- Email Sequences
  CREATE TABLE IF NOT EXISTS email_sequences (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    emails TEXT NOT NULL,
    trigger_event TEXT,
    delay_config TEXT,
    status TEXT DEFAULT 'active',
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Job Postings (Recruitment)
  CREATE TABLE IF NOT EXISTS job_postings (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    type TEXT DEFAULT 'full-time',
    salary_min REAL,
    salary_max REAL,
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    ai_ad_content TEXT,
    campaign_id TEXT,
    status TEXT DEFAULT 'draft',
    applications_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Applicants
  CREATE TABLE IF NOT EXISTS applicants (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    resume_url TEXT,
    linkedin_url TEXT,
    source TEXT,
    cover_letter TEXT,
    experience_years INTEGER,
    skills TEXT,
    score INTEGER DEFAULT 0,
    ai_analysis TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_postings(id),
    FOREIGN KEY (business_id) REFERENCES businesses(id)
  );

  -- Analytics Events
  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    business_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    source TEXT,
    campaign_id TEXT,
    lead_id TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(business_id, status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
  CREATE INDEX IF NOT EXISTS idx_metrics_campaign ON campaign_metrics(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_business ON analytics_events(business_id);
  CREATE INDEX IF NOT EXISTS idx_content_business ON content(business_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_business ON job_postings(business_id);
  CREATE INDEX IF NOT EXISTS idx_applicants_job ON applicants(job_id);
  CREATE INDEX IF NOT EXISTS idx_applicants_business ON applicants(business_id);
`);

module.exports = db;
