const axios = require('axios');

// Lazy OpenAI client for DALL-E image generation (separate from main AI service)
let _openai = null;
function getOpenAIForImages() {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const OpenAI = require('openai');
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

class MediaGenService {
  // ==================== IMAGE GENERATION ====================

  // OpenAI DALL-E 3
  static async generateImageDALLE(prompt, options = {}) {
    const openai = getOpenAIForImages();
    if (!openai) throw new Error('OPENAI_API_KEY required for DALL-E image generation. Add it in Netlify Environment Variables.');
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Professional marketing image: ${prompt}`,
      n: 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'hd',
      style: options.style || 'vivid'
    });
    return { url: response.data[0].url, revised_prompt: response.data[0].revised_prompt, provider: 'dall-e-3' };
  }

  // Stability AI (Stable Diffusion)
  static async generateImageStability(prompt, options = {}) {
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [
          { text: `Professional marketing visual: ${prompt}`, weight: 1 },
          { text: 'blurry, low quality, text, watermark', weight: -1 }
        ],
        cfg_scale: options.cfg_scale || 7,
        height: options.height || 1024,
        width: options.width || 1024,
        steps: options.steps || 30,
        samples: options.samples || 1
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
        }
      }
    );
    return { base64: response.data.artifacts[0].base64, provider: 'stability-ai' };
  }

  // Midjourney via API (unofficial/third-party proxy)
  static async generateImageMidjourney(prompt, options = {}) {
    const response = await axios.post(
      process.env.MIDJOURNEY_API_URL || 'https://api.midjourneyapi.xyz/v2/imagine',
      {
        prompt: `Professional marketing image: ${prompt} --ar ${options.aspectRatio || '1:1'} --v 6`,
        webhook_url: options.webhookUrl
      },
      {
        headers: { 'Authorization': `Bearer ${process.env.MIDJOURNEY_API_KEY}` }
      }
    );
    return { taskId: response.data.taskId, provider: 'midjourney' };
  }

  // ==================== VIDEO GENERATION ====================

  // Runway ML (Gen-2/Gen-3)
  static async generateVideoRunway(params) {
    const { prompt, imageUrl, duration } = params;
    const response = await axios.post(
      'https://api.runwayml.com/v1/generation',
      {
        model: 'gen-3',
        prompt: prompt,
        init_image: imageUrl || undefined,
        duration: duration || 4,
        ratio: params.ratio || '16:9'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
        }
      }
    );
    return { taskId: response.data.id, provider: 'runway' };
  }

  // Pika Labs Video Generation
  static async generateVideoPika(params) {
    const response = await axios.post(
      'https://api.pika.art/v1/generate',
      {
        prompt: params.prompt,
        style: params.style || 'realistic',
        aspect_ratio: params.ratio || '16:9',
        duration: params.duration || 3
      },
      {
        headers: { 'Authorization': `Bearer ${process.env.PIKA_API_KEY}` }
      }
    );
    return { taskId: response.data.id, provider: 'pika' };
  }

  // HeyGen AI Avatar Video
  static async generateAvatarVideo(params) {
    const { script, avatarId, voiceId, background } = params;
    const response = await axios.post(
      'https://api.heygen.com/v2/video/generate',
      {
        video_inputs: [{
          character: { type: 'avatar', avatar_id: avatarId || 'default_avatar' },
          voice: { type: 'text', voice_id: voiceId || 'en-US-1', input_text: script },
          background: { type: background?.type || 'color', value: background?.value || '#ffffff' }
        }],
        dimension: { width: 1920, height: 1080 }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.HEYGEN_API_KEY
        }
      }
    );
    return { videoId: response.data.data.video_id, provider: 'heygen' };
  }

  // Synthesia AI Video
  static async generateSynthesiaVideo(params) {
    const response = await axios.post(
      'https://api.synthesia.io/v2/videos',
      {
        title: params.title,
        description: params.description,
        visibility: 'private',
        input: [{
          avatarSettings: { avatar: params.avatarId || 'anna_costume1_cameraA' },
          scriptText: params.script,
          background: params.background || 'luxury_lobby'
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.SYNTHESIA_API_KEY
        }
      }
    );
    return { videoId: response.data.id, provider: 'synthesia' };
  }

  // ==================== VOICE / AUDIO ====================

  // ElevenLabs Voice Generation
  static async generateVoice(params) {
    const { text, voiceId, modelId } = params;
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || '21m00Tcm4TlvDq8ikWAM'}`,
      {
        text: text,
        model_id: modelId || 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );
    return { audio: response.data, provider: 'elevenlabs' };
  }

  // ==================== SMART MEDIA ORCHESTRATOR ====================

  // This method intelligently selects the best AI provider based on the request
  static async generateMedia(params) {
    const { type, prompt, platform, options = {} } = params;

    // Platform-specific sizing
    const platformSizes = {
      instagram: { image: '1080x1080', video: '9:16', story: '1080x1920' },
      facebook: { image: '1200x628', video: '16:9', story: '1080x1920' },
      tiktok: { image: '1080x1920', video: '9:16' },
      douyin: { image: '1080x1920', video: '9:16' },
      linkedin: { image: '1200x627', video: '16:9' },
      twitter: { image: '1200x675', video: '16:9' },
      youtube: { image: '1280x720', video: '16:9', thumbnail: '1280x720' },
      wechat: { image: '900x500', video: '16:9' },
      weibo: { image: '1080x1080', video: '16:9' },
      xiaohongshu: { image: '1080x1440', video: '9:16' }
    };

    const sizes = platformSizes[platform] || platformSizes.instagram;

    switch (type) {
      case 'image':
        // Use DALL-E 3 as primary, Stability as fallback
        try {
          return await this.generateImageDALLE(prompt, { size: sizes.image, ...options });
        } catch (err) {
          console.log('DALL-E failed, falling back to Stability AI');
          return await this.generateImageStability(prompt, options);
        }

      case 'video':
        // Use Runway for general videos, HeyGen for talking-head videos
        if (options.avatar || options.talkingHead) {
          return await this.generateAvatarVideo({
            script: prompt,
            avatarId: options.avatarId,
            voiceId: options.voiceId,
            background: options.background
          });
        }
        return await this.generateVideoRunway({
          prompt,
          imageUrl: options.imageUrl,
          duration: options.duration || 4,
          ratio: sizes.video
        });

      case 'avatar-video':
        return await this.generateAvatarVideo({
          script: prompt,
          avatarId: options.avatarId,
          voiceId: options.voiceId
        });

      case 'voice':
        return await this.generateVoice({
          text: prompt,
          voiceId: options.voiceId,
          modelId: options.modelId
        });

      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }
}

module.exports = MediaGenService;
