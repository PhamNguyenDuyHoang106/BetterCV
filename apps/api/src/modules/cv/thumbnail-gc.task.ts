import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { ThumbnailService } from './thumbnail.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ThumbnailGcTask {
  private readonly logger = new Logger(ThumbnailGcTask.name);

  constructor(
    private prisma: PrismaService,
    private thumbnailService: ThumbnailService,
  ) {}

  /**
   * Reconciliation task running daily at 3:00 AM.
   * Scans CV records in batches to purge orphaned/deleted thumbnails and check filesystem consistency.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async reconcileThumbnails() {
    this.logger.log(
      'Starting daily thumbnail reconciliation cron at 3:00 AM...',
    );

    const deletedThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    let deletedCount = 0;
    let checkedCount = 0;
    const processedIds: string[] = [];

    while (true) {
      const cvs = await this.prisma.cv.findMany({
        where: {
          id: { notIn: processedIds },
          OR: [
            {
              isDeleted: true,
              thumbnailStatus: { not: 'PENDING' },
            },
            {
              isDeleted: false,
              thumbnailStatus: 'READY',
              thumbnailGeneratedAt: { lt: deletedThreshold },
            },
          ],
        },
        select: { id: true, isDeleted: true, thumbnailStatus: true },
        take: 1000,
      });

      if (cvs.length === 0) break;

      for (const cv of cvs) {
        processedIds.push(cv.id);
        if (cv.isDeleted) {
          // Soft-deleted CV: physically purge its thumbnail
          await this.thumbnailService.deleteThumbnail(cv.id);
          deletedCount++;
        } else {
          // Active CV: verify file exists on disk
          checkedCount++;
          const localPath = path.join(
            process.cwd(),
            'storage',
            'thumbnails',
            `${cv.id}.webp`,
          );
          if (!fs.existsSync(localPath)) {
            this.logger.warn(
              `Thumbnail file for active CV ${cv.id} is missing on filesystem. Resetting status to PENDING.`,
            );
            await this.prisma.cv.update({
              where: { id: cv.id },
              data: { thumbnailStatus: 'PENDING', thumbnailUrl: null },
            });
          }
        }
      }

      if (processedIds.length >= 10000) {
        this.logger.log(
          'Reached safety cap of 10,000 processed items, stopping reconciliation.',
        );
        break;
      }
    }

    this.logger.log(
      `Thumbnail reconciliation completed. Purged ${deletedCount} deleted CV thumbnails. Checked ${checkedCount} active CV thumbnails.`,
    );
  }

  /**
   * Reconciles stuck PENDING or PROCESSING CV thumbnails every 5 minutes.
   * Auto-requeues them if they are stuck/lost.
   */
  @Cron('*/5 * * * *')
  async reconcileStuckThumbnails() {
    this.logger.log(
      'Starting periodic thumbnail recovery cron (every 5 minutes)...',
    );

    // Stuck CV: thumbnailStatus is PENDING or PROCESSING, and it has not been updated in the last 2 minutes
    const stuckThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const maxAttempts = 3;

    const stuckCvs = await this.prisma.cv.findMany({
      where: {
        isDeleted: false,
        thumbnailStatus: { in: ['PENDING', 'PROCESSING'] },
        updatedAt: { lt: stuckThreshold },
        thumbnailAttemptCount: { lt: maxAttempts },
      },
      include: {
        sections: true,
      },
    });

    if (stuckCvs.length === 0) {
      this.logger.log('No stuck thumbnails found to recover.');
      return;
    }

    this.logger.log(
      `Found ${stuckCvs.length} stuck CV thumbnails. Processing recovery...`,
    );

    let enqueuedCount = 0;
    for (const cv of stuckCvs) {
      if (this.thumbnailService.isRenderable(cv)) {
        this.logger.log(
          `Requeuing stuck CV thumbnail for CV ${cv.id} (Version: ${cv.version})`,
        );
        await this.thumbnailService.enqueueThumbnailGeneration(
          cv.id,
          cv.version,
        );
        enqueuedCount++;
      }
    }

    this.logger.log(`Requeued ${enqueuedCount} stuck CV thumbnails.`);
  }
}
