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

    const secretOrKeyProvider = supabaseUrl
      ? passportJwtSecret({
          cache: true,
          rateLimit: true,
          jwksRequestsPerMinute: 5,
          jwksUri: `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`,
        })
      : undefined;

    const secretOrKey = secretOrKeyProvider
      ? undefined
      : (config.get<string>('SUPABASE_JWT_SECRET') ??
        'super-secret-jwt-token-with-at-least-32-characters');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider,
      secretOrKey,
      algorithms: ['HS256', 'ES256'],
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
