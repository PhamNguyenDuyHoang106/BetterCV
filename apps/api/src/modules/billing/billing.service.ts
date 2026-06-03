import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe?: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      this.stripe = new Stripe(key, { apiVersion: '2023-10-16' });
    }
  }

  async createCheckout(supabaseId: string, dto: CheckoutDto) {
    if (!this.stripe) throw new ForbiddenException('Stripe not configured');
    const userId = await this.resolveUserId(supabaseId);
    const customerId = await this.getOrCreateCustomer(userId);

    const mode =
      dto.mode ?? (dto.tier === 'PREMIUM' ? 'payment' : 'subscription');
    const priceId = dto.priceId ?? this.resolvePriceId(dto.tier, mode);
    if (!priceId) {
      throw new ForbiddenException(
        'Stripe price not configured. Set STRIPE_PRICE_PRO / STRIPE_PRICE_PREMIUM in env.',
      );
    }

    const session = await this.stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      client_reference_id: userId,
      metadata: {
        tier: dto.tier ?? 'PRO',
        mode,
      },
    });
    return { url: session.url };
  }

  async createPortal(supabaseId: string) {
    if (!this.stripe) throw new ForbiddenException('Stripe not configured');
    const userId = await this.resolveUserId(supabaseId);
    const customerId = await this.getOrCreateCustomer(userId);
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: this.config.get<string>('APP_PUBLIC_URL') ?? '',
    });
    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature?: string) {
    if (!this.stripe) throw new ForbiddenException('Stripe not configured');
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret || !signature) {
      throw new ForbiddenException('Stripe webhook not configured');
    }

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ── Private ───────────────────────────────────────────────────

  private resolvePriceId(
    tier: CheckoutDto['tier'] | undefined,
    _mode: 'subscription' | 'payment',
  ) {
    // Back-compat with existing env names
    const pro =
      this.config.get<string>('STRIPE_PRICE_PRO_MONTHLY') ??
      this.config.get<string>('STRIPE_PRICE_PRO');
    const premium =
      this.config.get<string>('STRIPE_PRICE_ANNUAL_ONCE') ??
      this.config.get<string>('STRIPE_PRICE_PREMIUM');

    if (tier === 'PREMIUM') return premium;
    // default PRO
    return pro;
  }

  private async resolveUserId(supabaseId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    return user.id;
  }

  private async getOrCreateCustomer(userId: string) {
    if (!this.stripe) throw new ForbiddenException('Stripe not configured');
    const existing = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });
    if (existing) return existing.customerId;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.fullName,
    });
    await this.prisma.stripeCustomer.create({
      data: { userId, customerId: customer.id },
    });
    return customer.id;
  }

  private async syncSubscription(subscription: Stripe.Subscription) {
    const stripeId = subscription.id;
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price?.id;
    if (!stripeId || !customerId || !priceId) return;

    const stripeCustomer = await this.prisma.stripeCustomer.findFirst({
      where: { customerId },
    });
    if (!stripeCustomer) return;

    const plan = await this.prisma.plan.findFirst({
      where: { stripePriceId: priceId },
    });
    if (!plan) return;

    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;

    await this.prisma.subscription.upsert({
      where: { stripeSubscriptionId: stripeId },
      update: {
        status: subscription.status ?? 'unknown',
        planId: plan.id,
        currentPeriodEnd,
      },
      create: {
        userId: stripeCustomer.userId,
        planId: plan.id,
        status: subscription.status ?? 'unknown',
        currentPeriodEnd,
        stripeSubscriptionId: stripeId,
        stripeCustomerId: customerId,
      },
    });

    await this.prisma.user.update({
      where: { id: stripeCustomer.userId },
      data: { role: this.roleFromPlan(plan.tier) },
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const record = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });
    if (!record) return;

    await this.prisma.subscription.update({
      where: { id: record.id },
      data: { status: 'canceled' },
    });
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { role: 'FREE' },
    });
  }

  private roleFromPlan(tier: string) {
    if (tier === 'PREMIUM') return 'PREMIUM';
    if (tier === 'PRO') return 'PRO';
    return 'FREE';
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    // Only handle one-time payments here. Subscriptions are handled by subscription.* events.
    if (session.mode !== 'payment') return;
    const userId = session.client_reference_id;
    if (!userId) return;

    const tierRaw = session.metadata?.tier;
    const tier = tierRaw === 'PREMIUM' ? 'PREMIUM' : 'PRO';

    // Mark user role immediately; you can refine this to time-bound access later.
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: this.roleFromPlan(tier) },
    });

    // Best-effort invoice record for analytics
    const amount =
      typeof session.amount_total === 'number' ? session.amount_total : null;
    const currency =
      typeof session.currency === 'string' ? session.currency : 'usd';
    const status = session.payment_status ?? 'paid';
    if (amount !== null) {
      await this.prisma.invoice.create({
        data: {
          userId,
          amount,
          currency,
          status,
        },
      });
    }
  }
}
