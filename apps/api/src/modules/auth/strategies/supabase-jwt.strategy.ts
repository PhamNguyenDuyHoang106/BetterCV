import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Validates JWTs issued by Supabase Auth.
 *
 * Supabase signs JWTs with the project's JWT secret.
 * The payload contains: sub (user UUID), email, role, aud, etc.
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const supabaseUrl = config.get<string>('SUPABASE_URL');

    let hmacSecret: string | Buffer | undefined = config.get<string>(
      'SUPABASE_JWT_SECRET',
    );
    if (hmacSecret && hmacSecret.length > 40 && hmacSecret.endsWith('=')) {
      try {
        hmacSecret = Buffer.from(hmacSecret, 'base64');
      } catch {}
    }

    const jwksProvider = supabaseUrl
      ? passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`,
        })
      : undefined;

    const dynamicSecretProvider = (
      req: any,
      rawJwtToken: string,
      done: (err: any, secret?: any) => void,
    ) => {
      try {
        const parts = rawJwtToken.split('.');
        if (parts.length > 0) {
          const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
          const header = JSON.parse(headerJson);
          if (header.alg === 'HS256' && hmacSecret) {
            return done(null, hmacSecret);
          }
        }
      } catch (err) {
        // Fallback to JWKS
      }

      if (jwksProvider) {
        return jwksProvider(req, rawJwtToken, done);
      }
      return done(
        null,
        hmacSecret ?? 'super-secret-jwt-token-with-at-least-32-characters',
      );
    };

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: dynamicSecretProvider,
      algorithms: ['HS256', 'ES256', 'RS256'],
    });
  }

  async validate(payload: {
    sub: string;
    email?: string;
    role?: string;
    user_metadata?: { full_name?: string };
  }) {
    return {
      sub: payload.sub,
      email: payload.email ?? '',
      role: payload.role ?? 'FREE',
      fullName:
        payload.user_metadata?.full_name ??
        (payload.email ? payload.email.split('@')[0] : 'User'),
    };
  }
}
