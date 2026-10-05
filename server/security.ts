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
 * Sanitize strings, errors, and objects before logging to prevent PAN, Account Number, or PII leakage
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitizeForLogging(obj.message),
      stack: obj.stack ? sanitizeForLogging(obj.stack) : undefined,
    };
  }
  if (typeof obj === 'string') {
    // Mask Indian PAN format: 5 letters, 4 digits, 1 letter
    let sanitized = obj.replace(/[A-Z]{5}[0-9]{4}[A-Z]{1}/gi, (pan) => `${pan.slice(0, 3)}****${pan.slice(-1)}`);
    // Mask Indian Mobile Numbers (10 digits starting with 6-9)
    sanitized = sanitized.replace(/\b[6-9]\d{9}\b/g, (mob) => `${mob.slice(0, 2)}****${mob.slice(-2)}`);
    // Mask raw bank/card account numbers (9 to 18 digits)
    sanitized = sanitized.replace(/\b\d{9,18}\b/g, (acc) => `****${acc.slice(-4)}`);
    return sanitized;
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
        lowerKey.includes('token') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('mobile') ||
        lowerKey.includes('phone')
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
  const rawSecret = process.env.JWT_SECRET?.trim();

  if (isProduction) {
    if (!rawSecret || rawSecret.length < 32) {
      throw new Error(
        'FATAL SECURITY ERROR: JWT_SECRET environment variable is missing or under 32 characters in production. Boot refused. Configure a cryptographically secure JWT_SECRET (>= 32 chars) in environment variables.'
      );
    }
  }

  const fallbackDevSecret = 'digitalkatta-dev-session-secret-key-only-32-chars-long';
  const jwtSecret = rawSecret && rawSecret.length >= 32 ? rawSecret : (rawSecret || fallbackDevSecret);

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

  // Warning in non-production environments when fallback is used
  if (!rawSecret || rawSecret.length < 32) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '[Digital Katta Security Notice] Non-production environment: JWT_SECRET is not configured or is under 32 characters. Using temporary dev secret for local evaluation.'
    );
  }

  return {
    isProduction,
    hasGeminiKey,
    jwtSecret,
  };
}
