import { Request, Response, NextFunction } from 'express';

// DPDP 2023 & Security Headers Middleware
export function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // XSS protection for older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // DPDP Zero-retention and compliance notice header
  res.setHeader('X-Data-Protection', 'DPDP-Act-2023-Compliant; Zero-Retention-Active');
  
  next();
}

/**
 * Sanitize strings and objects before logging to prevent PAN, Account Number, or PII leakage
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj) return obj;
  if (typeof obj === 'string') {
    // Mask PAN format: 5 letters, 4 digits, 1 letter
    return obj
      .replace(/[A-Z]{5}[0-9]{4}[A-Z]{1}/gi, (pan) => `${pan.slice(0, 3)}****${pan.slice(-1)}`)
      .replace(/\b\d{10,16}\b/g, (acc) => `****${acc.slice(-4)}`);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForLogging);
  }
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('pan') ||
        lowerKey.includes('accountnumber') ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token')
      ) {
        sanitized[key] = '[PROTECTED_PII]';
      } else if (lowerKey === 'report' || lowerKey === 'accounts') {
        sanitized[key] = `[RECORD_COUNT: ${Array.isArray(val) ? val.length : 'OBJECT'}]`;
      } else {
        sanitized[key] = sanitizeForLogging(val);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Validate environment variables at boot
 */
export function validateEnvironment(): {
  isProduction: boolean;
  hasGeminiKey: boolean;
  jwtSecret: string;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const jwtSecret = process.env.JWT_SECRET || 'digitalkatta-development-insecure-secret-key-change-in-prod';

  if (!hasGeminiKey) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[Digital Katta Engine Warning] GEMINI_API_KEY is not set. AI routes will run in resilient deterministic baseline mode.'
    );
  } else {
    console.log(
      '\x1b[32m%s\x1b[0m',
      '[Digital Katta Engine] GEMINI_API_KEY detected. AI enrichment and Gemini models active.'
    );
  }

  if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16)) {
    console.warn(
      '\x1b[31m%s\x1b[0m',
      '[Digital Katta Security Warning] JWT_SECRET is missing or too short in production! Please define a strong JWT_SECRET in environment variables.'
    );
  }

  return {
    isProduction,
    hasGeminiKey,
    jwtSecret,
  };
}
