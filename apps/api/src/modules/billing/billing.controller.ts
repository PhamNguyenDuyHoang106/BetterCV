import { Body, Controller, Headers, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { BillingService } from "./billing.service";
import { CheckoutDto } from "./dto/checkout.dto";

@UseGuards(AuthGuard("jwt"))
@Controller("billing")
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post("checkout")
  async checkout(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: CheckoutDto
  ) {
    return this.billingService.createCheckout(req.user.sub, dto);
  }

  @Post("portal")
  async portal(@Req() req: Request & { user: { sub: string } }) {
    return this.billingService.createPortal(req.user.sub);
  }

  @Post("webhook")
  async webhook(
    @Req() req: Request & { body: Buffer },
    @Headers("stripe-signature") signature: string | undefined
  ) {
    return this.billingService.handleWebhook(req.body, signature);
  }
}
