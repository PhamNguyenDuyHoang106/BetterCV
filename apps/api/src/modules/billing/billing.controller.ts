import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CurrentUser, JwtPayload } from '../../core/decorators';

/**
 * Billing controller.
 *
 * NOTE: The webhook endpoint is NOT protected by JWT — Stripe sends
 * unauthenticated server-to-server calls signed with the webhook secret.
 * Only checkout and portal are JWT-protected.
 */
@Controller('billing')
export class BillingController {
  constructor(private billingService: BillingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  async checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.billingService.createCheckout(user.sub, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('portal')
  async portal(@CurrentUser() user: JwtPayload) {
    return this.billingService.createPortal(user.sub);
  }

  /**
   * Stripe Webhook — NO JWT guard.
   * Stripe authenticates via signature verification.
   */
  @Post('webhook')
  async webhook(
    @Req() req: Request & { body: Buffer },
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    return this.billingService.handleWebhook(req.body, signature);
  }
}
