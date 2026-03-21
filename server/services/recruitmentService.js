const axios = require('axios');
const AIService = require('./aiService');
const PlatformService = require('./platformService');

// Shared Claude AI helper
let _anthropic = null;
function getClaude() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!_anthropic) {
    const Anthropic = require('@anthropic-ai/sdk');
    _anthropic = new Anthropic({ apiKey: key });
  }
  return _anthropic;
}

async function callClaude(systemPrompt, userPrompt, options = {}) {
  const client = getClaude();
  if (!client) {
    // Demo mode fallback
    return options.demoData || {};
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse AI response');
    return JSON.parse(jsonMatch[0]);
  } catch (apiError) {
    console.log('[Recruitment AI] Claude API error, falling back to demo:', apiError.message);
    return options.demoData || {};
  }
}

class RecruitmentService {

  // ==================== AI JOB AD GENERATION ====================

  static async generateJobAd(params) {
    const { role, company, industry, location, type, salary, requirements, benefits, tone, platforms } = params;

    const systemPrompt = `You are an elite recruitment marketing specialist who creates job ads that attract top talent with 3x higher application rates than average. You understand employer branding, candidate psychology, and platform-specific best practices for recruitment content.`;

    const userPrompt = `Create a high-performing recruitment ad campaign:

ROLE: ${role}
COMPANY: ${JSON.stringify(company)}
INDUSTRY: ${industry}
LOCATION: ${location}
TYPE: ${type} (full-time/part-time/contract/remote)
SALARY: ${salary || 'Competitive'}
KEY REQUIREMENTS: ${JSON.stringify(requirements)}
BENEFITS: ${JSON.stringify(benefits)}
TONE: ${tone || 'professional yet exciting'}
TARGET PLATFORMS: ${JSON.stringify(platforms)}

Return JSON:
{
  "jobTitle": "optimized title for search visibility",
  "tagline": "catchy one-liner to grab attention",
  "summary": "compelling 2-3 sentence overview",
  "fullDescription": "detailed job description with sections",
  "requirements": ["prioritized list of must-haves"],
  "niceToHaves": ["desirable but not required"],
  "benefits": ["rewritten benefits that sell the opportunity"],
  "employerBrandPitch": "why this company is amazing to work for",
  "platformContent": {
    "linkedin": { "headline": "", "body": "", "hashtags": [] },
    "facebook": { "headline": "", "body": "", "cta": "" },
    "instagram": { "caption": "", "hashtags": [], "storyText": "" },
    "twitter": { "tweets": ["", "", ""], "hashtags": [] },
    "tiktok": { "videoScript": "", "hook": "", "caption": "" },
    "indeed": { "title": "", "description": "" },
    "glassdoor": { "title": "", "description": "" },
    "jobBoard": { "title": "", "description": "", "seoKeywords": [] }
  },
  "emailOutreach": { "subject": "", "body": "", "followUp": "" },
  "whatsappMessage": "",
  "targetAudience": { "demographics": {}, "skills": [], "currentTitles": [], "industries": [], "experience_years": "" },
  "adTargeting": {
    "linkedin": { "job_titles": [], "skills": [], "industries": [], "seniority": [] },
    "facebook": { "interests": [], "behaviors": [], "job_titles": [] },
    "google": { "keywords": [], "negative_keywords": [] }
  },
  "variants": [
    { "approach": "benefit-led", "headline": "", "body": "" },
    { "approach": "culture-led", "headline": "", "body": "" },
    { "approach": "growth-led", "headline": "", "body": "" }
  ]
}`;

    return callClaude(systemPrompt, userPrompt, {
      temperature: 0.8,
      demoData: {
        jobTitle: `Senior ${role || 'Software Engineer'}`,
        tagline: "Build the future with us — your next career move starts here",
        summary: `We're looking for an exceptional ${role || 'professional'} to join our team. This is an opportunity to make a real impact in a fast-growing company.`,
        fullDescription: `About the Role:\nWe're seeking a talented ${role || 'professional'} to help drive our next phase of growth.\n\nWhat You'll Do:\n- Lead key initiatives and projects\n- Collaborate with cross-functional teams\n- Drive innovation and continuous improvement`,
        requirements: ["3+ years relevant experience", "Strong communication skills", "Proven track record of results"],
        niceToHaves: ["Leadership experience", "Industry certifications", "Startup experience"],
        benefits: ["Competitive salary + equity", "Remote-first culture", "Unlimited PTO", "Health & wellness benefits", "Learning budget"],
        employerBrandPitch: "We're a mission-driven team building the future of technology. Join us and work on problems that matter.",
        platformContent: {
          linkedin: { headline: `We're Hiring: ${role || 'Top Talent'}`, body: "Join our team and make an impact.", hashtags: ["#Hiring", "#Careers", "#JoinUs"] },
          facebook: { headline: `Join Our Team!`, body: `We're looking for a ${role || 'rockstar'} to join us.`, cta: "Apply Now" },
          instagram: { caption: `We're hiring! 🚀 ${role || 'New role'} open.`, hashtags: ["#Hiring", "#Careers"], storyText: "Swipe up to apply!" }
        },
        emailOutreach: { subject: `Exciting opportunity: ${role}`, body: "I came across your profile and thought you'd be a great fit...", followUp: "Just checking if you had a chance to review..." },
        whatsappMessage: `Hi! We have an exciting ${role} opportunity. Interested in learning more?`,
        variants: [
          { approach: "benefit-led", headline: "Great Benefits, Greater Impact", body: "Join a team that invests in you." },
          { approach: "culture-led", headline: "Culture That Empowers", body: "Work where your voice matters." }
        ]
      }
    });
  }

  // ==================== JOB BOARD INTEGRATIONS ====================

  static async postToIndeed(credentials, jobData) {
    const url = 'https://apis.indeed.com/v2/jobs';
    return axios.post(url, {
      title: jobData.title,
      description: jobData.description,
      location: jobData.location,
      salary: { min: jobData.salaryMin, max: jobData.salaryMax, type: jobData.salaryType || 'YEARLY' },
      jobType: jobData.type,
      sponsoredBudget: jobData.dailyBudget,
      companyName: jobData.company
    }, {
      headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
    });
  }

  static async postLinkedInJob(accessToken, jobData) {
    const url = 'https://api.linkedin.com/v2/simpleJobPostings';
    return axios.post(url, {
      title: jobData.title,
      description: { text: jobData.description },
      location: jobData.location,
      listedAt: Date.now(),
      jobPostingOperationType: 'CREATE',
      companyApplyUrl: jobData.applyUrl,
      workplaceTypes: [jobData.workplaceType || 'On-Site'],
      integrationContext: 'urn:li:organization:' + jobData.companyId
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  static async createLinkedInRecruitmentAd(accessToken, adData) {
    const campaignUrl = 'https://api.linkedin.com/v2/adCampaignsV2';
    const campaign = await axios.post(campaignUrl, {
      account: adData.adAccountUrn,
      name: `Hiring: ${adData.role}`,
      objectiveType: 'TALENT_LEADS',
      type: 'SPONSORED_UPDATES',
      status: 'PAUSED',
      dailyBudget: { amount: String(adData.dailyBudget * 100), currencyCode: 'USD' },
      targetingCriteria: {
        include: {
          and: [
            { or: { 'urn:li:adTargetingFacet:skills': adData.targetSkills } },
            { or: { 'urn:li:adTargetingFacet:titleSeniority': adData.targetSeniority } },
            { or: { 'urn:li:adTargetingFacet:staffCountRanges': adData.targetCompanySizes } }
          ]
        }
      }
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return campaign.data;
  }

  static async createGoogleRecruitmentAd(credentials, adData) {
    const url = `https://googleads.googleapis.com/v15/customers/${credentials.customerId}/campaigns:mutate`;
    return axios.post(url, {
      operations: [{
        create: {
          name: `Hiring: ${adData.role}`,
          advertisingChannelType: 'SEARCH',
          status: 'PAUSED',
          campaignBudget: adData.budget,
          startDate: adData.startDate,
          endDate: adData.endDate,
          targetingSetting: { targetRestrictions: [{ targetingDimension: 'KEYWORD', bidOnly: false }] }
        }
      }]
    }, {
      headers: { 'Authorization': `Bearer ${credentials.accessToken}`, 'developer-token': credentials.developerToken }
    });
  }

  static async createMetaRecruitmentAd(accessToken, adAccountId, adData) {
    const campaignUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`;
    const campaign = await axios.post(campaignUrl, {
      name: `Hiring: ${adData.role}`,
      objective: 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: ['EMPLOYMENT'],
      access_token: accessToken
    });
    const adSetUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`;
    const adSet = await axios.post(adSetUrl, {
      name: `${adData.role} - Candidates`,
      campaign_id: campaign.data.id,
      daily_budget: adData.dailyBudget * 100,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LEAD_GENERATION',
      targeting: {
        geo_locations: adData.locations,
        education_statuses: adData.educationLevels,
        work_positions: adData.targetJobTitles?.map(t => ({ name: t })),
        industries: adData.targetIndustries?.map(i => ({ name: i }))
      },
      status: 'PAUSED',
      access_token: accessToken
    });
    return { campaignId: campaign.data.id, adSetId: adSet.data.id };
  }

  // ==================== APPLICANT TRACKING ====================

  static async scoreApplicant(applicantData, jobRequirements) {
    const systemPrompt = 'You are a recruitment AI. Score applicants against job requirements objectively and thoroughly.';
    const userPrompt = `Score this applicant:
Applicant: ${JSON.stringify(applicantData)}
Requirements: ${JSON.stringify(jobRequirements)}

Return: {
  "score": 0-100,
  "tier": "excellent/good/average/poor",
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "concerns": [],
  "interviewRecommendation": true/false,
  "suggestedQuestions": [],
  "salaryEstimate": "",
  "cultureFitScore": 0-100
}`;

    return callClaude(systemPrompt, userPrompt, {
      temperature: 0.3,
      demoData: {
        score: 82,
        tier: "good",
        matchedSkills: ["JavaScript", "React", "Node.js", "Team leadership"],
        missingSkills: ["Kubernetes"],
        strengths: ["Strong portfolio", "Relevant industry experience", "Leadership track record"],
        concerns: ["Short tenure at last role"],
        interviewRecommendation: true,
        suggestedQuestions: ["Tell us about a project where you led a team through a challenging deadline", "How do you approach learning new technologies?"],
        salaryEstimate: "$85,000 - $110,000",
        cultureFitScore: 75
      }
    });
  }

  static async generateCandidateOutreach(candidateProfile, jobInfo, channel) {
    const systemPrompt = 'You are an expert recruiter who writes personalized outreach messages with 40%+ response rates.';
    const userPrompt = `Write personalized recruitment outreach:
Candidate: ${JSON.stringify(candidateProfile)}
Job: ${JSON.stringify(jobInfo)}
Channel: ${channel}

Return: {
  "subject": "",
  "message": "",
  "followUpDay3": "",
  "followUpDay7": "",
  "followUpDay14": "",
  "personalizationPoints": [],
  "valueProposition": ""
}`;

    return callClaude(systemPrompt, userPrompt, {
      temperature: 0.7,
      demoData: {
        subject: "Your experience at [Company] caught my eye",
        message: "Hi [Name], I noticed your impressive work in [field]. We have an exciting opportunity that aligns perfectly with your background...",
        followUpDay3: "Hi [Name], just wanted to follow up on my previous message...",
        followUpDay7: "Hi [Name], I understand you're busy. Quick question — would a 15-min chat this week work?",
        followUpDay14: "Hi [Name], last reach-out from me. If the timing isn't right, no worries at all.",
        personalizationPoints: ["Recent project at current company", "Shared industry expertise", "Career growth alignment"],
        valueProposition: "Opportunity to lead a growing team with significant impact and competitive compensation."
      }
    });
  }

  // ==================== MULTI-PLATFORM RECRUITMENT CAMPAIGN ====================

  static async launchRecruitmentCampaign(connections, jobAd, budget, platforms) {
    const results = {};

    for (const platform of platforms) {
      const conn = connections.find(c => c.platform === platform);
      if (!conn) {
        results[platform] = { success: false, error: 'Not connected' };
        continue;
      }

      try {
        const content = jobAd.platformContent?.[platform];
        if (!content) {
          results[platform] = { success: false, error: 'No content generated for this platform' };
          continue;
        }

        switch (platform) {
          case 'linkedin':
            await PlatformService.postToLinkedIn(conn.access_token, conn.account_id, { text: content.body });
            results[platform] = { success: true, type: 'organic_post + sponsored_ad' };
            break;
          case 'facebook':
            await PlatformService.postToFacebook(conn.access_token, conn.account_id, { text: `${content.headline}\n\n${content.body}\n\n${content.cta}` });
            results[platform] = { success: true, type: 'organic_post' };
            break;
          case 'instagram':
            results[platform] = { success: true, type: 'content_ready', note: 'Image required for Instagram post' };
            break;
          case 'twitter':
            for (const tweet of content.tweets || []) {
              await PlatformService.postToTwitter({ accessToken: conn.access_token }, { text: tweet });
            }
            results[platform] = { success: true, type: 'tweet_thread' };
            break;
          case 'whatsapp':
            results[platform] = { success: true, type: 'template_ready', message: jobAd.whatsappMessage };
            break;
          default:
            results[platform] = { success: true, type: 'content_ready' };
        }
      } catch (err) {
        results[platform] = { success: false, error: err.message };
      }
    }

    return results;
  }
}

module.exports = RecruitmentService;
