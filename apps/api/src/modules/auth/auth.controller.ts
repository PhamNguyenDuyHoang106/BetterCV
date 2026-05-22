import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser, JwtPayload } from '../../core/decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
