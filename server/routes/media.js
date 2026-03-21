const router = require('express').Router();
const { v4: uuid } = require('uuid');
const db = require('../../config/database');
const { authenticateToken } = require('../middleware/auth');
const MediaGenService = require('../services/mediaGenService');

router.use(authenticateToken);

// Generate image
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, platform, provider, options } = req.body;
    let result;

    switch (provider) {
      case 'stability':
        result = await MediaGenService.generateImageStability(prompt, options);
        break;
      case 'midjourney':
        result = await MediaGenService.generateImageMidjourney(prompt, options);
        break;
      case 'dall-e':
      default:
        result = await MediaGenService.generateImageDALLE(prompt, { ...options, platform });
        break;
    }

    // Log the generation
    db.prepare(`INSERT INTO analytics_events (id, business_id, event_type, source, metadata, created_at)
      VALUES (?, ?, 'media_generated', ?, ?, CURRENT_TIMESTAMP)`)
      .run(uuid(), req.user.id, provider || 'dall-e', JSON.stringify({ type: 'image', prompt, platform }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate video
router.post('/generate-video', async (req, res) => {
  try {
    const { prompt, platform, provider, options } = req.body;
    let result;

    switch (provider) {
      case 'pika':
        result = await MediaGenService.generateVideoPika({ prompt, ...options });
        break;
      case 'heygen':
        result = await MediaGenService.generateAvatarVideo({ script: prompt, ...options });
        break;
      case 'synthesia':
        result = await MediaGenService.generateSynthesiaVideo({ script: prompt, title: options?.title, ...options });
        break;
      case 'runway':
      default:
        result = await MediaGenService.generateVideoRunway({ prompt, ...options });
        break;
    }

    db.prepare(`INSERT INTO analytics_events (id, business_id, event_type, source, metadata, created_at)
      VALUES (?, ?, 'media_generated', ?, ?, CURRENT_TIMESTAMP)`)
      .run(uuid(), req.user.id, provider || 'runway', JSON.stringify({ type: 'video', prompt, platform }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate voice/audio
router.post('/generate-voice', async (req, res) => {
  try {
    const { text, voiceId, modelId } = req.body;
    const result = await MediaGenService.generateVoice({ text, voiceId, modelId });
    res.json({ success: true, provider: 'elevenlabs' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Smart generate (auto-selects best provider)
router.post('/smart-generate', async (req, res) => {
  try {
    const result = await MediaGenService.generateMedia(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
