import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

// Key generator based on user ID if authenticated, fallback to normalized IP
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  if (userId) {
    return String(userId);
  }
  return ipKeyGenerator(req.ip || '127.0.0.1');
};

/**
 * Standard API rate limiter
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this client. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * AI Analysis Limiter: heavy computing endpoint
 */
export const aiAnalyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const user = (req as any).user;
    if (user && !user.isDemo) return 20; // 20 analyses per 15 min for registered users
    return 6; // 6 analyses per 15 min for demo/anonymous
  },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI analysis quota reached for this session. Please wait before analyzing another report.',
    code: 'AI_ANALYSIS_QUOTA_EXCEEDED',
  },
});

/**
 * AI Chat Limiter
 */
export const aiChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => {
    const user = (req as any).user;
    if (user && !user.isDemo) return 60; // 60 messages for registered users
    return 20; // 20 messages for demo
  },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI chat query rate limit reached. Please wait a few minutes before asking more questions.',
    code: 'AI_CHAT_QUOTA_EXCEEDED',
  },
});

/**
 * AI Letter Generation Limiter
 */
export const aiLetterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => {
    const user = (req as any).user;
    if (user && !user.isDemo) return 30; // 30 letters per 15 min
    return 10; // 10 letters for demo
  },
  keyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Letter generation quota reached. Please wait before generating additional formal grievance drafts.',
    code: 'AI_LETTER_QUOTA_EXCEEDED',
  },
});
