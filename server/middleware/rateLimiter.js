const { RateLimiterMemory } = require('rate-limiter-flexible');

// General API rate limiter: 100 requests per minute per IP
const generalLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60, // per 60 seconds
});

// Auth rate limiter: 10 attempts per 15 minutes per IP (brute force protection)
const authLimiter = new RateLimiterMemory({
  points: 10,
  duration: 900, // per 15 minutes
});

// AI generation rate limiter: 20 requests per minute per IP (expensive API calls)
const aiLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

function rateLimitMiddleware(limiter) {
  return async (req, res, next) => {
    try {
      const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 60;
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter
      });
    }
  };
}

module.exports = {
  generalRateLimit: rateLimitMiddleware(generalLimiter),
  authRateLimit: rateLimitMiddleware(authLimiter),
  aiRateLimit: rateLimitMiddleware(aiLimiter)
};
