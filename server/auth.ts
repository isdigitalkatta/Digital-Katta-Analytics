import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateEnvironment } from './security.js';

const { jwtSecret } = validateEnvironment();

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'demo' | 'admin';
  isDemo: boolean;
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

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser, expiresIn: string = '7d'): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isDemo: user.isDemo,
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
      name: decoded.name || 'User',
      role: decoded.role || 'user',
      isDemo: !!decoded.isDemo,
      createdAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Issue or retrieve a demo guest session
 */
export function createDemoSession(): { user: AuthUser; token: string } {
  const demoUser: AuthUser = {
    id: `demo_${Math.random().toString(36).substring(2, 9)}`,
    email: 'guest@digitalkatta.local',
    name: 'Guest Borrower',
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
export function authenticateWithEmail(email: string, name?: string): { user: AuthUser; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const userId = `usr_${Buffer.from(normalizedEmail).toString('hex').slice(0, 12)}`;
  
  let existing = usersDb.get(userId);
  if (!existing) {
    existing = {
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || normalizedEmail.split('@')[0],
      role: normalizedEmail.endsWith('@digitalkatta.com') ? 'admin' : 'user',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };
    usersDb.set(userId, existing);
  }

  const token = generateToken(existing, '14d');
  return { user: existing, token };
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
