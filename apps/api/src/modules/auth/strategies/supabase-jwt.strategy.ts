import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

/**
 * Validates JWTs issued by Supabase Auth.
 *
 * Supabase signs JWTs with the project's JWT secret.
 * The payload contains: sub (user UUID), email, role, aud, etc.
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>("SUPABASE_JWT_SECRET") ??
        "super-secret-jwt-token-with-at-least-32-characters",
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
      email: payload.email ?? "",
      role: payload.role ?? "FREE",
    };
  }
}
