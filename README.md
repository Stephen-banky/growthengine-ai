# GrowthEngine AI — Marketing Automation & Customer Generation Platform

A full-stack AI-powered marketing automation dashboard that helps businesses generate customers across **15+ platforms** (including Chinese social media) with AI-driven content, video/image generation, lead nurturing, and conversion optimization targeting **80%+ conversion rates**.

## Quick Start

```bash
# 1. Install dependencies
npm run setup

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start the application
npm start
```

The server runs on `http://localhost:5000` and the React client on `http://localhost:3000`.

## Architecture

```
growthengine/
├── server/                    # Express.js Backend
│   ├── index.js               # Server entry point + WebSocket
│   ├── routes/
│   │   ├── auth.js            # Authentication (register/login/JWT)
│   │   ├── campaigns.js       # Campaign CRUD + AI strategy
│   │   ├── leads.js           # Lead management + AI scoring
│   │   ├── content.js         # Content creation + publishing
│   │   ├── analytics.js       # Dashboard stats + funnel + timeline
│   │   ├── platforms.js       # Platform connections
│   │   ├── funnels.js         # Conversion funnels
│   │   ├── automations.js     # Workflow automations
│   │   ├── ai.js              # AI engine endpoints
│   │   └── media.js           # Image/video/voice generation
│   ├── services/
│   │   ├── aiService.js       # OpenAI GPT-4o integration
│   │   ├── platformService.js # Global platform APIs
│   │   ├── mediaGenService.js # DALL-E, Runway, HeyGen, etc.
│   │   └── chinesePlatformService.js  # WeChat, Weibo, Douyin, RED
│   └── middleware/
│       └── auth.js            # JWT authentication
├── client/                    # React Frontend
│   └── src/
│       └── App.jsx            # Full dashboard UI
├── config/
│   └── database.js            # SQLite database schema
└── .env.example               # All API keys template
```

## Platform Integrations (15+)

### Global Platforms
- Facebook / Meta Business Suite (Posts, Ads, Messenger)
- Instagram (Posts, Stories, Reels, Ads)
- X / Twitter (Tweets, Ads, Spaces)
- LinkedIn (Posts, Ads, InMails)
- TikTok (Videos, Ads, Shop)
- YouTube (Videos, Shorts, Ads)
- WhatsApp Business (Messages, Templates, Catalog)
- Email / SMTP (Campaigns, Sequences, Automation)
- Google Ads (Search, Display, Shopping, YouTube)

### Chinese Platforms (中国平台)
- WeChat / 微信 (Official Account, Mini Programs, Moments Ads)
- Weibo / 微博 (Posts, Fan Headlines, Analytics)
- Douyin / 抖音 (Videos, Ocean Engine Ads)
- Xiaohongshu / RED / 小红书 (Notes, KOL Discovery)
- Bilibili / 哔哩哔哩 (Videos)
- Baidu Marketing / 百度推广 (Search Ads)

## AI Media Generation

### Image Generation
- **DALL-E 3** (OpenAI) — Primary, highest quality
- **Stable Diffusion XL** (Stability AI) — Fallback, cost-effective
- **Midjourney** (via API) — Premium creative imagery

### Video Generation
- **Runway Gen-3** — AI video from text/image
- **Pika Labs** — Short-form video generation
- **HeyGen** — AI avatar talking-head videos
- **Synthesia** — Professional AI presenter videos

### Audio/Voice
- **ElevenLabs** — Multilingual AI voice generation

## AI Capabilities

- **Campaign Strategy Generator** — Full strategy with budget allocation
- **Content Generator** — Platform-specific copy with A/B variants
- **Audience Targeting AI** — Smart segmentation for every platform
- **Lead Scoring** — AI-powered lead qualification (0-100)
- **Email Sequence Builder** — Automated nurture sequences
- **Ad Copy Optimizer** — Performance-based ad improvement
- **Conversion Optimization Engine** — Continuous ML-based optimization

## API Keys Required

At minimum, you need:
1. **OpenAI API Key** — For AI content generation and strategy
2. **Platform API keys** — For whichever platforms you want to connect

See `.env.example` for the complete list of supported API keys.
