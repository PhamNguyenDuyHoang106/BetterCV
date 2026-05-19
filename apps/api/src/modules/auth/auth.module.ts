import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserModule } from "../user/user.module";
import { SupabaseJwtStrategy } from "./strategies/supabase-jwt.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("SUPABASE_JWT_SECRET") ?? "super-secret-jwt-token-with-at-least-32-characters",
        signOptions: {
          expiresIn: config.get<string>("JWT_ACCESS_TTL", "1h"),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
