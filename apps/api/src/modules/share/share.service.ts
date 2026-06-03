import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(private prisma: PrismaService) {}

  async getByToken(token: string) {
    const link = await this.prisma.shareLink.findFirst({
      where: { token, isActive: true },
    });
    if (!link || (link.expiresAt && link.expiresAt < new Date())) {
      return { status: 'inactive' };
    }
    return this.prisma.cv.findUnique({
      where: { id: link.cvId },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
  }

  /**
   * Batch deletes expired share links hourly in batches of 1000.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredShareLinks(): Promise<number> {
    this.logger.log('Starting scheduled cleanup of expired share links...');
    let deletedCount = 0;

    while (true) {
      const expiredLinks = await this.prisma.shareLink.findMany({
        where: { expiresAt: { lt: new Date() } },
        select: { id: true },
        take: 1000,
      });

      if (expiredLinks.length === 0) break;

      const ids = expiredLinks.map((l) => l.id);
      await this.prisma.shareLink.deleteMany({
        where: { id: { in: ids } },
      });

      deletedCount += ids.length;
    }

    if (deletedCount > 0) {
      this.logger.log(`Purged ${deletedCount} expired share links.`);
    }
    return deletedCount;
  }
}
