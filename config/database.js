const path = require('path');
const fs = require('fs');

let db;

// Schema SQL for initializing tables
const SCHEMA_SQL = `
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
`;

const INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(business_id, status);
  CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
  CREATE INDEX IF NOT EXISTS idx_metrics_campaign ON campaign_metrics(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_business ON analytics_events(business_id);
  CREATE INDEX IF NOT EXISTS idx_content_business ON content(business_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_business ON job_postings(business_id);
  CREATE INDEX IF NOT EXISTS idx_applicants_job ON applicants(job_id);
  CREATE INDEX IF NOT EXISTS idx_applicants_business ON applicants(business_id);
`;

try {
  // Try native SQLite first (Render.com, local dev)
  // Dynamic require to prevent bundlers from failing
  const moduleName = 'better-sqlite3';
  const Database = require(moduleName);
  const DB_PATH = path.join(__dirname, '..', 'data', 'growthengine.db');
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA_SQL);
  db.exec(INDEX_SQL);
  console.log('[DB] Using better-sqlite3 (native)');
} catch (e) {
  // Fallback: sql.js (pure JS SQLite - works in serverless/Netlify Functions)
  console.log('[DB] better-sqlite3 not available, using sql.js (in-memory)');
  // Use the ASM.js build (no WASM file needed - works in serverless)
  const initSqlJs = require('sql.js/dist/sql-asm.js');

  // Create a wrapper that matches better-sqlite3 API
  class SqlJsWrapper {
    constructor() {
      this._ready = false;
      this._db = null;
      this._initPromise = this._init();
    }

    async _init() {
      const SQL = await initSqlJs();
      this._db = new SQL.Database();
      this._db.run('PRAGMA foreign_keys = ON');
      // Run schema
      const statements = (SCHEMA_SQL + INDEX_SQL).split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try { this._db.run(stmt + ';'); } catch (e) { /* ignore index/table exists */ }
      }
      this._ready = true;
      return this;
    }

    _ensureReady() {
      if (!this._ready) {
        throw new Error('Database not initialized yet. Await db.ready() first.');
      }
    }

    async ready() {
      await this._initPromise;
      return this;
    }

    pragma() { /* no-op for sql.js */ }

    exec(sql) {
      this._ensureReady();
      const statements = sql.split(';').filter(s => s.trim());
      for (const stmt of statements) {
        try { this._db.run(stmt + ';'); } catch(e) { /* ignore */ }
      }
    }

    prepare(sql) {
      const self = this;
      return {
        get(...params) {
          self._ensureReady();
          try {
            const stmt = self._db.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            if (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              const row = {};
              cols.forEach((c, i) => row[c] = vals[i]);
              stmt.free();
              return row;
            }
            stmt.free();
            return undefined;
          } catch(e) {
            console.error('[DB] prepare.get error:', e.message, 'SQL:', sql);
            return undefined;
          }
        },
        all(...params) {
          self._ensureReady();
          try {
            const results = [];
            const stmt = self._db.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            while (stmt.step()) {
              const cols = stmt.getColumnNames();
              const vals = stmt.get();
              const row = {};
              cols.forEach((c, i) => row[c] = vals[i]);
              results.push(row);
            }
            stmt.free();
            return results;
          } catch(e) {
            console.error('[DB] prepare.all error:', e.message, 'SQL:', sql);
            return [];
          }
        },
        run(...params) {
          self._ensureReady();
          try {
            self._db.run(sql, params);
            return { changes: self._db.getRowsModified(), lastInsertRowid: 0 };
          } catch(e) {
            console.error('[DB] prepare.run error:', e.message, 'SQL:', sql);
            return { changes: 0, lastInsertRowid: 0 };
          }
        }
      };
    }
  }

  db = new SqlJsWrapper();
}

module.exports = db;
