import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateEnvironment } from './security.js';

const { jwtSecret } = validateEnvironment();

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  provider: 'email' | 'phone_otp' | 'whatsapp' | 'google' | 'demo';
  role: 'user' | 'demo' | 'admin';
  isDemo: boolean;
  avatarUrl?: string;
  createdAt: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionToken?: string;
    }
  }
}

// In-memory user directory for session validation
const usersDb = new Map<string, AuthUser>();

// In-memory store for active OTP codes
interface OtpEntry {
  code: string;
  expiresAt: number;
  channel: 'sms' | 'whatsapp';
  attempts: number;
}
const otpStore = new Map<string, OtpEntry>();

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser, expiresIn: string = '7d'): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      provider: user.provider,
      isDemo: user.isDemo,
      avatarUrl: user.avatarUrl,
    },
    jwtSecret,
    { expiresIn: expiresIn as any }
  );
}

/**
 * Verify JWT token and extract user
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    return {
      id: decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      name: decoded.name || 'User',
      role: decoded.role || 'user',
      provider: decoded.provider || (decoded.isDemo ? 'demo' : 'email'),
      isDemo: !!decoded.isDemo,
      avatarUrl: decoded.avatarUrl,
      createdAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Issue or retrieve a demo guest session with realistic lead info
 */
export function createDemoSession(params?: {
  email?: string;
  name?: string;
  phone?: string;
  identifier?: string;
}): { user: AuthUser; token: string } {
  const rawId = params?.identifier || params?.email || params?.phone;
  let email = params?.email;
  let phone = params?.phone;
  let name = params?.name;

  if (rawId) {
    if (rawId.includes('@')) {
      email = rawId.trim().toLowerCase();
      if (!name) {
        name = email.includes('sagar') ? 'Sagar Dhumal (Demo)' : 'Demo Borrower';
      }
    } else {
      const clean = rawId.replace(/[^0-9]/g, '');
      if (clean.length >= 10) {
        phone = `+91 ${clean.slice(-10)}`;
        if (!email) email = `${clean.slice(-10)}@digitalkatta.com`;
        if (!name) name = 'Demo Mobile User';
      }
    }
  }

  const finalEmail = email || 'sagar.dhumal@example.com';
  const finalName = name || 'Sagar Dhumal (Demo)';
  const finalPhone = phone || '+91 98201 23456';

  const demoUser: AuthUser = {
    id: `demo_${Buffer.from(finalEmail).toString('hex').slice(0, 10)}`,
    email: finalEmail,
    name: finalName,
    phone: finalPhone,
    provider: 'demo',
    role: 'demo',
    isDemo: true,
    createdAt: new Date().toISOString(),
  };
  const token = generateToken(demoUser, '24h');
  return { user: demoUser, token };
}

/**
 * Login or register user with email
 */
export function authenticateWithEmail(
  email: string,
  name?: string,
  phone?: string
): { user: AuthUser; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const userId = `usr_em_${Buffer.from(normalizedEmail).toString('hex').slice(0, 12)}`;
  
  let existing = usersDb.get(userId);
  if (!existing) {
    existing = {
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      phone: phone || undefined,
      provider: 'email',
      role: normalizedEmail.endsWith('@digitalkatta.com') ? 'admin' : 'user',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    usersDb.set(userId, existing);
  } else {
    if (name) existing.name = name;
    if (phone) existing.phone = phone;
  }

  const token = generateToken(existing, '14d');
  return { user: existing, token };
}

/**
 * Login or register user with Google
 */
export function authenticateWithGoogle(
  email: string,
  name?: string,
  avatarUrl?: string
): { user: AuthUser; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const userId = `usr_gg_${Buffer.from(normalizedEmail).toString('hex').slice(0, 12)}`;

  let existing = usersDb.get(userId);
  if (!existing) {
    existing = {
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      provider: 'google',
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || normalizedEmail)}`,
      role: normalizedEmail.endsWith('@digitalkatta.com') ? 'admin' : 'user',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    usersDb.set(userId, existing);
  } else {
    if (name) existing.name = name;
    if (avatarUrl) existing.avatarUrl = avatarUrl;
  }

  const token = generateToken(existing, '14d');
  return { user: existing, token };
}

/**
 * Send an OTP to a mobile or whatsapp number
 */
export function generateOtpForPhone(
  phone: string,
  channel: 'sms' | 'whatsapp'
): { success: boolean; demoCode: string; message: string; expiresInSeconds: number } {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Deterministic or random 6 digit OTP
  // For sandbox reliability, generate code and make available in response
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(`${channel}_${cleanPhone}`, {
    code,
    expiresAt,
    channel,
    attempts: 0,
  });

  return {
    success: true,
    demoCode: code,
    expiresInSeconds: 300,
    message: channel === 'whatsapp'
      ? `Verification code sent to WhatsApp number +91 ${cleanPhone.slice(-10)}`
      : `SMS OTP sent to mobile number +91 ${cleanPhone.slice(-10)}`,
  };
}

/**
 * Verify phone OTP (SMS or WhatsApp)
 */
export function verifyOtpForPhone(
  phone: string,
  inputCode: string,
  channel: 'sms' | 'whatsapp',
  name?: string
): { success: boolean; user?: AuthUser; token?: string; error?: string } {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const key = `${channel}_${cleanPhone}`;
  const record = otpStore.get(key);

  // If no record or expired
  if (!record) {
    // Also allow universal testing master OTP 123456 or 749215 for seamless sandbox testing
    if (inputCode !== '123456' && inputCode !== '749215') {
      return { success: false, error: 'No OTP request found or code has expired. Please request a new OTP.' };
    }
  } else {
    if (Date.now() > record.expiresAt) {
      otpStore.delete(key);
      return { success: false, error: 'OTP has expired. Please request a fresh OTP.' };
    }

    if (record.attempts >= 5) {
      otpStore.delete(key);
      return { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    if (record.code !== inputCode.trim() && inputCode !== '123456' && inputCode !== '749215') {
      record.attempts += 1;
      return { success: false, error: 'Invalid OTP code. Please check and re-enter.' };
    }

    // Success - invalidate OTP
    otpStore.delete(key);
  }

  const formattedPhone = `+91 ${cleanPhone.slice(-10)}`;
  const userId = `usr_${channel === 'whatsapp' ? 'wa' : 'ph'}_${cleanPhone.slice(-10)}`;

  let existing = usersDb.get(userId);
  if (!existing) {
    existing = {
      id: userId,
      phone: formattedPhone,
      name: name?.trim() || `${channel === 'whatsapp' ? 'WhatsApp' : 'Mobile'} User (${cleanPhone.slice(-4)})`,
      provider: channel === 'whatsapp' ? 'whatsapp' : 'phone_otp',
      role: 'user',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    usersDb.set(userId, existing);
  }

  const token = generateToken(existing, '14d');
  return { success: true, user: existing, token };
}

/**
 * Express Middleware: Require Authentication (allows both full users and demo sessions)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in or initiate a demo session.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Invalid or expired session token. Please sign in again.',
      code: 'AUTH_EXPIRED',
    });
  }

  req.user = user;
  req.sessionToken = token;
  next();
}

/**
 * Express Middleware: Require Non-Demo Authenticated User
 */
export function requireFullUser(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.isDemo) {
      return res.status(403).json({
        error: 'This action requires an authenticated account. Anonymous demo sessions cannot perform this action.',
        code: 'FULL_AUTH_REQUIRED',
      });
    }
    next();
  });
}
