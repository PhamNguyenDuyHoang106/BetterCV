import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { createHmac } from 'crypto';

/**
 * Verifies HS256 Supabase JWT signatures using pure Node.js core crypto APIs.
 * This guarantees zero external dependencies and avoids circular import issues.
 */
export function verifySupabaseJwt(token: string, secret: string | Buffer): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Decode header & verify HS256 algorithm
    const header = JSON.parse(
      Buffer.from(headerB64, 'base64url').toString('utf8'),
    );
    if (header.alg !== 'HS256') return null;

    // Recreate HMAC signature
    const hmac = createHmac('sha256', secret);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expectedSig = hmac.digest('base64url');

    // Verify signature
    if (expectedSig !== signatureB64) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf8'),
    );

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts JWT token from Request headers, Cookies, or Query string
 */
function extractToken(req: Request): string | null {
  // 1. Authorization Bearer header
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Cookie
  const cookies = req.headers['cookie'];
  if (typeof cookies === 'string') {
    const match = cookies.match(/(?:^|;)\s*token\s*=\s*([^;]+)/);
    if (match) return match[1];
  }

  // 3. Query Parameter
  const tokenQuery = req.query?.token;
  if (typeof tokenQuery === 'string') {
    return tokenQuery;
  }

  return null;
}

/**
 * Verifies standard HTTP Basic Auth credentials
 */
function checkBasicAuth(
  req: Request,
  usernameEnv: string,
  passwordEnv: string,
): boolean {
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.substring(6), 'base64')
      .toString('utf8')
      .split(':');
    if (credentials.length === 2) {
      const [username, password] = credentials;
      return username === usernameEnv && password === passwordEnv;
    }
  }
  return false;
}

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const isProduction = this.config.get<string>('NODE_ENV') === 'production';
    const basicUsername = this.config.get<string>('BULL_BOARD_USERNAME') || '';
    const basicPassword = this.config.get<string>('BULL_BOARD_PASSWORD') || '';

    // Check if basic auth credentials are set
    if (!basicUsername || !basicPassword) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Secured"');
      return res
        .status(401)
        .send('Unauthorized: Bull Board credentials not configured');
    }

    // 1. Production Mode: 2-layer defense (ADMIN JWT + Basic Auth)
    if (isProduction) {
      const token = extractToken(req);
      if (!token) {
        return res
          .status(401)
          .send('Unauthorized: Missing JWT Admin Token for Production');
      }

      // Use HMAC secret (or dynamic secret fallback matching SupabaseJwtStrategy)
      let jwtSecret: string | Buffer =
        this.config.get<string>('SUPABASE_JWT_SECRET') || '';
      if (jwtSecret.length > 40 && jwtSecret.endsWith('=')) {
        try {
          jwtSecret = Buffer.from(jwtSecret, 'base64');
        } catch {}
      }

      const jwtPayload = verifySupabaseJwt(token, jwtSecret);
      if (!jwtPayload) {
        return res.status(401).send('Unauthorized: Invalid JWT Token');
      }

      // Check ADMIN role
      const userRole = jwtPayload.role || 'FREE';
      if (userRole !== 'ADMIN') {
        return res.status(403).send('Forbidden: Administrator access required');
      }

      // Proceed to Basic Auth check as the second layer
      if (!checkBasicAuth(req, basicUsername, basicPassword)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Secured"');
        return res
          .status(401)
          .send('Unauthorized: Invalid Basic Auth credentials');
      }
    } else {
      // 2. Development/Staging Mode: Basic Auth only
      if (!checkBasicAuth(req, basicUsername, basicPassword)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board Secured"');
        return res
          .status(401)
          .send('Unauthorized: Invalid Basic Auth credentials');
      }
    }

    return next();
  }
}
