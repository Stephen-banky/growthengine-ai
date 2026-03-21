const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class AIService {
  // Generate marketing content for any platform
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
5. Using social proof and scarcity when appropriate
Always output valid JSON.`;

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

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Generate full campaign strategy
  static async generateCampaignStrategy(params) {
    const { businessInfo, goal, budget, duration, targetMarket } = params;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a world-class marketing strategist. Create comprehensive, data-driven campaign strategies
that maximize ROI and conversion rates. Always output valid JSON.`
        },
        {
          role: 'user',
          content: `Create a full marketing campaign strategy:

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
  "funnelStages": [
    { "stage": "", "channels": [], "content": "", "kpi": "", "target": "" }
  ],
  "weeklyPlan": [
    { "week": 1, "focus": "", "actions": [], "budget": 0, "expectedResults": "" }
  ],
  "kpis": { "impressions": 0, "leads": 0, "conversions": 0, "targetCPA": 0, "targetROAS": 0 },
  "automations": [{ "trigger": "", "action": "", "channel": "" }]
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Analyze and score leads
  static async scoreLead(leadData, businessContext) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a lead scoring AI. Analyze lead data and return a score 0-100 with reasoning. Output JSON.'
        },
        {
          role: 'user',
          content: `Score this lead for ${JSON.stringify(businessContext)}:
Lead: ${JSON.stringify(leadData)}
Return: { "score": 0, "tier": "hot/warm/cold", "reasoning": "", "recommendedAction": "", "bestChannel": "" }`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Generate email sequence
  static async generateEmailSequence(params) {
    const { businessInfo, trigger, goal, emailCount } = params;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an email marketing expert who writes sequences with 40%+ open rates and 15%+ click rates. Output JSON.'
        },
        {
          role: 'user',
          content: `Create a ${emailCount || 5}-email nurture sequence:
Business: ${JSON.stringify(businessInfo)}
Trigger: ${trigger}
Goal: ${goal}

Return: {
  "sequenceName": "",
  "emails": [
    {
      "day": 0,
      "subject": "",
      "preheader": "",
      "body_html": "",
      "cta_text": "",
      "cta_url_placeholder": "",
      "purpose": ""
    }
  ],
  "expectedMetrics": { "avgOpenRate": "", "avgClickRate": "", "conversionRate": "" }
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Optimize ad copy using performance data
  static async optimizeAdCopy(currentAd, performanceData) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an ad optimization AI. Analyze performance data and generate improved ad variants. Output JSON.'
        },
        {
          role: 'user',
          content: `Optimize this ad based on performance:
Current Ad: ${JSON.stringify(currentAd)}
Performance: ${JSON.stringify(performanceData)}

Return: {
  "analysis": "",
  "improvements": [],
  "optimizedVariants": [
    { "headline": "", "body": "", "cta": "", "expectedImprovement": "" }
  ]
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Generate audience targeting recommendations
  static async generateTargeting(businessInfo, productInfo) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a targeting and audience segmentation expert. Output JSON.'
        },
        {
          role: 'user',
          content: `Create detailed audience targeting for:
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
}`
        }
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }
}

module.exports = AIService;
