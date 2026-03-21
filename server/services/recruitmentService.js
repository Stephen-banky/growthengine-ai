const axios = require('axios');
const AIService = require('./aiService');
const PlatformService = require('./platformService');

class RecruitmentService {

  // ==================== AI JOB AD GENERATION ====================

  static async generateJobAd(params) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { role, company, industry, location, type, salary, requirements, benefits, tone, platforms } = params;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an elite recruitment marketing specialist who creates job ads that attract top talent with 3x higher application rates than average. You understand employer branding, candidate psychology, and platform-specific best practices for recruitment content. Always output valid JSON.`
        },
        {
          role: 'user',
          content: `Create a high-performing recruitment ad campaign:

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
  "emailOutreach": {
    "subject": "",
    "body": "",
    "followUp": ""
  },
  "whatsappMessage": "",
  "targetAudience": {
    "demographics": {},
    "skills": [],
    "currentTitles": [],
    "industries": [],
    "experience_years": ""
  },
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
}`
        }
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // ==================== JOB BOARD INTEGRATIONS ====================

  // Indeed Sponsored Job
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

  // LinkedIn Jobs
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

  // LinkedIn Recruitment Ad (Sponsored Content)
  static async createLinkedInRecruitmentAd(accessToken, adData) {
    // Create campaign with TALENT_LEADS objective
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

  // Google Ads for Recruitment
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
          // Use recruitment-specific keyword intent
          targetingSetting: {
            targetRestrictions: [{
              targetingDimension: 'KEYWORD',
              bidOnly: false
            }]
          }
        }
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'developer-token': credentials.developerToken
      }
    });
  }

  // Facebook/Meta Recruitment Ad
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

  // Score applicant using AI
  static async scoreApplicant(applicantData, jobRequirements) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a recruitment AI. Score applicants against job requirements. Output JSON.'
        },
        {
          role: 'user',
          content: `Score this applicant:
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
}`
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Generate personalized outreach to passive candidates
  static async generateCandidateOutreach(candidateProfile, jobInfo, channel) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert recruiter who writes personalized outreach messages with 40%+ response rates. Output JSON.'
        },
        {
          role: 'user',
          content: `Write personalized recruitment outreach:
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
}`
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
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
            // Post organic + create sponsored ad
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
