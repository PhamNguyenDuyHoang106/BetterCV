import { Injectable } from '@nestjs/common';
import { QuotaKey } from '@acv/shared';
import { UsageProvider, UsageSnapshot } from '../usage-provider.interface';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CvUsageProvider implements UsageProvider {
  constructor(private readonly prisma: PrismaService) {}

  supports(key: QuotaKey): boolean {
    return key === QuotaKey.MAX_CV;
  }

  async getCurrentUsage(userId: string, key: QuotaKey): Promise<UsageSnapshot> {
    const used = await this.prisma.cv.count({
      where: { userId, isDeleted: false },
    });
    return { used };
  }
}
