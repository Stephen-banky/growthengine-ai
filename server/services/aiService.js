// GrowthEngine AI Service — powered by Anthropic Claude
// Falls back to smart demo mode when no API key is configured

let _anthropic = null;
let _demoMode = false;

function getClient() {
  if (_anthropic) return _anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.log('[AI] No ANTHROPIC_API_KEY set — running in demo mode');
    _demoMode = true;
    return null;
  }
  const Anthropic = require('@anthropic-ai/sdk');
  _anthropic = new Anthropic({ apiKey: key });
  return _anthropic;
}

// Call Claude API or return demo data
async function callClaude(systemPrompt, userPrompt, options = {}) {
  const client = getClient();

  if (!client || _demoMode) {
    // Smart demo mode — return realistic sample data
    return generateDemoResponse(userPrompt, options.demoType);
  }

  try {
    const response = await client.messages.create({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt + '\n\nReturn ONLY valid JSON, no markdown or code blocks.' }],
      temperature: options.temperature || 0.7
    });

    const text = response.content[0].text;
    // Extract JSON from response (handle if wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response as JSON');
    return JSON.parse(jsonMatch[0]);
  } catch (apiError) {
    console.log('[AI] Claude API error, falling back to demo mode:', apiError.message);
    return generateDemoResponse(userPrompt, options.demoType);
  }
}

// ==================== DEMO MODE RESPONSES ====================
function generateDemoResponse(prompt, demoType) {
  const demos = {
    content: {
      headline: "Transform Your Business Growth with AI-Powered Marketing",
      body: "Stop guessing, start growing. Our AI-driven platform analyzes your audience in real-time, crafting personalized campaigns that convert 3x better than traditional methods. Join 10,000+ businesses already scaling with GrowthEngine.\n\n✅ Smart audience targeting\n✅ Auto-optimized ad spend\n✅ Real-time performance tracking\n\nStart your free trial today — no credit card required.",
      cta: "Start Free Trial →",
      hashtags: ["#DigitalMarketing", "#AIMarketing", "#GrowthHacking", "#BusinessGrowth", "#MarketingAutomation"],
      hook: "What if your marketing could think for itself?",
      emotionalTrigger: "Fear of missing out + desire for effortless growth",
      persuasionFramework: "PAS (Problem-Agitate-Solution)",
      expectedEngagementRate: "4.8%",
      variants: [
        { headline: "Your Competitors Are Using AI Marketing. Are You?", body: "The marketing landscape changed. AI-powered campaigns deliver 80% higher ROI. Don't get left behind.", cta: "Get Started Free" },
        { headline: "From 0 to 10K Leads in 30 Days", body: "See how businesses like yours are using AI to generate qualified leads on autopilot. Real results, real fast.", cta: "See How It Works" }
      ]
    },
    strategy: {
      strategyName: "Multi-Channel Growth Blitz",
      overview: "A 30-day intensive campaign combining paid social, organic content, and email nurturing to drive qualified leads and conversions.",
      targetPersonas: [
        { name: "Growth-Focused Founder", demographics: "25-45, tech-savvy, $50K-200K revenue", painPoints: ["limited marketing budget", "no dedicated marketing team", "low conversion rates"], channels: ["LinkedIn", "Twitter", "Email"] },
        { name: "Marketing Manager", demographics: "28-40, mid-size company, B2B/B2C", painPoints: ["proving ROI", "managing multiple channels", "content creation at scale"], channels: ["Instagram", "Facebook", "Google Ads"] }
      ],
      channelStrategy: {
        facebook: { budget_pct: 25, content_types: ["video ads", "carousel", "lead forms"], posting_frequency: "daily", ad_formats: ["lead generation", "conversions"] },
        instagram: { budget_pct: 20, content_types: ["reels", "stories", "carousel posts"], posting_frequency: "2x daily", ad_formats: ["story ads", "explore ads"] },
        google: { budget_pct: 20, campaign_types: ["search", "display", "performance max"], keyword_strategy: "Long-tail + branded terms" },
        linkedin: { budget_pct: 15, content_types: ["thought leadership", "case studies"], posting_frequency: "3x/week" },
        tiktok: { budget_pct: 10, content_types: ["tutorials", "behind-the-scenes"], posting_frequency: "daily" },
        email: { budget_pct: 7, sequence_count: 5, types: ["welcome", "nurture", "promotional", "re-engagement"] },
        whatsapp: { budget_pct: 3, message_types: ["quick replies", "product catalogs"], frequency: "2x/week" }
      },
      funnelStages: [
        { stage: "Awareness", channels: ["Facebook", "Instagram", "TikTok"], content: "Educational content + brand stories", kpi: "Reach & Impressions", target: "500K impressions" },
        { stage: "Consideration", channels: ["Google", "LinkedIn", "Email"], content: "Case studies + comparisons", kpi: "Clicks & Engagement", target: "5% CTR" },
        { stage: "Conversion", channels: ["Email", "WhatsApp", "Retargeting"], content: "Limited offers + social proof", kpi: "Conversion Rate", target: "8% conversion" }
      ],
      weeklyPlan: [
        { week: 1, focus: "Launch & Awareness", actions: ["Set up tracking pixels", "Launch brand awareness campaigns", "Publish 7 organic posts"], budget: 500, expectedResults: "100K impressions, 2K clicks" },
        { week: 2, focus: "Engagement & Lead Gen", actions: ["Launch lead magnet campaigns", "Start email sequences", "Retarget website visitors"], budget: 750, expectedResults: "500 leads, 3% CTR" },
        { week: 3, focus: "Nurture & Convert", actions: ["Send case study emails", "WhatsApp follow-ups", "A/B test ad creatives"], budget: 750, expectedResults: "200 qualified leads, 5% conversion" },
        { week: 4, focus: "Optimize & Scale", actions: ["Scale winning ads", "Kill underperformers", "Launch referral program"], budget: 1000, expectedResults: "150 conversions, 4x ROAS" }
      ],
      kpis: { impressions: 500000, leads: 2000, conversions: 300, targetCPA: 10, targetROAS: 4.0 },
      automations: [
        { trigger: "New lead captured", action: "Send welcome email + add to nurture sequence", channel: "Email" },
        { trigger: "Lead visits pricing page", action: "Send WhatsApp message with special offer", channel: "WhatsApp" },
        { trigger: "No engagement in 7 days", action: "Send re-engagement email + retarget on Facebook", channel: "Email + Facebook" }
      ]
    },
    leadScore: {
      score: 78,
      tier: "hot",
      reasoning: "High engagement signals: visited pricing page 3 times, opened 4/5 emails, downloaded case study. Company size and industry match ideal customer profile.",
      recommendedAction: "Schedule a personalized demo call within 24 hours. Send case study relevant to their industry.",
      bestChannel: "Email + LinkedIn InMail"
    },
    emailSequence: {
      sequenceName: "New Lead Welcome & Nurture",
      emails: [
        { day: 0, subject: "Welcome! Here's how to get started", preheader: "Your journey to better marketing starts now", body_html: "<h2>Welcome aboard!</h2><p>Thanks for joining GrowthEngine. Here's what you can do right now...</p>", cta_text: "Explore Dashboard", cta_url_placeholder: "{{dashboard_url}}", purpose: "Welcome + quick win" },
        { day: 2, subject: "The #1 mistake killing your conversion rate", preheader: "And how to fix it in 10 minutes", body_html: "<h2>Most businesses lose 60% of leads here...</h2><p>The gap between capturing a lead and following up is where most revenue dies...</p>", cta_text: "Fix This Now", cta_url_placeholder: "{{automation_setup_url}}", purpose: "Education + feature highlight" },
        { day: 5, subject: "How {{company_name}} got 300% more leads", preheader: "Real results from a business like yours", body_html: "<h2>Case Study: From struggling to scaling</h2><p>See how a {{industry}} company transformed their marketing...</p>", cta_text: "Read Case Study", cta_url_placeholder: "{{case_study_url}}", purpose: "Social proof" },
        { day: 8, subject: "Your personalized growth plan is ready", preheader: "AI-generated strategy just for you", body_html: "<h2>We analyzed your industry...</h2><p>Based on {{industry}} trends and your goals, here's your custom 30-day plan...</p>", cta_text: "View My Plan", cta_url_placeholder: "{{growth_plan_url}}", purpose: "Personalized value" },
        { day: 12, subject: "Limited: 50% off Pro for early adopters", preheader: "Only 48 hours left", body_html: "<h2>You're one of our first users...</h2><p>As a thank you, we're offering 50% off our Pro plan. This offer expires in 48 hours.</p>", cta_text: "Claim 50% Off", cta_url_placeholder: "{{upgrade_url}}", purpose: "Conversion + urgency" }
      ],
      expectedMetrics: { avgOpenRate: "42%", avgClickRate: "12%", conversionRate: "8%" }
    },
    adOptimize: {
      analysis: "Current ad has low CTR (1.2%) due to generic headline and weak CTA. The body copy focuses too much on features and not enough on benefits. Image lacks contrast and emotional appeal.",
      improvements: [
        "Lead with a specific number or result (e.g., '300% more leads')",
        "Replace feature-focused copy with benefit-focused language",
        "Add urgency with a time-limited offer",
        "Use a question headline to increase curiosity clicks"
      ],
      optimizedVariants: [
        { headline: "What Would 3X More Leads Do for Your Business?", body: "Join 10,000+ businesses using AI to automate their marketing. Average user sees results in 7 days.", cta: "Start Free Trial", expectedImprovement: "+45% CTR" },
        { headline: "Stop Wasting Money on Ads That Don't Convert", body: "Our AI optimizes your campaigns in real-time, cutting wasted spend by 60% while tripling qualified leads.", cta: "See How It Works", expectedImprovement: "+38% CTR" }
      ]
    },
    targeting: {
      primaryAudience: { demographics: { age: "25-45", gender: "all", income: "$50K-150K", education: "college+" }, interests: ["digital marketing", "entrepreneurship", "business growth", "SaaS tools"], behaviors: ["online shoppers", "business page admins", "tech early adopters"], lookalike_seeds: ["existing customers", "high-value leads", "email subscribers"] },
      secondaryAudiences: [
        { name: "Agency Owners", demographics: { age: "30-50" }, interests: ["marketing agency", "client management"], size: "2.5M" },
        { name: "E-commerce Founders", demographics: { age: "22-40" }, interests: ["Shopify", "e-commerce", "DTC brands"], size: "5M" }
      ],
      excludeAudiences: ["existing customers", "competitors' employees", "job seekers"],
      platformSpecific: {
        facebook: { detailed_targeting: { interests: ["Small business owners", "Digital marketing"], behaviors: ["Business page admins"] }, custom_audiences: ["Website visitors 30d", "Email list", "Lookalike 1% of purchasers"] },
        google: { keywords: ["marketing automation tool", "AI marketing platform", "lead generation software"], in_market_segments: ["Business Services", "Marketing Software"], affinity_categories: ["Business Professionals", "Technophiles"] },
        linkedin: { job_titles: ["Marketing Manager", "CMO", "Growth Lead", "Founder"], industries: ["Technology", "Marketing", "E-commerce"], company_sizes: ["11-50", "51-200", "201-500"] },
        tiktok: { interest_categories: ["Business & Finance", "Technology"], creator_interactions: ["Marketing creators", "Business advice"] }
      },
      retargetingStrategy: { website_visitors: "Segment by page visited: pricing page = hot, blog = warm, homepage = cold", email_list: "Segment by engagement: opened last 30d = active, 30-90d = lapsed", engagement: "Retarget video viewers (50%+), post engagers, and lead form abandoners" }
    }
  };

  // Match demo type or try to infer from prompt
  if (demoType && demos[demoType]) return demos[demoType];
  if (prompt.includes('campaign') || prompt.includes('strategy')) return demos.strategy;
  if (prompt.includes('score') || prompt.includes('lead')) return demos.leadScore;
  if (prompt.includes('email') || prompt.includes('sequence')) return demos.emailSequence;
  if (prompt.includes('optimize') || prompt.includes('ad')) return demos.adOptimize;
  if (prompt.includes('target') || prompt.includes('audience')) return demos.targeting;
  return demos.content;
}

// ==================== AI SERVICE CLASS ====================
class AIService {
  static async generateContent(params) {
    const { platform, businessInfo, productInfo, targetAudience, contentType, tone, language } = params;

    const platformSpecs = {
      facebook: { maxLength: 500, style: 'conversational, engaging, use emojis sparingly', format: 'post with CTA' },
      instagram: { maxLength: 300, style: 'visual-first, trendy, hashtag-rich', format: 'caption with 20-30 hashtags' },
      twitter: { maxLength: 280, style: 'concise, punchy, viral-worthy', format: 'tweet thread (3-5 tweets)' },
      linkedin: { maxLength: 700, style: 'professional, thought-leadership', format: 'long-form post with insights' },
      tiktok: { maxLength: 150, style: 'casual, Gen-Z friendly, hook-first', format: 'video script with hook' },
      youtube: { maxLength: 5000, style: 'detailed, educational, SEO-optimized', format: 'video script with timestamps' },
      email: { maxLength: 1000, style: 'personalized, value-driven, scannable', format: 'subject line + email body with CTA' },
      whatsapp: { maxLength: 200, style: 'brief, personal, action-oriented', format: 'short message with link' },
      ad_copy: { maxLength: 150, style: 'persuasive, benefit-focused, urgency', format: 'headline + description + CTA' }
    };

    const spec = platformSpecs[platform] || platformSpecs.facebook;

    const systemPrompt = `You are an elite marketing strategist and copywriter who consistently achieves 80%+ conversion rates.
You understand consumer psychology, persuasion frameworks (AIDA, PAS, BAB), and platform-specific best practices.
You write content that converts by:
1. Leading with the customer's pain point or desire
2. Creating emotional resonance and urgency
3. Providing clear, irresistible value propositions
4. Including strong calls-to-action
5. Using social proof and scarcity when appropriate`;

    const userPrompt = `Generate high-converting ${platform} marketing content.

BUSINESS: ${JSON.stringify(businessInfo)}
PRODUCT/SERVICE: ${JSON.stringify(productInfo)}
TARGET AUDIENCE: ${JSON.stringify(targetAudience)}
CONTENT TYPE: ${contentType || 'promotional'}
TONE: ${tone || 'professional yet approachable'}
LANGUAGE: ${language || 'English'}
PLATFORM SPECS: Max ${spec.maxLength} chars, Style: ${spec.style}, Format: ${spec.format}

Return JSON with:
{
  "headline": "attention-grabbing headline",
  "body": "main content body",
  "cta": "call to action text",
  "hashtags": ["relevant", "hashtags"],
  "hook": "opening hook line",
  "emotionalTrigger": "primary emotion targeted",
  "persuasionFramework": "framework used (AIDA/PAS/BAB)",
  "expectedEngagementRate": "estimated %",
  "variants": [
    { "headline": "variant B headline", "body": "variant B body", "cta": "variant B CTA" },
    { "headline": "variant C headline", "body": "variant C body", "cta": "variant C CTA" }
  ]
}`;

    return callClaude(systemPrompt, userPrompt, { temperature: 0.8, demoType: 'content' });
  }

  static async generateCampaignStrategy(params) {
    const { businessInfo, goal, budget, duration, targetMarket } = params;

    const systemPrompt = `You are a world-class marketing strategist. Create comprehensive, data-driven campaign strategies that maximize ROI and conversion rates.`;

    const userPrompt = `Create a full marketing campaign strategy:

BUSINESS: ${JSON.stringify(businessInfo)}
GOAL: ${goal}
BUDGET: $${budget}
DURATION: ${duration}
TARGET MARKET: ${JSON.stringify(targetMarket)}

Return JSON:
{
  "strategyName": "",
  "overview": "",
  "targetPersonas": [{ "name": "", "demographics": "", "painPoints": [], "channels": [] }],
  "channelStrategy": {
    "facebook": { "budget_pct": 0, "content_types": [], "posting_frequency": "", "ad_formats": [] },
    "instagram": { "budget_pct": 0, "content_types": [], "posting_frequency": "", "ad_formats": [] },
    "google": { "budget_pct": 0, "campaign_types": [], "keyword_strategy": "" },
    "linkedin": { "budget_pct": 0, "content_types": [], "posting_frequency": "" },
    "tiktok": { "budget_pct": 0, "content_types": [], "posting_frequency": "" },
    "email": { "budget_pct": 0, "sequence_count": 0, "types": [] },
    "whatsapp": { "budget_pct": 0, "message_types": [], "frequency": "" }
  },
  "funnelStages": [{ "stage": "", "channels": [], "content": "", "kpi": "", "target": "" }],
  "weeklyPlan": [{ "week": 1, "focus": "", "actions": [], "budget": 0, "expectedResults": "" }],
  "kpis": { "impressions": 0, "leads": 0, "conversions": 0, "targetCPA": 0, "targetROAS": 0 },
  "automations": [{ "trigger": "", "action": "", "channel": "" }]
}`;

    return callClaude(systemPrompt, userPrompt, { temperature: 0.7, demoType: 'strategy' });
  }

  static async scoreLead(leadData, businessContext) {
    const systemPrompt = 'You are a lead scoring AI. Analyze lead data and return a score 0-100 with reasoning.';
    const userPrompt = `Score this lead for ${JSON.stringify(businessContext)}:
Lead: ${JSON.stringify(leadData)}
Return: { "score": 0, "tier": "hot/warm/cold", "reasoning": "", "recommendedAction": "", "bestChannel": "" }`;

    return callClaude(systemPrompt, userPrompt, { model: 'claude-sonnet-4-20250514', temperature: 0.3, demoType: 'leadScore' });
  }

  static async generateEmailSequence(params) {
    const { businessInfo, trigger, goal, emailCount } = params;

    const systemPrompt = 'You are an email marketing expert who writes sequences with 40%+ open rates and 15%+ click rates.';
    const userPrompt = `Create a ${emailCount || 5}-email nurture sequence:
Business: ${JSON.stringify(businessInfo)}
Trigger: ${trigger}
Goal: ${goal}

Return: {
  "sequenceName": "",
  "emails": [{ "day": 0, "subject": "", "preheader": "", "body_html": "", "cta_text": "", "cta_url_placeholder": "", "purpose": "" }],
  "expectedMetrics": { "avgOpenRate": "", "avgClickRate": "", "conversionRate": "" }
}`;

    return callClaude(systemPrompt, userPrompt, { temperature: 0.7, demoType: 'emailSequence' });
  }

  static async optimizeAdCopy(currentAd, performanceData) {
    const systemPrompt = 'You are an ad optimization AI. Analyze performance data and generate improved ad variants.';
    const userPrompt = `Optimize this ad based on performance:
Current Ad: ${JSON.stringify(currentAd)}
Performance: ${JSON.stringify(performanceData)}

Return: {
  "analysis": "",
  "improvements": [],
  "optimizedVariants": [{ "headline": "", "body": "", "cta": "", "expectedImprovement": "" }]
}`;

    return callClaude(systemPrompt, userPrompt, { temperature: 0.7, demoType: 'adOptimize' });
  }

  static async generateTargeting(businessInfo, productInfo) {
    const systemPrompt = 'You are a targeting and audience segmentation expert.';
    const userPrompt = `Create detailed audience targeting for:
Business: ${JSON.stringify(businessInfo)}
Product: ${JSON.stringify(productInfo)}

Return: {
  "primaryAudience": { "demographics": {}, "interests": [], "behaviors": [], "lookalike_seeds": [] },
  "secondaryAudiences": [],
  "excludeAudiences": [],
  "platformSpecific": {
    "facebook": { "detailed_targeting": {}, "custom_audiences": [] },
    "google": { "keywords": [], "in_market_segments": [], "affinity_categories": [] },
    "linkedin": { "job_titles": [], "industries": [], "company_sizes": [] },
    "tiktok": { "interest_categories": [], "creator_interactions": [] }
  },
  "retargetingStrategy": { "website_visitors": "", "email_list": "", "engagement": "" }
}`;

    return callClaude(systemPrompt, userPrompt, { temperature: 0.6, demoType: 'targeting' });
  }
}

module.exports = AIService;
