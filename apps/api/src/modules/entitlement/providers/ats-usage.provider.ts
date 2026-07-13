import { Injectable } from '@nestjs/common';
import { QuotaKey } from '@acv/shared';
import { UsageProvider, UsageSnapshot } from '../usage-provider.interface';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AtsScanUsageProvider implements UsageProvider {
  constructor(private readonly prisma: PrismaService) {}

  supports(key: QuotaKey): boolean {
    return key === QuotaKey.MAX_DAILY_ATS;
  }

  async getCurrentUsage(userId: string, key: QuotaKey): Promise<UsageSnapshot> {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const used = await this.prisma.atsScan.count({
      where: {
        cv: { userId },
        createdAt: { gte: startOfToday },
      },
    });

    return {
      used,
      lastReset: startOfToday,
    };
  }
}
