import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { PrismaService } from "../prisma/prisma.service";
import { CheckoutDto } from "./dto/checkout.dto";

@Injectable()
export class BillingService {
  private stripe?: Stripe;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: "2023-10-16" });
    }
  }

  async createCheckout(userId: string, dto: CheckoutDto) {
    if (!this.stripe) {
      throw new ForbiddenException("Stripe not configured");
    }
    const customerId = await this.getOrCreateCustomer(userId);
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: dto.priceId, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      client_reference_id: userId
    });
    return { url: session.url };
  }

  async createPortal(userId: string) {
    if (!this.stripe) {
      throw new ForbiddenException("Stripe not configured");
    }
    const customerId = await this.getOrCreateCustomer(userId);
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: this.config.get<string>("APP_PUBLIC_URL") ?? ""
    });
    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature?: string) {
    if (!this.stripe) {
      throw new ForbiddenException("Stripe not configured");
    }
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !signature) {
      throw new ForbiddenException("Stripe webhook not configured");
    }
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    if (event.type === "customer.subscription.updated") {
      await this.syncSubscription(event.data.object as Stripe.Subscription);
    }
    if (event.type === "customer.subscription.created") {
      await this.syncSubscription(event.data.object as Stripe.Subscription);
    }
    if (event.type === "customer.subscription.deleted") {
      await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    }
    return { received: true };
  }

  private async getOrCreateCustomer(userId: string) {
    if (!this.stripe) {
      throw new ForbiddenException("Stripe not configured");
    }
    const existing = await this.prisma.stripeCustomer.findUnique({
      where: { userId }
    });
    if (existing) {
      return existing.customerId;
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.fullName
    });
    await this.prisma.stripeCustomer.create({
      data: { userId, customerId: customer.id }
    });
    return customer.id;
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    const stripeId = subscription.id;
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price?.id;
    if (!stripeId || !customerId || !priceId) {
      return;
    }
    const stripeCustomer = await this.prisma.stripeCustomer.findFirst({
      where: { customerId }
    });
    if (!stripeCustomer) {
      return;
    }
    const plan = await this.prisma.plan.findFirst({
      where: { stripePriceId: priceId }
    });
    if (!plan) {
      return;
    }
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: stripeId },
      update: {
        status: subscription.status ?? "unknown",
        planId: plan.id,
        currentPeriodEnd
      },
      create: {
        userId: stripeCustomer.userId,
        planId: plan.id,
        status: subscription.status ?? "unknown",
        currentPeriodEnd,
        stripeSubscriptionId: stripeId,
        stripeCustomerId: customerId
      }
    });
    await this.prisma.user.update({
      where: { id: stripeCustomer.userId },
      data: { role: this.roleFromPlan(plan.tier) }
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const stripeId = subscription.id;
    const record = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeId }
    });
    if (!record) {
      return;
    }
    await this.prisma.subscription.update({
      where: { id: record.id },
      data: { status: "canceled" }
    });
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { role: "FREE" }
    });
  }

  private roleFromPlan(tier: string) {
    if (tier === "PREMIUM") {
      return "PREMIUM";
    }
    if (tier === "PRO") {
      return "PRO";
    }
    return "FREE";
  }
}
