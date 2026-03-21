const axios = require('axios');

class PlatformService {
  // ==================== META (Facebook + Instagram) ====================
  static async postToFacebook(accessToken, pageId, content) {
    const url = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    return axios.post(url, {
      message: content.text,
      link: content.link || undefined,
      access_token: accessToken
    });
  }

  static async postToInstagram(accessToken, igUserId, content) {
    // Step 1: Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    const container = await axios.post(containerUrl, {
      image_url: content.imageUrl,
      caption: content.text,
      access_token: accessToken
    });
    // Step 2: Publish
    const publishUrl = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    return axios.post(publishUrl, {
      creation_id: container.data.id,
      access_token: accessToken
    });
  }

  static async getMetaAdInsights(accessToken, adAccountId, dateRange) {
    const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/insights`;
    return axios.get(url, {
      params: {
        fields: 'impressions,clicks,spend,conversions,cpc,cpm,ctr,actions',
        time_range: JSON.stringify(dateRange),
        access_token: accessToken
      }
    });
  }

  static async createMetaAd(accessToken, adAccountId, adData) {
    // Create campaign
    const campaignUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns`;
    const campaign = await axios.post(campaignUrl, {
      name: adData.campaignName,
      objective: adData.objective || 'OUTCOME_LEADS',
      status: 'PAUSED',
      special_ad_categories: [],
      access_token: accessToken
    });

    // Create ad set with targeting
    const adSetUrl = `https://graph.facebook.com/v18.0/act_${adAccountId}/adsets`;
    const adSet = await axios.post(adSetUrl, {
      name: `${adData.campaignName} - Ad Set`,
      campaign_id: campaign.data.id,
      daily_budget: adData.dailyBudget * 100,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LEAD_GENERATION',
      targeting: adData.targeting,
      status: 'PAUSED',
      access_token: accessToken
    });

    return { campaignId: campaign.data.id, adSetId: adSet.data.id };
  }

  // ==================== GOOGLE ADS ====================
  static async createGoogleAdsCampaign(credentials, campaignData) {
    // Google Ads API requires OAuth2 + developer token
    const url = `https://googleads.googleapis.com/v15/customers/${credentials.customerId}/campaigns:mutate`;
    return axios.post(url, {
      operations: [{
        create: {
          name: campaignData.name,
          advertisingChannelType: campaignData.channelType || 'SEARCH',
          status: 'PAUSED',
          campaignBudget: campaignData.budget,
          startDate: campaignData.startDate,
          endDate: campaignData.endDate
        }
      }]
    }, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'developer-token': credentials.developerToken
      }
    });
  }

  // ==================== TWITTER / X ====================
  static async postToTwitter(credentials, content) {
    const url = 'https://api.twitter.com/2/tweets';
    return axios.post(url, { text: content.text }, {
      headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
    });
  }

  // ==================== LINKEDIN ====================
  static async postToLinkedIn(accessToken, authorUrn, content) {
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    return axios.post(url, {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content.text },
          shareMediaCategory: content.imageUrl ? 'IMAGE' : 'NONE'
        }
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // ==================== TIKTOK ====================
  static async postToTikTok(accessToken, content) {
    const url = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
    return axios.post(url, {
      post_info: { title: content.text, privacy_level: 'PUBLIC_TO_EVERYONE' },
      source_info: { source: 'PULL_FROM_URL', video_url: content.videoUrl }
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // ==================== WHATSAPP BUSINESS ====================
  static async sendWhatsAppMessage(accessToken, phoneNumberId, to, template) {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    return axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language || 'en_US' },
        components: template.components || []
      }
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  static async sendWhatsAppText(accessToken, phoneNumberId, to, text) {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    return axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: text }
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // ==================== YOUTUBE ====================
  static async getYouTubeAnalytics(accessToken, channelId) {
    const url = 'https://youtubeanalytics.googleapis.com/v2/reports';
    return axios.get(url, {
      params: {
        ids: `channel==${channelId}`,
        startDate: '2024-01-01',
        endDate: new Date().toISOString().split('T')[0],
        metrics: 'views,likes,subscribersGained,estimatedMinutesWatched',
        dimensions: 'day'
      },
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // ==================== EMAIL (Nodemailer) ====================
  static async sendEmail(smtpConfig, emailData) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass }
    });

    return transporter.sendMail({
      from: emailData.from || smtpConfig.user,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });
  }

  // ==================== MULTI-PLATFORM POST ====================
  static async publishToMultiplePlatforms(connections, content) {
    const results = {};
    const platforms = content.platforms || [];

    for (const platform of platforms) {
      const conn = connections.find(c => c.platform === platform);
      if (!conn) {
        results[platform] = { success: false, error: 'Not connected' };
        continue;
      }
      try {
        switch (platform) {
          case 'facebook':
            results[platform] = await this.postToFacebook(conn.access_token, conn.account_id, content);
            break;
          case 'instagram':
            results[platform] = await this.postToInstagram(conn.access_token, conn.account_id, content);
            break;
          case 'twitter':
            results[platform] = await this.postToTwitter({ accessToken: conn.access_token }, content);
            break;
          case 'linkedin':
            results[platform] = await this.postToLinkedIn(conn.access_token, conn.account_id, content);
            break;
          case 'tiktok':
            results[platform] = await this.postToTikTok(conn.access_token, content);
            break;
          default:
            results[platform] = { success: false, error: 'Unsupported platform' };
        }
        results[platform] = { success: true, data: results[platform]?.data };
      } catch (err) {
        results[platform] = { success: false, error: err.message };
      }
    }
    return results;
  }
}

module.exports = PlatformService;
