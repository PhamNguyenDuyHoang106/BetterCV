import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private prisma: PrismaService) {}

  onApplicationBootstrap() {
    // Run cleanup immediately on bootstrap
    this.runCleanup();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runCleanup() {
    this.logger.log(
      'Starting automated cleanup of stale guest accounts and data...',
    );
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find GUEST users created more than 7 days ago
      const staleGuests = await this.prisma.user.findMany({
        where: {
          role: 'GUEST',
          createdAt: { lt: sevenDaysAgo },
        },
        select: { id: true, email: true },
      });

      if (staleGuests.length === 0) {
        this.logger.log('No stale guest accounts found.');
        return;
      }

      this.logger.log(
        `Found ${staleGuests.length} stale guest accounts to purge.`,
      );

      // Prisma cascades will automatically purge CVs, Sections, and snapshots!
      const guestIds = staleGuests.map((g: any) => g.id);

      const { count } = await this.prisma.user.deleteMany({
        where: {
          id: { in: guestIds },
        },
      });

      this.logger.log(
        `Successfully purged ${count} stale guest accounts and all cascaded resume contents.`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to run automated guest cleanup job',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
