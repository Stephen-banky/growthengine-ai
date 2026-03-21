const axios = require('axios');

/**
 * Chinese Social Media Platform Integrations
 * Supports: WeChat (微信), Weibo (微博), Douyin (抖音/TikTok China),
 * RED/Xiaohongshu (小红书), Bilibili (哔哩哔哩), Baidu Marketing
 */
class ChinesePlatformService {

  // ==================== WECHAT (微信) ====================

  // WeChat Official Account - Publish Article
  static async publishWeChatArticle(accessToken, content) {
    // Step 1: Upload thumb image
    const mediaUrl = 'https://api.weixin.qq.com/cgi-bin/material/add_material';

    // Step 2: Create draft
    const draftUrl = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${accessToken}`;
    const draft = await axios.post(draftUrl, {
      articles: [{
        title: content.title,
        author: content.author,
        digest: content.summary,
        content: content.htmlBody,
        content_source_url: content.sourceUrl,
        thumb_media_id: content.thumbMediaId,
        need_open_comment: 1,
        only_fans_can_comment: 0
      }]
    });

    // Step 3: Publish
    const publishUrl = `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${accessToken}`;
    return axios.post(publishUrl, { media_id: draft.data.media_id });
  }

  // WeChat Mini Program - Send Template Message
  static async sendWeChatMiniProgramMsg(accessToken, openId, templateId, data, page) {
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    return axios.post(url, {
      touser: openId,
      template_id: templateId,
      page: page || 'pages/index/index',
      miniprogram_state: 'formal',
      lang: 'zh_CN',
      data: data
    });
  }

  // WeChat Moments Ad (via Marketing API)
  static async createWeChatMomentsAd(credentials, adData) {
    const url = 'https://api.weixin.qq.com/marketing/campaign/add';
    return axios.post(url, {
      campaign_name: adData.name,
      campaign_type: 'CAMPAIGN_TYPE_WECHAT_MOMENTS',
      daily_budget: adData.dailyBudget,
      begin_date: adData.startDate,
      end_date: adData.endDate,
      targeting: {
        age: adData.targeting?.age,
        gender: adData.targeting?.gender,
        geo_location: adData.targeting?.locations,
        interest_category_id_list: adData.targeting?.interests
      }
    }, {
      headers: { 'Authorization': `Bearer ${credentials.accessToken}` }
    });
  }

  // ==================== WEIBO (微博) ====================

  // Publish Weibo Post
  static async postToWeibo(accessToken, content) {
    const url = 'https://api.weibo.com/2/statuses/share.json';
    const params = new URLSearchParams();
    params.append('access_token', accessToken);
    params.append('status', content.text);
    if (content.imageUrl) params.append('pic', content.imageUrl);
    return axios.post(url, params);
  }

  // Weibo Fan Headline (Promoted Post)
  static async createWeiboFanHeadline(accessToken, statusId, duration) {
    const url = 'https://api.weibo.com/2/fanheadline/create.json';
    return axios.post(url, null, {
      params: { access_token: accessToken, status_id: statusId, duration: duration || 24 }
    });
  }

  // Get Weibo Analytics
  static async getWeiboAnalytics(accessToken) {
    const url = 'https://api.weibo.com/2/statuses/user_timeline.json';
    return axios.get(url, {
      params: { access_token: accessToken, count: 50 }
    });
  }

  // ==================== DOUYIN (抖音 / TikTok China) ====================

  // Publish Video to Douyin
  static async publishDouyinVideo(accessToken, videoData) {
    // Step 1: Upload video
    const uploadUrl = 'https://open.douyin.com/api/douyin/v1/video/upload/';
    const uploadResult = await axios.post(uploadUrl, videoData.videoFile, {
      headers: {
        'Content-Type': 'video/mp4',
        'access-token': accessToken
      }
    });

    // Step 2: Create & publish
    const createUrl = 'https://open.douyin.com/api/douyin/v1/video/create/';
    return axios.post(createUrl, {
      video_id: uploadResult.data.data.video.video_id,
      text: videoData.caption,
      poi_id: videoData.locationId,
      micro_app_id: videoData.miniAppId,
      at_users: videoData.mentionUsers
    }, {
      headers: { 'access-token': accessToken }
    });
  }

  // Douyin Ad Campaign (Ocean Engine / 巨量引擎)
  static async createDouyinAdCampaign(credentials, campaignData) {
    const url = 'https://ad.oceanengine.com/open_api/v3.0/campaign/create/';
    return axios.post(url, {
      advertiser_id: credentials.advertiserId,
      campaign_name: campaignData.name,
      campaign_type: campaignData.type || 'FEED',
      landing_type: campaignData.landingType || 'LINK',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: campaignData.dailyBudget
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': credentials.accessToken
      }
    });
  }

  // ==================== XIAOHONGSHU / RED (小红书) ====================

  // Publish Note to Xiaohongshu
  static async publishXiaohongshuNote(accessToken, noteData) {
    const url = 'https://edith.xiaohongshu.com/api/sns/web/v1/feed/create';
    return axios.post(url, {
      title: noteData.title,
      desc: noteData.description,
      type: noteData.type || 'normal', // 'normal' for image+text, 'video' for video
      images: noteData.images,
      video: noteData.video,
      topics: noteData.topics,
      ats: noteData.mentions
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Xiaohongshu KOL/KOC Discovery
  static async searchXiaohongshuInfluencers(accessToken, params) {
    const url = 'https://edith.xiaohongshu.com/api/sns/web/v1/search/notes';
    return axios.post(url, {
      keyword: params.keyword,
      sort: params.sort || 'general',
      page: params.page || 1,
      page_size: 20
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
  }

  // ==================== BILIBILI (哔哩哔哩) ====================

  // Upload Video to Bilibili
  static async publishBilibiliVideo(credentials, videoData) {
    const url = 'https://member.bilibili.com/x/vu/web/add/v3';
    return axios.post(url, {
      title: videoData.title,
      desc: videoData.description,
      tag: videoData.tags?.join(','),
      tid: videoData.categoryId || 21,
      cover: videoData.coverUrl,
      videos: [{ filename: videoData.filename, title: videoData.title }]
    }, {
      headers: { 'Cookie': credentials.cookie }
    });
  }

  // ==================== BAIDU MARKETING (百度推广) ====================

  // Create Baidu Search Ad
  static async createBaiduSearchAd(credentials, adData) {
    const url = 'https://api.baidu.com/json/sms/service/CampaignService/addCampaign';
    return axios.post(url, {
      header: {
        username: credentials.username,
        password: credentials.password,
        token: credentials.token
      },
      body: {
        campaignTypes: [{
          campaignName: adData.name,
          budget: adData.dailyBudget,
          regionTarget: adData.regions,
          schedule: adData.schedule,
          negativeWords: adData.negativeKeywords
        }]
      }
    });
  }

  // ==================== MULTI-PLATFORM PUBLISHER ====================

  static async publishToChinesePlatforms(connections, content) {
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
          case 'wechat':
            results[platform] = await this.publishWeChatArticle(conn.access_token, content);
            break;
          case 'weibo':
            results[platform] = await this.postToWeibo(conn.access_token, content);
            break;
          case 'douyin':
            results[platform] = await this.publishDouyinVideo(conn.access_token, content);
            break;
          case 'xiaohongshu':
            results[platform] = await this.publishXiaohongshuNote(conn.access_token, content);
            break;
          case 'bilibili':
            results[platform] = await this.publishBilibiliVideo(conn, content);
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

module.exports = ChinesePlatformService;
