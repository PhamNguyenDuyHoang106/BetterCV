import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AtsRetentionService {
  private readonly logger = new Logger(AtsRetentionService.name);

  constructor(private prisma: PrismaService) {}

  // Run once a day at 3:00 AM
  @Cron('0 3 * * *')
  async cleanOldJobDescriptions() {
    this.logger.log(
      'Starting ATS Scan Job Description retention and hashing job...',
    );

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Capture the maximum scan ID at the exact start of execution to guarantee Snapshot Traversal Semantics.
    // This blocks new scans created while the Cron sweep is running from shifting our cursor bounds.
    const maxScan = await this.prisma.atsScan.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    const maxIdAtStart = maxScan?.id;

    let archivedCount = 0;
    const batchSize = 500;
    let lastProcessedId: string | undefined = undefined;

    while (true) {
      const cursorId = lastProcessedId;
      // Keyset pagination using cursor-like filter to ensure stable keyset pagination traversal
      const oldScans: Array<{ id: string; jobDescription: string | null }> =
        await this.prisma.atsScan.findMany({
          where: {
            createdAt: { lt: ninetyDaysAgo },
            jobDescription: { not: null },
            id: {
              ...(cursorId ? { gt: cursorId } : {}),
              ...(maxIdAtStart ? { lte: maxIdAtStart } : {}),
            },
          },
          orderBy: { id: 'asc' }, // Stable ordering to avoid index shifts
          select: {
            id: true,
            jobDescription: true,
          },
          take: batchSize,
        });

      if (oldScans.length === 0) {
        break;
      }

      this.logger.log(
        `Processing batch of ${oldScans.length} old ATS scans for archival...`,
      );

      for (const scan of oldScans) {
        if (!scan.jobDescription) continue;

        const hash = crypto
          .createHash('sha256')
          .update(scan.jobDescription)
          .digest('hex');

        await this.prisma.atsScan.update({
          where: { id: scan.id },
          data: {
            jobDescriptionHash: hash,
            jobDescription: null, // Wipe raw text to save DB size
          },
        });

        archivedCount++;
        lastProcessedId = scan.id;
      }
    }

    this.logger.log(
      `ATS Scan retention job finished. Archived ${archivedCount} scans in total.`,
    );
  }
}
