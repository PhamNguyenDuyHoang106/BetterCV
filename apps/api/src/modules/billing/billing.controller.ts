import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CurrentUser, JwtPayload } from '../../core/decorators';

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

  @Post('payos/webhook')
  async payosWebhook(@Body() body: unknown) {
    return this.billingService.handlePayosWebhook(body);
  }

  /** Fallback when webhook chưa kịp — xác nhận sau khi user quay về successUrl */
  @UseGuards(AuthGuard('jwt'))
  @Post('payos/confirm/:orderCode')
  async confirmPayos(
    @CurrentUser() user: JwtPayload,
    @Param('orderCode', ParseIntPipe) orderCode: number,
  ) {
    return this.billingService.confirmPayment(user.sub, orderCode);
  }
}
