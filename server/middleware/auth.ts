import { Request, Response, NextFunction } from 'express';
import { verifySessionToken, SessionUser } from '../../src/lib/auth/session';
import { UserRole } from '../../src/models/User';

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser | null;
    }
  }
}

export function extractToken(req: Request): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie parser: req.cookies.indistay_session
  if (req.cookies && req.cookies.indistay_session) {
    return req.cookies.indistay_session;
  }

  // 3. Raw Cookie header fallback
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const match = rawCookie.match(/(?:^|;\s*)indistay_session=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (token) {
      const user = await verifySessionToken(token);
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch {
    req.user = null;
    next();
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please login.' });
    }

    const user = await verifySessionToken(token);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session. Please login again.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Session verification failed' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}
