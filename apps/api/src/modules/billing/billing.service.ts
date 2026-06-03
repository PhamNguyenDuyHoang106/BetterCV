import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { PrismaService } from '../../database/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

type PayosTier = 'PRO' | 'PREMIUM';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private payos?: PayOS;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const clientId = this.config.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.config.get<string>('PAYOS_API_KEY');
    const checksumKey = this.config.get<string>('PAYOS_CHECKSUM_KEY');
    if (clientId && apiKey && checksumKey) {
      this.payos = new PayOS({ clientId, apiKey, checksumKey });
    }
  }

  async createCheckout(supabaseId: string, dto: CheckoutDto) {
    if (!this.payos) {
      throw new ForbiddenException(
        'PayOS chưa cấu hình. Thiếu PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      include: {
        subscriptions: {
          include: { plan: true },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('Không tìm thấy thông tin người dùng.');
    }

    const userId = user.id;
    const tier: PayosTier = dto.tier === 'PREMIUM' ? 'PREMIUM' : 'PRO';

    // Validate subscription logic based on current user role and subscriptions
    if (tier === 'PRO') {
      if (user.role === 'PREMIUM') {
        throw new BadRequestException(
          'Bạn đang sử dụng gói PREMIUM, không cần mua gói PRO.',
        );
      }

      // Check if there is an active PRO subscription
      const activeProSub = user.subscriptions.find(
        (sub) =>
          sub.plan.tier === 'PRO' &&
          ['active', 'trialing'].includes(sub.status) &&
          (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()),
      );

      if (activeProSub) {
        throw new BadRequestException(
          'Bạn đang có gói PRO đang hoạt động, không thể đăng ký thêm.',
        );
      }
    } else if (tier === 'PREMIUM') {
      if (user.role === 'PREMIUM') {
        throw new BadRequestException(
          'Bạn đã sở hữu gói PREMIUM, không thể mua lại.',
        );
      }
    }

    const mode = dto.mode ?? (tier === 'PREMIUM' ? 'payment' : 'subscription');
    const amount = this.resolveAmount(tier);
    if (!amount || amount < 1000) {
      throw new ForbiddenException(
        'Số tiền PayOS không hợp lệ. Cấu hình PAYOS_PRICE_PRO / PAYOS_PRICE_PREMIUM (VND).',
      );
    }

    const orderCode =
      Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

    const txn = await this.prisma.payosTransaction.create({
      data: {
        userId,
        orderCode,
        tier,
        mode,
        amount,
        status: 'PENDING',
      },
    });

    const description = `BCV ${tier} ${txn.orderCode}`.slice(0, 25);
    const successUrl = this.appendOrderCode(dto.successUrl, txn.orderCode);

    try {
      const link = await this.payos.paymentRequests.create({
        orderCode: txn.orderCode,
        amount,
        description,
        returnUrl: successUrl,
        cancelUrl: dto.cancelUrl,
      });

      return {
        url: link.checkoutUrl,
        checkoutUrl: link.checkoutUrl,
        qrCode: link.qrCode,
        orderCode: link.orderCode,
      };
    } catch (err) {
      await this.prisma.payosTransaction.update({
        where: { orderCode: txn.orderCode },
        data: { status: 'failed' },
      });
      this.logger.error('PayOS create payment link failed', err);
      throw new BadRequestException(
        'Không tạo được link thanh toán PayOS. Kiểm tra orderCode/amount hoặc thử lại.',
      );
    }
  }

  async createPortal(_supabaseId: string) {
    throw new ForbiddenException(
      'Quản lý gói qua PayOS — không có billing portal. Liên hệ hỗ trợ nếu cần hủy gói.',
    );
  }

  async handlePayosWebhook(body: unknown) {
    if (!this.payos) {
      throw new ForbiddenException('PayOS chưa cấu hình');
    }

    const webhook = body as {
      code?: string;
      desc?: string;
      success?: boolean;
      data?: { orderCode?: number };
      signature?: string;
    };

    if (!webhook?.data?.orderCode || !webhook.signature) {
      throw new BadRequestException('Webhook PayOS không hợp lệ');
    }

    const verified = await this.payos.webhooks.verify(
      webhook as Parameters<PayOS['webhooks']['verify']>[0],
    );

    if (webhook.code !== '00' || webhook.success !== true) {
      this.logger.warn(
        `PayOS webhook ignored: code=${webhook.code} success=${webhook.success}`,
      );
      return { received: true };
    }

    await this.fulfillOrder(verified.orderCode, verified.amount);
    return { received: true };
  }

  async confirmPayment(supabaseId: string, orderCode: number) {
    if (!this.payos) {
      throw new ForbiddenException('PayOS chưa cấu hình');
    }
    const userId = await this.resolveUserId(supabaseId);
    const txn = await this.prisma.payosTransaction.findUnique({
      where: { orderCode },
    });
    if (!txn || txn.userId !== userId) {
      throw new ForbiddenException('Không tìm thấy đơn thanh toán');
    }
    if (txn.status === 'paid') {
      return { status: 'paid', role: await this.getUserRole(userId) };
    }

    const link = await this.payos.paymentRequests.get(orderCode);
    if (link.status !== 'PAID') {
      return {
        status: link.status.toLowerCase(),
        role: await this.getUserRole(userId),
      };
    }

    await this.fulfillOrder(orderCode, txn.amount);
    return { status: 'paid', role: await this.getUserRole(userId) };
  }

  private async fulfillOrder(orderCode: number, paidAmount: number) {
    const txn = await this.prisma.payosTransaction.findUnique({
      where: { orderCode },
    });
    if (!txn) {
      this.logger.warn(`PayosTransaction not found: ${orderCode}`);
      return;
    }
    if (txn.status === 'paid') return;

    if (paidAmount < txn.amount) {
      this.logger.warn(
        `Underpaid order ${orderCode}: expected ${txn.amount}, got ${paidAmount}`,
      );
      return;
    }

    const role = this.roleFromTier(txn.tier);
    await this.prisma.$transaction(async (tx) => {
      await tx.payosTransaction.update({
        where: { orderCode },
        data: { status: 'paid' },
      });

      await tx.user.update({
        where: { id: txn.userId },
        data: { role },
      });

      await tx.invoice.create({
        data: {
          userId: txn.userId,
          amount: txn.amount,
          currency: 'vnd',
          status: 'paid',
        },
      });

      if (txn.mode === 'subscription' && txn.tier === 'PRO') {
        const plan = await tx.plan.findUnique({ where: { tier: 'PRO' } });
        if (plan) {
          const currentPeriodEnd = new Date();
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          await tx.subscription.create({
            data: {
              userId: txn.userId,
              planId: plan.id,
              status: 'active',
              currentPeriodEnd,
            },
          });
        }
      }

      if (role === 'PREMIUM') {
        await tx.subscription.updateMany({
          where: {
            userId: txn.userId,
            status: { in: ['active', 'trialing'] },
          },
          data: {
            status: 'cancelled',
          },
        });
      }
    });

    this.logger.log(
      `User ${txn.userId} upgraded to ${role} via PayOS order ${orderCode}`,
    );
  }

  private resolveAmount(tier: PayosTier): number {
    const pro = Number(
      this.config.get<string>('PAYOS_PRICE_PRO') ??
        this.config.get<string>('PAYOS_AMOUNT_PRO') ??
        0,
    );
    const premium = Number(
      this.config.get<string>('PAYOS_PRICE_PREMIUM') ??
        this.config.get<string>('PAYOS_AMOUNT_PREMIUM') ??
        0,
    );
    return tier === 'PREMIUM' ? premium : pro;
  }

  private appendOrderCode(url: string, orderCode: number) {
    try {
      const u = new URL(url);
      u.searchParams.set('orderCode', String(orderCode));
      return u.toString();
    } catch {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}orderCode=${orderCode}`;
    }
  }

  private async resolveUserId(supabaseId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    return user.id;
  }

  private async getUserRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role ?? 'FREE';
  }

  private roleFromTier(tier: string) {
    if (tier === 'PREMIUM') return 'PREMIUM' as const;
    if (tier === 'PRO') return 'PRO' as const;
    return 'FREE' as const;
  }
}
