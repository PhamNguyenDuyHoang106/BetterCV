import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser, JwtPayload } from '../../core/decorators';
import { EntitlementService } from '../entitlement/entitlement.service';
import { UsageService } from '../entitlement/usage.service';
import { PolicyService } from '../entitlement/policy.service';
import { Feature, QuotaKey } from '@acv/shared';
import { EntitlementResponseDto } from './dto/entitlement.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private entitlementService: EntitlementService,
    private usageService: UsageService,
    private policyService: PolicyService,
  ) {}

  /**
   * POST /api/auth/sync
   * Called by the frontend after Supabase sign-up/sign-in to ensure
   * the user record exists in our database.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('sync')
  async sync(
    @CurrentUser() user: JwtPayload,
    @Body() body: { fullName?: string },
  ) {
    return this.authService.syncUser(
      user.sub,
      user.email,
      body.fullName ?? user.email.split('@')[0],
      user.avatarUrl || undefined,
    );
  }

  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user);
  }

  /**
   * GET /api/auth/entitlements
   * Returns capabilities, active quotas, rendering configs, and display names.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('entitlements')
  async getEntitlements(@CurrentUser() user: JwtPayload): Promise<EntitlementResponseDto> {
    const dbUser = await this.authService.getProfile(user);
    const userId = dbUser.id;

    const entitlements = await this.entitlementService.getEntitlements(userId);
    const activePlan = await this.usageService.getActivePlan(userId);
    const policyVersion = this.policyService.getPolicyVersion();

    const displayName =
      entitlements.planTier === 'PREMIUM' ? 'Ultra' : entitlements.planName;

    const hasHdExport = entitlements.features.includes(Feature.EXPORT_PDF_HD);

    const quotas: Record<string, any> = {};
    for (const key of Object.values(QuotaKey)) {
      const limit = this.policyService.getPlanQuota(activePlan, key);
      const usage = await this.usageService.getCurrentUsage(userId, key);

      const unlimited = limit === -1;
      const limitVal = unlimited ? null : limit;
      const remaining = unlimited ? null : Math.max(0, limit - usage.used);
      const exhausted = unlimited ? false : usage.used >= limit;

      quotas[key] = {
        limit: limitVal,
        used: usage.used,
        remaining,
        unlimited,
        exhausted,
        lastReset: usage.lastReset || null,
        metadata: usage.metadata || null,
      };
    }

    return {
      policyVersion,
      serverTime: new Date().toISOString(),
      plan: {
        tier: entitlements.planTier,
        displayName,
      },
      rendering: {
        watermark: {
          enabled: !hasHdExport,
          text: 'Created with BetterCV.vn',
        },
      },
      features: entitlements.features,
      quotas,
    };
  }
}
