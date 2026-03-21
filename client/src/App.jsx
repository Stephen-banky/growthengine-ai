import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  BarChart3, Users, Megaphone, Zap, Target, TrendingUp, Mail, MessageSquare,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Phone, Send,
  ChevronRight, ChevronDown, Plus, Settings, Search, Bell, Filter, Download,
  ArrowUpRight, ArrowDownRight, Eye, MousePointerClick, DollarSign, Star,
  Sparkles, Brain, Layers, GitBranch, Clock, CheckCircle2, XCircle,
  PieChart, Activity, LayoutDashboard, FolderOpen, Bot, Workflow,
  RefreshCw, ExternalLink, MoreHorizontal, Play, Pause, Trash2, Edit3, Copy,
  Briefcase, UserPlus, FileText, Award, MapPin, Building2, GraduationCap, CalendarCheck
} from 'lucide-react';

// ============================================================
//  CONTEXT & HOOKS
// ============================================================
const AppContext = createContext();
const useApp = () => useContext(AppContext);

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function api(path, opts = {}) {
  const token = localStorage.getItem('ge_token');
  return fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  }).then(r => r.json());
}

// ============================================================
//  DEMO DATA (for showcasing without backend)
// ============================================================
const DEMO = {
  stats: {
    totalLeads: 12847, newLeadsToday: 143, newLeadsWeek: 892,
    activeCampaigns: 8, totalCampaigns: 23, totalSpend: 15420,
    totalRevenue: 128900, totalImpressions: 2450000, totalClicks: 89200,
    totalConversions: 4260, conversionRate: 82.4, connectedPlatforms: 7,
    leadsByStatus: [
      { status: 'new', count: 2340 }, { status: 'qualified', count: 4120 },
      { status: 'nurturing', count: 3890 }, { status: 'converted', count: 2497 }
    ],
    leadsBySource: [
      { source: 'Facebook Ads', count: 3420 }, { source: 'Instagram', count: 2810 },
      { source: 'Google Ads', count: 2190 }, { source: 'LinkedIn', count: 1560 },
      { source: 'WhatsApp', count: 1230 }, { source: 'TikTok', count: 890 },
      { source: 'Email', count: 747 }
    ],
    topCampaigns: [
      { name: 'Summer Product Launch', status: 'active', conversions: 1240, revenue: 45600, impressions: 890000 },
      { name: 'LinkedIn B2B Outreach', status: 'active', conversions: 890, revenue: 34200, impressions: 340000 },
      { name: 'TikTok Viral Push', status: 'active', conversions: 760, revenue: 22100, impressions: 1200000 },
      { name: 'Email Nurture Sequence', status: 'active', conversions: 620, revenue: 18900, impressions: 45000 },
      { name: 'Google Search Ads', status: 'paused', conversions: 450, revenue: 8100, impressions: 210000 }
    ]
  },
  funnel: { awareness: 2450000, interest: 89200, consideration: 12847, intent: 8010, conversion: 4260 },
  timeline: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    impressions: Math.floor(60000 + Math.random() * 40000),
    clicks: Math.floor(2000 + Math.random() * 2000),
    conversions: Math.floor(100 + Math.random() * 100),
    spend: Math.floor(400 + Math.random() * 200),
    revenue: Math.floor(3000 + Math.random() * 2000)
  })),
  leads: Array.from({ length: 20 }, (_, i) => ({
    id: `lead-${i}`, name: ['Sarah Chen', 'Marcus Johnson', 'Aisha Patel', 'David Kim', 'Elena Rodriguez', 'James Okafor', 'Mia Zhang', 'Carlos Silva', 'Fatima Al-Hassan', 'Tom Wright', 'Priya Sharma', 'Alex Müller', 'Yuki Tanaka', 'Omar Diallo', 'Lisa Park', 'Raj Gupta', 'Anna Kowalski', 'Mohamed Ali', 'Sophie Laurent', 'Chris O\'Brien'][i],
    email: `lead${i}@example.com`, phone: `+1555${String(i).padStart(7, '0')}`,
    source: ['Facebook Ads', 'Instagram', 'Google Ads', 'LinkedIn', 'WhatsApp', 'TikTok', 'Email'][i % 7],
    status: ['new', 'qualified', 'nurturing', 'converted'][i % 4],
    score: Math.floor(40 + Math.random() * 60),
    created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
  })),
  campaigns: [
    { id: 'c1', name: 'Summer Product Launch', type: 'multi-channel', status: 'active', platforms: '["facebook","instagram","tiktok"]', budget: 5000, spent: 3420, created_at: '2026-02-15' },
    { id: 'c2', name: 'LinkedIn B2B Outreach', type: 'lead-gen', status: 'active', platforms: '["linkedin","email"]', budget: 3000, spent: 2100, created_at: '2026-02-20' },
    { id: 'c3', name: 'TikTok Viral Push', type: 'awareness', status: 'active', platforms: '["tiktok","instagram"]', budget: 2000, spent: 1800, created_at: '2026-03-01' },
    { id: 'c4', name: 'Email Nurture Sequence', type: 'nurture', status: 'active', platforms: '["email","whatsapp"]', budget: 500, spent: 320, created_at: '2026-03-05' },
    { id: 'c5', name: 'Google Search Ads', type: 'search', status: 'paused', platforms: '["google_ads"]', budget: 4000, spent: 3800, created_at: '2026-01-10' },
    { id: 'c6', name: 'Retargeting - Website Visitors', type: 'retargeting', status: 'active', platforms: '["facebook","google_ads"]', budget: 2500, spent: 1980, created_at: '2026-03-10' }
  ]
};

// ============================================================
//  STYLES
// ============================================================
const colors = {
  bg: '#0a0f1a', bgCard: '#111827', bgHover: '#1a2332',
  border: '#1e293b', borderHover: '#334155',
  text: '#f1f5f9', textSecondary: '#94a3b8', textMuted: '#64748b',
  primary: '#3b82f6', primaryHover: '#2563eb', primarySoft: 'rgba(59,130,246,0.1)',
  green: '#10b981', greenSoft: 'rgba(16,185,129,0.1)',
  red: '#ef4444', redSoft: 'rgba(239,68,68,0.1)',
  yellow: '#f59e0b', yellowSoft: 'rgba(245,158,11,0.1)',
  purple: '#8b5cf6', purpleSoft: 'rgba(139,92,246,0.1)',
  cyan: '#06b6d4', cyanSoft: 'rgba(6,182,212,0.1)',
  pink: '#ec4899', pinkSoft: 'rgba(236,72,153,0.1)',
  orange: '#f97316'
};

const platformIcons = {
  facebook: { icon: Facebook, color: '#1877F2' },
  instagram: { icon: Instagram, color: '#E4405F' },
  twitter: { icon: Twitter, color: '#1DA1F2' },
  linkedin: { icon: Linkedin, color: '#0A66C2' },
  tiktok: { icon: Activity, color: '#00f2ea' },
  youtube: { icon: Youtube, color: '#FF0000' },
  whatsapp: { icon: Phone, color: '#25D366' },
  email: { icon: Mail, color: '#EA4335' },
  google_ads: { icon: Globe, color: '#4285F4' }
};

// ============================================================
//  MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState({ name: 'Demo Business', email: 'demo@growthengine.ai', plan: 'pro' });
  const [darkMode] = useState(true);

  return (
    <AppContext.Provider value={{ page, setPage, user, setUser }}>
      <div style={{
        display: 'flex', minHeight: '100vh', background: colors.bg,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: colors.text
      }}>
        <Sidebar open={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
        <main style={{ flex: 1, overflow: 'auto', marginLeft: sidebarOpen ? 260 : 72 }}>
          <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <div style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
            {page === 'dashboard' && <DashboardPage />}
            {page === 'campaigns' && <CampaignsPage />}
            {page === 'leads' && <LeadsPage />}
            {page === 'content' && <ContentPage />}
            {page === 'funnel' && <FunnelPage />}
            {page === 'automations' && <AutomationsPage />}
            {page === 'platforms' && <PlatformsPage />}
            {page === 'ai-studio' && <AIStudioPage />}
            {page === 'analytics' && <AnalyticsPage />}
            {page === 'recruitment' && <RecruitmentPage />}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}

// ============================================================
//  SIDEBAR
// ============================================================
function Sidebar({ open, toggle }) {
  const { page, setPage } = useApp();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'leads', label: 'Leads & CRM', icon: Users },
    { id: 'content', label: 'Content Studio', icon: Edit3 },
    { id: 'ai-studio', label: 'AI Engine', icon: Brain },
    { id: 'funnel', label: 'Funnels', icon: GitBranch },
    { id: 'automations', label: 'Automations', icon: Workflow },
    { id: 'recruitment', label: 'Recruitment', icon: Briefcase },
    { id: 'platforms', label: 'Platforms', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: open ? 260 : 72,
      background: colors.bgCard, borderRight: `1px solid ${colors.border}`,
      transition: 'width 0.2s', zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${colors.border}` }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Zap size={22} color="white" />
        </div>
        {open && <div>
          <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>GrowthEngine</div>
          <div style={{ fontSize: 11, color: colors.primary, fontWeight: 600 }}>AI MARKETING SUITE</div>
        </div>}
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
              background: active ? colors.primarySoft : 'transparent',
              color: active ? colors.primary : colors.textSecondary,
              fontWeight: active ? 600 : 400, fontSize: 14,
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => !active && (e.target.style.background = colors.bgHover)}
            onMouseLeave={e => !active && (e.target.style.background = 'transparent')}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {open && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {open && (
        <div style={{ padding: 16, borderTop: `1px solid ${colors.border}` }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
            borderRadius: 12, padding: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Sparkles size={16} color={colors.primary} />
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>AI Conversion Rate</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: colors.green }}>82.4%</div>
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>+12.3% above industry avg</div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================================
//  TOP BAR
// ============================================================
function TopBar() {
  const { user } = useApp();
  return (
    <header style={{
      height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', borderBottom: `1px solid ${colors.border}`,
      background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center', background: colors.bgHover,
          borderRadius: 8, padding: '8px 14px', gap: 8, minWidth: 240
        }}>
          <Search size={16} color={colors.textMuted} />
          <input placeholder="Search campaigns, leads, content..." style={{
            background: 'transparent', border: 'none', outline: 'none', color: colors.text,
            fontSize: 13, width: '100%'
          }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}>
          <Bell size={20} color={colors.textSecondary} />
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 8, height: 8,
            background: colors.red, borderRadius: '50%'
          }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14
          }}>
            {user.name?.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>{user.plan} plan</div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ============================================================
//  REUSABLE COMPONENTS
// ============================================================
function Card({ children, style, ...props }) {
  return (
    <div style={{
      background: colors.bgCard, borderRadius: 12, border: `1px solid ${colors.border}`,
      padding: 24, ...style
    }} {...props}>{children}</div>
  );
}

function StatCard({ icon: Icon, label, value, change, changeType, color, prefix = '', suffix = '' }) {
  const isPositive = changeType === 'positive';
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} color={color} />
        </div>
        {change && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
            color: isPositive ? colors.green : colors.red,
            background: isPositive ? colors.greenSoft : colors.redSoft,
            padding: '3px 8px', borderRadius: 6
          }}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{label}</div>
      </div>
    </Card>
  );
}

function MiniChart({ data, dataKey, color, height = 60 }) {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 8} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M0,${height} ${data.map((d, i) => `L${i * 8},${height - ((d[dataKey] - min) / range) * (height - 10) - 5}`).join(' ')} L${(data.length - 1) * 8},${height} Z`}
        fill={`url(#grad-${dataKey})`}
      />
      <path
        d={data.map((d, i) => `${i === 0 ? 'M' : 'L'}${i * 8},${height - ((d[dataKey] - min) / range) * (height - 10) - 5}`).join(' ')}
        fill="none" stroke={color} strokeWidth="2"
      />
    </svg>
  );
}

function Badge({ children, color = colors.primary, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
      borderRadius: 6, fontSize: 12, fontWeight: 600, color,
      background: bg || `${color}18`
    }}>{children}</span>
  );
}

function Button({ children, variant = 'primary', size = 'md', icon: Icon, onClick, style, disabled }) {
  const styles = {
    primary: { background: colors.primary, color: '#fff', border: 'none' },
    secondary: { background: colors.bgHover, color: colors.text, border: `1px solid ${colors.border}` },
    ghost: { background: 'transparent', color: colors.textSecondary, border: 'none' },
    danger: { background: colors.redSoft, color: colors.red, border: 'none' },
    success: { background: colors.greenSoft, color: colors.green, border: 'none' }
  };
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 }
  };

  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant], ...sizes[size], borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
      fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6,
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s', ...style
    }}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 14, color: colors.textSecondary, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ============================================================
//  DASHBOARD PAGE
// ============================================================
function DashboardPage() {
  const s = DEMO.stats;
  return (
    <div>
      <SectionHeader title="Command Center" subtitle="Real-time overview of your marketing performance" />

      {/* Hero Conversion Card */}
      <Card style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.12))',
        border: `1px solid rgba(59,130,246,0.25)`, marginBottom: 24, padding: 32
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Sparkles size={20} color={colors.primary} />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.primary }}>AI-POWERED CONVERSION ENGINE</span>
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #3b82f6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              82.4% Conversion Rate
            </div>
            <p style={{ fontSize: 15, color: colors.textSecondary, marginTop: 8, maxWidth: 500 }}>
              Your AI engine is outperforming 97% of marketing teams. 4,260 customers generated from 12,847 leads across 7 platforms.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.green }}>$128.9K</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Revenue Generated</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.primary }}>8.36x</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Return on Ad Spend</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: colors.purple }}>$3.62</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>Cost Per Acquisition</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Leads" value={s.totalLeads} change="+14.2%" changeType="positive" color={colors.primary} />
        <StatCard icon={Target} label="Conversions" value={s.totalConversions} change="+23.1%" changeType="positive" color={colors.green} />
        <StatCard icon={Eye} label="Impressions" value="2.45M" change="+8.7%" changeType="positive" color={colors.purple} />
        <StatCard icon={MousePointerClick} label="Clicks" value={s.totalClicks} change="+16.4%" changeType="positive" color={colors.cyan} />
        <StatCard icon={DollarSign} label="Revenue" value="$128.9K" change="+31.2%" changeType="positive" color={colors.green} />
        <StatCard icon={Megaphone} label="Active Campaigns" value={s.activeCampaigns} color={colors.yellow} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Performance Chart */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Performance Trend (30 Days)</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ label: 'Conversions', color: colors.green }, { label: 'Clicks', color: colors.primary }, { label: 'Revenue', color: colors.purple }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ color: colors.textSecondary }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <MiniChart data={DEMO.timeline} dataKey="conversions" color={colors.green} height={80} />
          <div style={{ marginTop: 8 }}>
            <MiniChart data={DEMO.timeline} dataKey="revenue" color={colors.purple} height={60} />
          </div>
        </Card>

        {/* Funnel Overview */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Conversion Funnel</h3>
          {Object.entries(DEMO.funnel).map(([stage, value], i, arr) => {
            const maxVal = arr[0][1];
            const pct = (value / maxVal * 100).toFixed(1);
            const stageColors = [colors.primary, colors.cyan, colors.yellow, colors.orange, colors.green];
            return (
              <div key={stage} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>{stage}</span>
                  <span style={{ fontWeight: 600 }}>{value.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, background: colors.bgHover, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: stageColors[i], borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Campaigns */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Top Campaigns</h3>
          {s.topCampaigns.map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: i < s.topCampaigns.length - 1 ? `1px solid ${colors.border}` : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, background: colors.primarySoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: colors.primary
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>{c.impressions.toLocaleString()} impressions</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.green }}>${c.revenue.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{c.conversions} conversions</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Lead Sources */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Lead Sources</h3>
          {s.leadsBySource.map((src, i) => {
            const total = s.totalLeads;
            const pct = ((src.count / total) * 100).toFixed(1);
            const srcColors = [colors.primary, colors.pink, colors.cyan, colors.purple, colors.green, '#00f2ea', colors.red];
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{src.source}</span>
                  <span style={{ color: colors.textSecondary }}>{src.count.toLocaleString()} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: colors.bgHover, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: srcColors[i], borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  CAMPAIGNS PAGE
// ============================================================
function CampaignsPage() {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div>
      <SectionHeader
        title="Campaigns"
        subtitle="Manage and optimize your marketing campaigns across all platforms"
        action={<Button icon={Plus} onClick={() => setShowCreate(!showCreate)}>Create Campaign</Button>}
      />

      {showCreate && (
        <Card style={{ marginBottom: 24, border: `1px solid ${colors.primary}` }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={colors.primary} /> AI Campaign Builder
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InputField label="Campaign Name" placeholder="e.g., Summer Sale Push" />
            <SelectField label="Campaign Type" options={['Multi-Channel', 'Lead Generation', 'Brand Awareness', 'Retargeting', 'Email Nurture']} />
            <InputField label="Budget ($)" placeholder="5000" type="number" />
            <InputField label="Duration" placeholder="30 days" />
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, color: colors.textSecondary, display: 'block', marginBottom: 6 }}>Target Platforms</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(platformIcons).map(([key, { icon: Icon, color }]) => (
                  <button key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgHover,
                    color: colors.text, cursor: 'pointer', fontSize: 12
                  }}>
                    <Icon size={16} color={color} />
                    <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button icon={Sparkles}>Generate AI Strategy</Button>
            <Button variant="secondary" icon={Play}>Launch Campaign</Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DEMO.campaigns.map(c => {
          const platforms = JSON.parse(c.platforms || '[]');
          const progress = c.budget > 0 ? ((c.spent / c.budget) * 100).toFixed(0) : 0;
          return (
            <Card key={c.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: c.status === 'active' ? colors.greenSoft : colors.yellowSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {c.status === 'active' ? <Play size={18} color={colors.green} /> : <Pause size={18} color={colors.yellow} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Badge color={c.status === 'active' ? colors.green : colors.yellow}>
                        {c.status}
                      </Badge>
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{c.type}</span>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        {platforms.map(p => {
                          const pi = platformIcons[p];
                          if (!pi) return null;
                          const PIcon = pi.icon;
                          return <PIcon key={p} size={14} color={pi.color} />;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>${c.spent.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>of ${c.budget.toLocaleString()}</div>
                  </div>
                  <div style={{ width: 100 }}>
                    <div style={{ height: 6, background: colors.bgHover, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: progress > 80 ? colors.yellow : colors.primary, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, textAlign: 'right' }}>{progress}% spent</div>
                  </div>
                  <Button variant="ghost" size="sm" icon={MoreHorizontal} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  LEADS PAGE
// ============================================================
function LeadsPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? DEMO.leads : DEMO.leads.filter(l => l.status === filter);

  return (
    <div>
      <SectionHeader title="Leads & CRM" subtitle="Manage, score, and nurture your leads to conversion"
        action={<div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={Download}>Export</Button>
          <Button icon={Plus}>Add Lead</Button>
        </div>}
      />

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'new', 'qualified', 'nurturing', 'converted'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === f ? colors.primary : colors.bgHover,
            color: filter === f ? '#fff' : colors.textSecondary,
            fontSize: 13, fontWeight: 500, textTransform: 'capitalize'
          }}>{f} {f === 'all' ? `(${DEMO.leads.length})` : `(${DEMO.leads.filter(l => l.status === f).length})`}</button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              {['Name', 'Email', 'Source', 'Score', 'Status', 'Date', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(lead => {
              const statusColors = { new: colors.primary, qualified: colors.green, nurturing: colors.yellow, converted: colors.purple };
              return (
                <tr key={lead.id} style={{ borderBottom: `1px solid ${colors.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{lead.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.textSecondary }}>{lead.email}</td>
                  <td style={{ padding: '12px 16px' }}><Badge color={platformIcons[lead.source.toLowerCase().split(' ')[0]]?.color || colors.primary}>{lead.source}</Badge></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 5, background: colors.bgHover, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${lead.score}%`, background: lead.score >= 70 ? colors.green : lead.score >= 40 ? colors.yellow : colors.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: lead.score >= 70 ? colors.green : lead.score >= 40 ? colors.yellow : colors.red }}>{lead.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge color={statusColors[lead.status]}>{lead.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textMuted }}>
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" size="sm" icon={Brain} style={{ padding: 4 }} />
                      <Button variant="ghost" size="sm" icon={Send} style={{ padding: 4 }} />
                      <Button variant="ghost" size="sm" icon={MoreHorizontal} style={{ padding: 4 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ============================================================
//  CONTENT STUDIO PAGE
// ============================================================
function ContentPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerated({
        headline: "Transform Your Business in 30 Days — Here's How",
        body: "Struggling to find customers? Our AI-powered platform has helped 500+ businesses achieve an 80% conversion rate.\n\nWhat you get:\n→ AI-generated content that converts\n→ Multi-platform campaign management\n→ Automated lead nurturing\n→ Real-time analytics\n\nStop guessing. Start growing.",
        cta: "Start Your Free Trial →",
        hashtags: ['#MarketingAI', '#GrowthHacking', '#BusinessGrowth', '#DigitalMarketing', '#LeadGeneration'],
        hook: "What if you could guarantee an 80% conversion rate?",
        emotionalTrigger: "Fear of missing out + desire for certainty",
        persuasionFramework: "PAS (Problem-Agitation-Solution)",
        variants: [
          { headline: "80% of Our Clients Convert — Want to Know the Secret?", body: "The difference between struggling businesses and thriving ones? An AI that never sleeps...", cta: "Unlock Your Growth →" },
          { headline: "Stop Wasting Ad Spend. Start Converting.", body: "Every dollar you spend on marketing should bring back $8. With our AI engine, it does...", cta: "See It In Action →" }
        ]
      });
      setGenerating(false);
    }, 2000);
  };

  return (
    <div>
      <SectionHeader title="Content Studio" subtitle="AI-powered content creation for every platform"
        action={<Button icon={Sparkles} onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : 'Generate Content'}
        </Button>}
      />

      {/* Platform Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.entries(platformIcons).map(([key, { icon: Icon, color }]) => (
          <button key={key} onClick={() => setSelectedPlatform(key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            borderRadius: 10, border: selectedPlatform === key ? `2px solid ${color}` : `1px solid ${colors.border}`,
            background: selectedPlatform === key ? `${color}15` : 'transparent',
            color: selectedPlatform === key ? color : colors.textSecondary,
            cursor: 'pointer', fontSize: 13, fontWeight: 500
          }}>
            <Icon size={16} />
            <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Input Panel */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Content Brief</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField label="Product/Service" placeholder="e.g., AI Marketing Automation Platform" />
            <InputField label="Target Audience" placeholder="e.g., Small business owners aged 25-45" />
            <SelectField label="Content Type" options={['Promotional', 'Educational', 'Social Proof', 'Behind the Scenes', 'Announcement']} />
            <SelectField label="Tone" options={['Professional', 'Casual', 'Urgent', 'Inspirational', 'Humorous']} />
            <TextareaField label="Key Message" placeholder="What's the main thing you want to communicate?" rows={3} />
          </div>
        </Card>

        {/* Output Panel */}
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={colors.primary} />
            Generated Content
          </h3>
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 12 }}>
              <RefreshCw size={32} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: colors.textSecondary }}>AI is crafting your content...</span>
            </div>
          ) : generated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Headline</label>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{generated.headline}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Body</label>
                <div style={{ fontSize: 13, marginTop: 4, whiteSpace: 'pre-line', color: colors.textSecondary }}>{generated.body}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', fontWeight: 600 }}>Call to Action</label>
                <Badge color={colors.green}>{generated.cta}</Badge>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {generated.hashtags.map(h => <Badge key={h} color={colors.primary}>{h}</Badge>)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Button icon={Send} size="sm">Publish Now</Button>
                <Button variant="secondary" icon={Clock} size="sm">Schedule</Button>
                <Button variant="secondary" icon={Copy} size="sm">Copy</Button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: colors.textMuted }}>
              <Bot size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>Click "Generate Content" to create AI-powered marketing content for {selectedPlatform}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  AI STUDIO PAGE
// ============================================================
function AIStudioPage() {
  return (
    <div>
      <SectionHeader title="AI Engine" subtitle="Your intelligent marketing brain — strategy, content, targeting, and optimization" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: Sparkles, title: 'Campaign Strategist', desc: 'Generate data-driven campaign strategies with budget allocation across platforms', color: colors.primary },
          { icon: Target, title: 'Audience Targeting', desc: 'AI-powered audience segmentation and targeting for every ad platform', color: colors.green },
          { icon: Edit3, title: 'Content Generator', desc: 'Create high-converting copy for posts, ads, emails, and videos', color: colors.purple },
          { icon: Mail, title: 'Email Sequences', desc: 'Build automated nurture sequences with 40%+ open rates', color: colors.red },
          { icon: TrendingUp, title: 'Ad Optimizer', desc: 'Analyze performance data and generate improved ad variants', color: colors.yellow },
          { icon: Brain, title: 'Lead Scorer', desc: 'AI scoring of leads based on behavior, demographics, and engagement', color: colors.cyan }
        ].map((tool, i) => (
          <Card key={i} style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = tool.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: `${tool.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14
            }}>
              <tool.icon size={22} color={tool.color} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>{tool.title}</h4>
            <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>{tool.desc}</p>
          </Card>
        ))}
      </div>

      <Card style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.08))', border: `1px solid rgba(139,92,246,0.2)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Brain size={24} color={colors.purple} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>AI Conversion Optimization Engine</h3>
        </div>
        <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.6, maxWidth: 700 }}>
          The engine continuously analyzes your campaign performance, lead behavior, and conversion patterns to automatically optimize targeting, content, and spend allocation. It uses reinforcement learning to improve conversion rates over time, currently achieving 82.4% across all campaigns.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
          {[
            { label: 'Models Trained', value: '847' },
            { label: 'Predictions/Day', value: '12.4K' },
            { label: 'Accuracy', value: '94.2%' },
            { label: 'Optimizations', value: '3,240' }
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: colors.purple }}>{m.value}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ============================================================
//  FUNNEL PAGE
// ============================================================
function FunnelPage() {
  const stages = [
    { name: 'Awareness', value: 2450000, icon: Eye, color: colors.primary, desc: 'Total impressions across all platforms' },
    { name: 'Interest', value: 89200, icon: MousePointerClick, color: colors.cyan, desc: 'Clicks, engagement, and profile visits' },
    { name: 'Consideration', value: 12847, icon: Users, color: colors.yellow, desc: 'Leads captured and in pipeline' },
    { name: 'Intent', value: 8010, icon: Target, color: colors.orange, desc: 'Qualified leads showing purchase signals' },
    { name: 'Conversion', value: 4260, icon: CheckCircle2, color: colors.green, desc: 'Customers acquired and revenue generated' }
  ];

  return (
    <div>
      <SectionHeader title="Conversion Funnel" subtitle="Full-funnel visualization of your customer journey" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {stages.map((stage, i) => {
          const width = (stage.value / stages[0].value * 100);
          const convRate = i > 0 ? ((stage.value / stages[i - 1].value) * 100).toFixed(1) : '100';
          const Icon = stage.icon;
          return (
            <div key={stage.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 120, textAlign: 'right', fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{stage.name}</div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  height: 56, background: `${stage.color}15`, borderRadius: 12,
                  width: `${Math.max(width, 8)}%`, display: 'flex', alignItems: 'center',
                  padding: '0 16px', gap: 10, transition: 'width 0.5s',
                  border: `1px solid ${stage.color}30`
                }}>
                  <Icon size={20} color={stage.color} />
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{stage.value.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{stage.desc}</div>
                  </div>
                </div>
              </div>
              <div style={{ width: 80, textAlign: 'center' }}>
                {i > 0 && (
                  <Badge color={parseFloat(convRate) >= 50 ? colors.green : parseFloat(convRate) >= 20 ? colors.yellow : colors.red}>
                    {convRate}%
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>Overall Funnel Rate</h4>
          <div style={{ fontSize: 32, fontWeight: 900, color: colors.green }}>82.4%</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Lead-to-Customer conversion</div>
        </Card>
        <Card>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>Avg Time to Convert</h4>
          <div style={{ fontSize: 32, fontWeight: 900, color: colors.primary }}>4.2 days</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>From first touch to purchase</div>
        </Card>
        <Card>
          <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>Funnel Velocity</h4>
          <div style={{ fontSize: 32, fontWeight: 900, color: colors.purple }}>142/day</div>
          <div style={{ fontSize: 13, color: colors.textMuted }}>Leads moving through stages daily</div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  AUTOMATIONS PAGE
// ============================================================
function AutomationsPage() {
  const automations = [
    { name: 'Welcome Email Sequence', trigger: 'New lead captured', actions: 'Send 5-email nurture sequence', status: 'active', executions: 2340 },
    { name: 'Hot Lead Alert', trigger: 'Lead score > 80', actions: 'Notify sales team + send WhatsApp', status: 'active', executions: 890 },
    { name: 'Retargeting Trigger', trigger: 'Website visit without conversion', actions: 'Add to Facebook retargeting audience', status: 'active', executions: 5600 },
    { name: 'Content Scheduler', trigger: 'Every day at 9am', actions: 'AI-generate & publish content to all platforms', status: 'active', executions: 67 },
    { name: 'Win-Back Campaign', trigger: 'No engagement for 14 days', actions: 'Send special offer via email + WhatsApp', status: 'paused', executions: 430 },
    { name: 'Review Request', trigger: '7 days after conversion', actions: 'Send review request email', status: 'active', executions: 1200 }
  ];

  return (
    <div>
      <SectionHeader title="Automations" subtitle="Set up intelligent workflows that run 24/7"
        action={<Button icon={Plus}>Create Automation</Button>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {automations.map((a, i) => (
          <Card key={i} style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: a.status === 'active' ? colors.greenSoft : colors.yellowSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Workflow size={20} color={a.status === 'active' ? colors.green : colors.yellow} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    <span style={{ color: colors.cyan }}>Trigger:</span> {a.trigger} → <span style={{ color: colors.purple }}>Action:</span> {a.actions}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{a.executions.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>executions</div>
                </div>
                <Badge color={a.status === 'active' ? colors.green : colors.yellow}>{a.status}</Badge>
                <Button variant="ghost" size="sm" icon={MoreHorizontal} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  PLATFORMS PAGE
// ============================================================
function PlatformsPage() {
  const connections = [
    { platform: 'facebook', name: 'Facebook Business', account: 'GrowthEngine Page', status: 'connected', followers: '45.2K' },
    { platform: 'instagram', name: 'Instagram', account: '@growthengine.ai', status: 'connected', followers: '32.8K' },
    { platform: 'twitter', name: 'X (Twitter)', account: '@growthengine', status: 'connected', followers: '18.4K' },
    { platform: 'linkedin', name: 'LinkedIn', account: 'GrowthEngine Inc.', status: 'connected', followers: '12.1K' },
    { platform: 'tiktok', name: 'TikTok', account: '@growthengine', status: 'connected', followers: '89.3K' },
    { platform: 'youtube', name: 'YouTube', account: 'GrowthEngine Channel', status: 'connected', followers: '8.7K' },
    { platform: 'whatsapp', name: 'WhatsApp Business', account: '+1 555-0123', status: 'connected', followers: '2.3K contacts' },
    { platform: 'email', name: 'Email (SMTP)', account: 'marketing@growthengine.ai', status: 'connected', followers: '15.4K subscribers' },
    { platform: 'google_ads', name: 'Google Ads', account: 'GrowthEngine Ads', status: 'connected', followers: '$4.2K/mo spend' }
  ];

  return (
    <div>
      <SectionHeader title="Platform Connections" subtitle="Connect and manage all your marketing channels" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {connections.map(c => {
          const pi = platformIcons[c.platform];
          const Icon = pi?.icon || Globe;
          return (
            <Card key={c.platform} style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = pi?.color || colors.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, background: `${pi?.color || colors.primary}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon size={22} color={pi?.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>{c.account}</div>
                  </div>
                </div>
                <Badge color={colors.green}>Connected</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>{c.followers}</span>
                <Button variant="ghost" size="sm" icon={Settings}>Configure</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
//  ANALYTICS PAGE
// ============================================================
function AnalyticsPage() {
  return (
    <div>
      <SectionHeader title="Analytics" subtitle="Deep insights into your marketing performance" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={DollarSign} label="Total Revenue" value="$128.9K" change="+31.2%" changeType="positive" color={colors.green} />
        <StatCard icon={TrendingUp} label="ROAS" value="8.36x" change="+2.1x" changeType="positive" color={colors.primary} />
        <StatCard icon={Target} label="Cost Per Lead" value="$1.20" change="-18%" changeType="positive" color={colors.cyan} />
        <StatCard icon={Star} label="Conversion Rate" value="82.4%" change="+12.3%" changeType="positive" color={colors.purple} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Platform Performance</h3>
          {[
            { platform: 'Facebook Ads', spend: 4200, revenue: 38600, roas: 9.19, conv: 86 },
            { platform: 'Instagram', spend: 2800, revenue: 22400, roas: 8.0, conv: 84 },
            { platform: 'Google Ads', spend: 3800, revenue: 28500, roas: 7.5, conv: 79 },
            { platform: 'LinkedIn', spend: 2100, revenue: 19800, roas: 9.43, conv: 88 },
            { platform: 'TikTok', spend: 1800, revenue: 12600, roas: 7.0, conv: 76 },
            { platform: 'Email', spend: 320, revenue: 4800, roas: 15.0, conv: 92 },
            { platform: 'WhatsApp', spend: 200, revenue: 2200, roas: 11.0, conv: 89 }
          ].map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: i < 6 ? `1px solid ${colors.border}` : 'none'
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, width: 120 }}>{p.platform}</span>
              <span style={{ fontSize: 12, color: colors.textMuted }}>${p.spend.toLocaleString()} spend</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.green }}>${p.revenue.toLocaleString()}</span>
              <Badge color={p.roas >= 9 ? colors.green : p.roas >= 7 ? colors.yellow : colors.red}>{p.roas}x ROAS</Badge>
              <Badge color={p.conv >= 85 ? colors.green : p.conv >= 75 ? colors.yellow : colors.red}>{p.conv}%</Badge>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Revenue Trend (30 Days)</h3>
          <MiniChart data={DEMO.timeline} dataKey="revenue" color={colors.green} height={200} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>Best Day</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.green }}>$6,840</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' }}>Daily Average</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>$4,297</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
//  RECRUITMENT PAGE
// ============================================================
function RecruitmentPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  const [generatingAd, setGeneratingAd] = useState(false);
  const [generatedAd, setGeneratedAd] = useState(null);

  const demoJobs = [
    { id: 'j1', title: 'Senior Full-Stack Developer', department: 'Engineering', location: 'Remote (Global)', type: 'Full-time', salary: '$120K - $160K', status: 'active', applicants: 47, views: 1240, score_avg: 72, platforms: ['linkedin', 'twitter', 'indeed'], created: '2026-03-10' },
    { id: 'j2', title: 'Marketing Manager', department: 'Marketing', location: 'New York, NY', type: 'Full-time', salary: '$90K - $120K', status: 'active', applicants: 83, views: 2100, score_avg: 68, platforms: ['linkedin', 'facebook', 'indeed'], created: '2026-03-05' },
    { id: 'j3', title: 'UX/UI Designer', department: 'Design', location: 'Remote (US)', type: 'Full-time', salary: '$100K - $130K', status: 'active', applicants: 36, views: 980, score_avg: 75, platforms: ['linkedin', 'instagram', 'twitter'], created: '2026-03-12' },
    { id: 'j4', title: 'Sales Development Rep', department: 'Sales', location: 'Lagos, Nigeria', type: 'Full-time', salary: '₦8M - ₦12M', status: 'active', applicants: 124, views: 3400, score_avg: 61, platforms: ['linkedin', 'whatsapp', 'facebook'], created: '2026-03-01' },
    { id: 'j5', title: 'Data Analyst (Contract)', department: 'Analytics', location: 'London, UK', type: 'Contract', salary: '£450/day', status: 'paused', applicants: 29, views: 560, score_avg: 78, platforms: ['linkedin', 'indeed'], created: '2026-02-20' }
  ];

  const demoApplicants = [
    { id: 'a1', name: 'Jessica Okonkwo', job: 'Senior Full-Stack Developer', source: 'LinkedIn Ad', score: 92, status: 'interview', experience: '8 years', skills: ['React', 'Node.js', 'AWS', 'Python'], applied: '2026-03-18' },
    { id: 'a2', name: 'Michael Chang', job: 'Senior Full-Stack Developer', source: 'Twitter', score: 87, status: 'interview', experience: '6 years', skills: ['Vue.js', 'Go', 'PostgreSQL', 'Docker'], applied: '2026-03-17' },
    { id: 'a3', name: 'Amara Diallo', job: 'Marketing Manager', source: 'Facebook Ad', score: 85, status: 'review', experience: '5 years', skills: ['Digital Marketing', 'SEO', 'Content Strategy'], applied: '2026-03-16' },
    { id: 'a4', name: 'Raj Patel', job: 'UX/UI Designer', source: 'Indeed', score: 81, status: 'new', experience: '4 years', skills: ['Figma', 'User Research', 'Prototyping'], applied: '2026-03-19' },
    { id: 'a5', name: 'Sarah Williams', job: 'Sales Development Rep', source: 'WhatsApp', score: 79, status: 'interview', experience: '3 years', skills: ['Cold Calling', 'Salesforce', 'Negotiation'], applied: '2026-03-15' },
    { id: 'a6', name: 'Tobias Müller', job: 'Data Analyst (Contract)', source: 'LinkedIn', score: 88, status: 'offer', experience: '7 years', skills: ['Python', 'SQL', 'Tableau', 'Machine Learning'], applied: '2026-03-14' },
    { id: 'a7', name: 'Chioma Eze', job: 'Marketing Manager', source: 'Instagram Ad', score: 74, status: 'new', experience: '4 years', skills: ['Social Media', 'Branding', 'Analytics'], applied: '2026-03-20' },
    { id: 'a8', name: 'David Park', job: 'Senior Full-Stack Developer', source: 'Google Ad', score: 68, status: 'rejected', experience: '2 years', skills: ['JavaScript', 'HTML/CSS'], applied: '2026-03-13' }
  ];

  const handleGenerateAd = () => {
    setGeneratingAd(true);
    setTimeout(() => {
      setGeneratedAd({
        tagline: "Build the Future of AI Marketing — Join Our Engineering Team",
        linkedin: {
          headline: "We're Hiring: Senior Full-Stack Developer (Remote)",
          body: "What if your code could help 10,000+ businesses grow?\n\nAt GrowthEngine, we're building the AI platform that's redefining marketing automation. Our conversion engine outperforms 97% of marketing teams — and we need YOU to help us scale.\n\nWhat you'll do:\n→ Architect systems processing 50M+ events/day\n→ Build AI pipelines that generate $128M+ in customer revenue\n→ Ship features used by businesses across 40+ countries\n\nWhat we offer:\n→ $120K - $160K + equity\n→ Fully remote, async-first culture\n→ Work with cutting-edge AI (GPT-4, DALL-E, Runway)\n→ Direct impact on company growth\n\nReady to write code that changes businesses? Apply now.",
          hashtags: ['#Hiring', '#RemoteJobs', '#FullStack', '#AIJobs', '#TechCareers']
        },
        facebook: { headline: "Join Our Team: Senior Full-Stack Developer", body: "Ready for your next career move? We're looking for a Senior Full-Stack Developer to help build the future of AI-powered marketing. Remote, competitive pay, cutting-edge tech stack.", cta: "Apply Now →" },
        twitter: ["We're hiring a Senior Full-Stack Developer!\n\nRemote | $120K-$160K | AI/ML Tech Stack\n\nBuild systems that help 10K+ businesses grow. Your code = real-world impact.\n\nApply: [link]\n\n#Hiring #RemoteJobs #TechJobs"],
        whatsapp: "Hi! We have an exciting opportunity: Senior Full-Stack Developer at GrowthEngine (Remote, $120K-$160K). Work with AI, impact 10K+ businesses. Interested? Apply here: [link]"
      });
      setGeneratingAd(false);
    }, 2500);
  };

  const statusColors = { new: colors.primary, review: colors.yellow, interview: colors.cyan, offer: colors.green, hired: colors.green, rejected: colors.red };

  return (
    <div>
      <SectionHeader title="Recruitment Ads" subtitle="AI-powered hiring — attract top talent across all platforms"
        action={<div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={Download}>Export Report</Button>
          <Button icon={Plus} onClick={() => setShowCreate(!showCreate)}>Post New Job</Button>
        </div>}
      />

      {/* Recruitment Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Briefcase} label="Active Jobs" value={4} color={colors.primary} />
        <StatCard icon={UserPlus} label="Total Applicants" value={319} change="+28.3%" changeType="positive" color={colors.green} />
        <StatCard icon={CalendarCheck} label="Interviews Scheduled" value={12} color={colors.cyan} />
        <StatCard icon={Award} label="Offers Extended" value={3} color={colors.purple} />
        <StatCard icon={Star} label="Avg. Candidate Score" value={74} suffix="/100" color={colors.yellow} />
        <StatCard icon={Eye} label="Job Views" value="8.3K" change="+42%" changeType="positive" color={colors.pink} />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${colors.border}`, paddingBottom: 0 }}>
        {[
          { id: 'jobs', label: 'Job Postings', icon: Briefcase },
          { id: 'applicants', label: 'Applicants', icon: Users },
          { id: 'ai-generator', label: 'AI Ad Generator', icon: Sparkles },
          { id: 'pipeline', label: 'Hiring Pipeline', icon: GitBranch }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: 'transparent',
            color: activeTab === tab.id ? colors.primary : colors.textSecondary,
            borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
            transition: 'all 0.15s', marginBottom: -1
          }}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* JOB POSTINGS TAB */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {showCreate && (
            <Card style={{ border: `1px solid ${colors.primary}`, marginBottom: 8 }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
                <Sparkles size={18} color={colors.primary} /> New Job Posting
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <InputField label="Job Title" placeholder="e.g., Senior Full-Stack Developer" />
                <InputField label="Department" placeholder="e.g., Engineering" />
                <InputField label="Location" placeholder="e.g., Remote (Global)" />
                <SelectField label="Type" options={['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship']} />
                <InputField label="Salary Min ($)" placeholder="120000" type="number" />
                <InputField label="Salary Max ($)" placeholder="160000" type="number" />
                <div style={{ gridColumn: '1/-1' }}>
                  <TextareaField label="Key Requirements (one per line)" placeholder="5+ years full-stack experience&#10;React, Node.js, TypeScript&#10;Experience with cloud platforms (AWS/GCP)" rows={4} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <TextareaField label="Benefits" placeholder="Equity, remote work, health insurance, learning budget..." rows={2} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 13, color: colors.textSecondary, display: 'block', marginBottom: 6, fontWeight: 500 }}>Advertise On</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      { key: 'linkedin', icon: Linkedin, color: '#0A66C2', label: 'LinkedIn' },
                      { key: 'facebook', icon: Facebook, color: '#1877F2', label: 'Facebook' },
                      { key: 'instagram', icon: Instagram, color: '#E4405F', label: 'Instagram' },
                      { key: 'twitter', icon: Twitter, color: '#1DA1F2', label: 'X/Twitter' },
                      { key: 'tiktok', icon: Activity, color: '#00f2ea', label: 'TikTok' },
                      { key: 'whatsapp', icon: Phone, color: '#25D366', label: 'WhatsApp' },
                      { key: 'google', icon: Globe, color: '#4285F4', label: 'Google Ads' },
                      { key: 'indeed', icon: Briefcase, color: '#2164f3', label: 'Indeed' },
                      { key: 'glassdoor', icon: Building2, color: '#0CAA41', label: 'Glassdoor' }
                    ].map(p => (
                      <button key={p.key} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                        borderRadius: 8, border: `1px solid ${colors.border}`, background: colors.bgHover,
                        color: colors.text, cursor: 'pointer', fontSize: 12
                      }}>
                        <p.icon size={14} color={p.color} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Button icon={Sparkles}>Generate AI Job Ad</Button>
                <Button variant="secondary" icon={Send}>Post & Launch Ads</Button>
              </div>
            </Card>
          )}

          {demoJobs.map(job => (
            <Card key={job.id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: job.status === 'active' ? colors.greenSoft : colors.yellowSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Briefcase size={20} color={job.status === 'active' ? colors.green : colors.yellow} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{job.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, fontSize: 12, color: colors.textMuted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {job.department}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {job.location}</span>
                      <Badge color={job.status === 'active' ? colors.green : colors.yellow}>{job.status}</Badge>
                      <span>{job.salary}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{job.applicants}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>applicants</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{job.views.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>views</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: job.score_avg >= 75 ? colors.green : colors.yellow }}>{job.score_avg}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>avg score</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {job.platforms.map(p => {
                      const pi = platformIcons[p];
                      if (!pi) return <Briefcase key={p} size={14} color={colors.textMuted} />;
                      const PIcon = pi.icon;
                      return <PIcon key={p} size={14} color={pi.color} />;
                    })}
                  </div>
                  <Button variant="ghost" size="sm" icon={MoreHorizontal} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* APPLICANTS TAB */}
      {activeTab === 'applicants' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                {['Candidate', 'Applied For', 'Source', 'Experience', 'Score', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoApplicants.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.border}` }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted, display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
                      {a.skills.slice(0, 3).map(s => <span key={s} style={{ background: colors.bgHover, padding: '1px 6px', borderRadius: 4 }}>{s}</span>)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{a.job}</td>
                  <td style={{ padding: '12px 16px' }}><Badge color={colors.primary}>{a.source}</Badge></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: colors.textSecondary }}>{a.experience}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 40, height: 5, background: colors.bgHover, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${a.score}%`, background: a.score >= 80 ? colors.green : a.score >= 60 ? colors.yellow : colors.red, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.score >= 80 ? colors.green : a.score >= 60 ? colors.yellow : colors.red }}>{a.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge color={statusColors[a.status]}>{a.status}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Button variant="ghost" size="sm" icon={Brain} style={{ padding: 4 }} />
                      <Button variant="ghost" size="sm" icon={Send} style={{ padding: 4 }} />
                      <Button variant="ghost" size="sm" icon={CalendarCheck} style={{ padding: 4 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* AI AD GENERATOR TAB */}
      {activeTab === 'ai-generator' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color={colors.primary} /> Job Ad Brief
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <InputField label="Job Title" placeholder="e.g., Senior Full-Stack Developer" />
              <InputField label="Company Description" placeholder="What does your company do?" />
              <InputField label="Location & Work Type" placeholder="e.g., Remote (Global), Full-time" />
              <InputField label="Salary Range" placeholder="e.g., $120K - $160K + equity" />
              <TextareaField label="Key Requirements" placeholder="List the must-have skills and experience" rows={3} />
              <TextareaField label="Unique Selling Points / Perks" placeholder="What makes this role special? Why should top talent apply?" rows={3} />
              <SelectField label="Tone" options={['Professional & Exciting', 'Casual & Fun', 'Prestigious & Corporate', 'Startup Energy', 'Mission-Driven']} />
              <Button icon={Sparkles} onClick={handleGenerateAd} disabled={generatingAd} style={{ marginTop: 4 }}>
                {generatingAd ? 'Generating Ads for All Platforms...' : 'Generate Recruitment Ads'}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Generated Recruitment Ads</h3>
            {generatingAd ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 14 }}>
                <RefreshCw size={36} color={colors.primary} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: colors.textSecondary, fontSize: 14 }}>AI is crafting platform-optimized job ads...</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {[Linkedin, Facebook, Twitter, Phone].map((Icon, i) => (
                    <Icon key={i} size={18} color={colors.textMuted} style={{ animation: `spin ${1 + i * 0.3}s linear infinite reverse` }} />
                  ))}
                </div>
              </div>
            ) : generatedAd ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ padding: 14, background: colors.bgHover, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Linkedin size={18} color="#0A66C2" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>LinkedIn</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{generatedAd.linkedin.headline}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{generatedAd.linkedin.body}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                    {generatedAd.linkedin.hashtags.map(h => <Badge key={h} color={colors.primary}>{h}</Badge>)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Button size="sm" icon={Send}>Post to LinkedIn</Button>
                    <Button variant="secondary" size="sm" icon={DollarSign}>Create Sponsored Ad</Button>
                    <Button variant="secondary" size="sm" icon={Copy}>Copy</Button>
                  </div>
                </div>

                <div style={{ padding: 14, background: colors.bgHover, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Facebook size={18} color="#1877F2" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Facebook</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{generatedAd.facebook.headline}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{generatedAd.facebook.body}</div>
                  <Badge color={colors.green} style={{ marginTop: 8, display: 'inline-flex' }}>{generatedAd.facebook.cta}</Badge>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Button size="sm" icon={Send}>Post</Button>
                    <Button variant="secondary" size="sm" icon={Copy}>Copy</Button>
                  </div>
                </div>

                <div style={{ padding: 14, background: colors.bgHover, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Phone size={18} color="#25D366" />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>WhatsApp Broadcast</span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary }}>{generatedAd.whatsapp}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Button size="sm" icon={Send}>Broadcast</Button>
                    <Button variant="secondary" size="sm" icon={Copy}>Copy</Button>
                  </div>
                </div>

                <Button icon={Send} style={{ marginTop: 4 }}>Launch on All Platforms Simultaneously</Button>
              </div>
            ) : (
              <div style={{ padding: '60px 0', textAlign: 'center', color: colors.textMuted }}>
                <Briefcase size={44} style={{ marginBottom: 14, opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>Fill in the job brief and click "Generate" to create AI-optimized recruitment ads for every platform</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* HIRING PIPELINE TAB */}
      {activeTab === 'pipeline' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {[
              { stage: 'New', count: 89, color: colors.primary, applicants: demoApplicants.filter(a => a.status === 'new') },
              { stage: 'In Review', count: 42, color: colors.yellow, applicants: demoApplicants.filter(a => a.status === 'review') },
              { stage: 'Interview', count: 18, color: colors.cyan, applicants: demoApplicants.filter(a => a.status === 'interview') },
              { stage: 'Offer', count: 5, color: colors.green, applicants: demoApplicants.filter(a => a.status === 'offer') },
              { stage: 'Hired', count: 3, color: colors.purple, applicants: [] }
            ].map(col => (
              <div key={col.stage}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '10px 10px 0 0',
                  background: `${col.color}15`, borderBottom: `2px solid ${col.color}`
                }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: col.color }}>{col.stage}</span>
                  <Badge color={col.color}>{col.count}</Badge>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 0', minHeight: 200 }}>
                  {col.applicants.map(a => (
                    <Card key={a.id} style={{ padding: 12, cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = col.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{a.job}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Badge color={a.score >= 80 ? colors.green : colors.yellow}>Score: {a.score}</Badge>
                        <span style={{ fontSize: 11, color: colors.textMuted }}>{a.source}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  FORM COMPONENTS
// ============================================================
function InputField({ label, ...props }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: colors.textSecondary, display: 'block', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input {...props} style={{
        width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`,
        background: colors.bgHover, color: colors.text, fontSize: 13, outline: 'none', boxSizing: 'border-box'
      }} />
    </div>
  );
}

function SelectField({ label, options }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: colors.textSecondary, display: 'block', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <select style={{
        width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`,
        background: colors.bgHover, color: colors.text, fontSize: 13, outline: 'none'
      }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextareaField({ label, ...props }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: colors.textSecondary, display: 'block', marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <textarea {...props} style={{
        width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.border}`,
        background: colors.bgHover, color: colors.text, fontSize: 13, outline: 'none',
        resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box'
      }} />
    </div>
  );
}
