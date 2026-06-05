import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../database/redis/redis.service';
import { renderHtml } from '@acv/template-engine';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

import { addJobWithTrace } from '../../core/utils/queue.util';

const METRICS_KEY = 'cv:thumbnail:metrics';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;

  constructor(
    @InjectQueue('thumbnail-queue') private thumbnailQueue: Queue,
    @InjectQueue('thumbnail-cleanup-queue') private cleanupQueue: Queue,
    private prisma: PrismaService,
    private config: ConfigService,
    private redisService: RedisService,
  ) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.config.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'cv-exports',
    );

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    // Ensure local storage directory exists
    const storageDir = path.join(process.cwd(), 'storage', 'thumbnails');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
  }

  isRenderable(cv: any): boolean {
    return this.isRenderableCv(cv);
  }

  private isRenderableCv(cv: any): boolean {
    if (!cv.sections || cv.sections.length === 0) return false;

    let nonEmptySectionCount = 0;
    let hasExperience = false;
    let hasEducation = false;

    for (const section of cv.sections) {
      const type = section.type;
      const content = section.content as any;
      if (!content) continue;

      let isEmpty = true;
      if (type === 'PROFILE') {
        if (content.fullName && content.fullName.trim()) {
          isEmpty = false;
        }
      } else if (type === 'SUMMARY') {
        const text = content.text || content.objective || '';
        if (text.trim()) {
          isEmpty = false;
        }
      } else {
        const items =
          content.items || (Array.isArray(content) ? content : null);
        if (items && Array.isArray(items) && items.length > 0) {
          isEmpty = false;
        }
      }

      if (!isEmpty) {
        nonEmptySectionCount++;
        if (type === 'EXPERIENCE') hasExperience = true;
        if (type === 'EDUCATION') hasEducation = true;
      }
    }

    return nonEmptySectionCount >= 3 && (hasExperience || hasEducation);
  }

  async enqueueThumbnailGeneration(
    cvId: string,
    version: number,
    requestId?: string,
  ): Promise<void> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });

    if (!cv) {
      this.logger.warn(`CV ${cvId} not found, skipping enqueuing.`);
      return;
    }

    if (!this.isRenderableCv(cv)) {
      this.logger.log(
        `Skipping enqueuing thumbnail for CV ${cvId}: not renderable yet. Clearing existing preview if any.`,
      );
      await this.enqueueThumbnailCleanup(cvId, requestId);
      return;
    }

    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    const redisEnabled = this.config.get<string>('REDIS_ENABLED') !== 'false';
    if (!redisEnabled || (isDev && process.env.SKIP_THUMBNAIL_QUEUE === 'true')) {
      this.logger.log(
        `Skipping thumbnail queue for CV ${cvId} due to Redis disabled or SKIP_THUMBNAIL_QUEUE=true. Clearing pending/processing status.`,
      );
      try {
        await this.prisma.cv.update({
          where: { id: cvId },
          data: {
            thumbnailStatus: 'READY',
          },
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to reset thumbnail status to READY when queue is skipped: ${err.message}`,
        );
      }
      return;
    }

    this.logger.log(
      `Enqueuing thumbnail generation for CV ${cvId} (Version: ${version}) [requestId: ${requestId || 'none'}]`,
    );

    await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        thumbnailStatus: 'PENDING',
        thumbnailAttemptCount: 0,
        thumbnailLastError: null,
      },
    });

    const debounceMs = this.config.get<number>('THUMBNAIL_DEBOUNCE_MS', 30000);

    await addJobWithTrace(
      this.thumbnailQueue,
      'generate-thumbnail',
      {
        cvId,
        version,
        meta: {
          requestId,
        },
      },
      {
        jobId: cvId, // Deduplication logic: gộp các save trùng lặp
        delay: debounceMs, // Debounce trì hoãn hàng đợi
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    ).catch((err) => {
      this.logger.error(`Failed to add thumbnail job to queue: ${err.message}`);
    });
  }

  async generateThumbnail(
    cvId: string,
    targetVersion?: number,
    attemptsMade = 0,
  ): Promise<void> {
    this.logger.log(`Starting thumbnail generation process for CV: ${cvId}`);
    await this.redisService.hincrby(METRICS_KEY, 'totalJobs', 1);

    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv) {
      await this.redisService.hincrby(METRICS_KEY, 'failedJobs', 1);
      throw new NotFoundException(`CV with ID ${cvId} not found`);
    }

    await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        thumbnailStatus: 'PROCESSING',
        thumbnailAttemptCount: attemptsMade + 1,
      },
    });

    // Race condition prevention: check target version
    if (targetVersion !== undefined && targetVersion < cv.version) {
      this.logger.warn(
        `Skipping thumbnail rendering for CV ${cvId}: job version (${targetVersion}) is older than current database version (${cv.version})`,
      );
      await this.redisService.hincrby(METRICS_KEY, 'skippedJobs', 1);
      return;
    }

    let templateSchema: any = null;

    // Resolve template schema using the same priority as the frontend editor.
    // The frontend uses cv.templateId to find the parent Template.schema.
    if (cv.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: cv.templateId },
      });
      if (template) {
        templateSchema = template.schema;
      }
    }

    // Fallback to templateVersionId only if parent template not found
    if (!templateSchema && cv.templateVersionId) {
      const ver = await this.prisma.templateVersion.findUnique({
        where: { id: cv.templateVersionId },
      });
      if (ver) {
        templateSchema = ver.schema;
      }
    }

    if (!templateSchema) {
      await this.redisService.hincrby(METRICS_KEY, 'failedJobs', 1);
      throw new NotFoundException(`Template not found for CV: ${cvId}`);
    }

    // Assemble CV sections data
    const flattenedData = {
      schemaVersion: 1,
      profile: {},
      summary: {},
      experience: [],
      education: [],
      skills: { items: [] },
      projects: [],
    } as any;

    for (const section of cv.sections) {
      flattenedData[section.type.toLowerCase()] = section.content;
    }
    if (flattenedData.profile) {
      flattenedData.theme = flattenedData.profile.theme;
    }

    const html = renderHtml({
      template: templateSchema || {},
      data: flattenedData,
      locale: cv.locale || 'vi',
    });

    try {
      const startRender = performance.now();
      const webpBuffer = await this.renderScreenshotWebp(html);
      const endRender = performance.now();
      const renderMs = Math.round(endRender - startRender);
      await this.redisService.hset(
        METRICS_KEY,
        'lastRenderMs',
        String(renderMs),
      );

      // Always save locally to keep local cache and support custom endpoint fallback/serving
      const storageDir = path.join(process.cwd(), 'storage', 'thumbnails');
      const filePath = path.join(storageDir, `${cvId}.webp`);
      fs.writeFileSync(filePath, webpBuffer);

      const key = `thumbnails/${cvId}.webp`;
      let url = '';

      if (this.supabase) {
        try {
          const startUpload = performance.now();
          url = await this.uploadToStorage(key, webpBuffer, 'image/webp');
          const endUpload = performance.now();
          const uploadMs = Math.round(endUpload - startUpload);
          await this.redisService.hset(
            METRICS_KEY,
            'lastUploadMs',
            String(uploadMs),
          );
        } catch (uploadErr: any) {
          this.logger.warn(
            `Supabase upload failed for CV ${cvId}, falling back to local serving URL: ${uploadErr.message}`,
          );
        }
      }

      // If Supabase is unconfigured or upload failed, use local endpoint URL
      if (!url) {
        const port = this.config.get<number>('PORT', 4000);
        const apiPublicUrl =
          this.config.get<string>('API_PUBLIC_URL') ||
          `http://localhost:${port}`;
        url = `${apiPublicUrl}/api/cvs/thumbnails/${cvId}.webp`;
      }

      await this.prisma.cv.update({
        where: { id: cvId },
        data: {
          thumbnailUrl: url,
          thumbnailGeneratedAt: new Date(),
          thumbnailStatus: 'READY',
          thumbnailAttemptCount: 0,
          thumbnailLastError: null,
        },
      });

      await this.redisService.hincrby(METRICS_KEY, 'successJobs', 1);
      this.logger.log(
        `Thumbnail successfully generated and updated for CV: ${cvId}`,
      );
    } catch (err: any) {
      const isPermanentError =
        err instanceof NotFoundException || err.message?.includes('not found');
      const maxAttempts = 3;
      const isLastAttempt = attemptsMade + 1 >= maxAttempts || isPermanentError;
      await this.prisma.cv
        .update({
          where: { id: cvId },
          data: {
            thumbnailStatus: isLastAttempt ? 'FAILED' : 'PROCESSING',
            thumbnailLastError: err.message,
          },
        })
        .catch(() => {});
      await this.redisService.hincrby(METRICS_KEY, 'failedJobs', 1);
      throw err;
    }
  }

  async getHealthMetrics() {
    const [waiting, active, failed] = await Promise.all([
      this.thumbnailQueue.getWaitingCount(),
      this.thumbnailQueue.getActiveCount(),
      this.thumbnailQueue.getFailedCount(),
    ]);

    const redisMetrics = await this.redisService.hgetall(METRICS_KEY);

    return {
      queueWaiting: waiting,
      queueActive: active,
      queueFailed: failed,
      totalJobs: parseInt(redisMetrics.totalJobs || '0', 10),
      successJobs: parseInt(redisMetrics.successJobs || '0', 10),
      failedJobs: parseInt(redisMetrics.failedJobs || '0', 10),
      skippedJobs: parseInt(redisMetrics.skippedJobs || '0', 10),
      lastRenderMs: parseInt(redisMetrics.lastRenderMs || '0', 10),
      lastUploadMs: parseInt(redisMetrics.lastUploadMs || '0', 10),
    };
  }

  // ── Puppeteer Browser Pool & Screenshot Helpers ─────────────────────────

  private printCount = 0;
  private browserInstance: any = null;

  private async getBrowser(): Promise<any> {
    if (this.browserInstance) {
      if (this.printCount >= 25) {
        this.logger.log(
          'Recycling Puppeteer browser pool to prevent memory leaks...',
        );
        await this.closeBrowser();
      } else {
        return this.browserInstance;
      }
    }

    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-zygote',
    ];

    try {
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: launchArgs,
      });
    } catch (err: any) {
      this.logger.warn(
        `Failed to launch standard Puppeteer Chrome. Trying system Chrome fallback: ${err.message}`,
      );

      const standardPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Local\\Google\\Chrome\\Application\\chrome.exe',
      ];

      let systemChromePath = null;
      for (const p of standardPaths) {
        if (fs.existsSync(p)) {
          systemChromePath = p;
          break;
        }
      }

      if (systemChromePath) {
        this.browserInstance = await puppeteer.launch({
          headless: true,
          executablePath: systemChromePath,
          args: launchArgs,
        });
      } else {
        throw err;
      }
    }

    this.printCount = 0;
    return this.browserInstance;
  }

  private async closeBrowser() {
    if (this.browserInstance) {
      try {
        await this.browserInstance.close();
      } catch (err) {
        this.logger.error(`Error closing browser: ${(err as Error).message}`);
      }
      this.browserInstance = null;
      this.printCount = 0;
    }
  }

  private async renderScreenshotWebp(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    this.printCount++;
    const page = await browser.newPage();

    // Strict 10s timeout protection to prevent starvation
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(10000);

    try {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      });
      // Set viewport to standard A4 aspect ratio
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      });

      const screenshot = await page.screenshot({
        type: 'webp',
        quality: 80,
        fullPage: false,
      });
      return Buffer.from(screenshot);
    } catch (err: any) {
      this.logger.error(`Puppeteer render screenshot failed: ${err.message}`);
      throw err;
    } finally {
      await page.close();
    }
  }

  private async uploadToStorage(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase Storage is not configured in ThumbnailService');
    }

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, body, { contentType, upsert: true });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw error;
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }

  /**
   * Enqueues a thumbnail cleanup job.
   */
  async enqueueThumbnailCleanup(
    cvId: string,
    requestId?: string,
  ): Promise<void> {
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';
    const redisEnabled = this.config.get<string>('REDIS_ENABLED') !== 'false';
    if (!redisEnabled || (isDev && process.env.SKIP_THUMBNAIL_QUEUE === 'true')) {
      this.logger.log(
        `Skipping thumbnail cleanup queue for CV ${cvId} (Redis disabled or queue skipped). Executing cleanup synchronously.`,
      );
      await this.deleteThumbnail(cvId).catch(() => {});
      return;
    }

    this.logger.log(
      `Enqueuing thumbnail cleanup for CV ${cvId} [requestId: ${requestId || 'none'}]`,
    );
    await addJobWithTrace(
      this.cleanupQueue,
      'cleanup-thumbnail',
      { cvId, meta: { requestId } },
      {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    ).catch((err) => {
      this.logger.error(
        `Failed to add thumbnail cleanup job to queue: ${err.message}`,
      );
    });
  }

  /**
   * Physically deletes the local and remote thumbnail files for a CV.
   */
  async deleteThumbnail(cvId: string): Promise<void> {
    this.logger.log(`Deleting thumbnail assets for CV: ${cvId}`);

    // 1. Delete local file
    try {
      const localPath = path.join(
        process.cwd(),
        'storage',
        'thumbnails',
        `${cvId}.webp`,
      );
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        this.logger.log(`Deleted local thumbnail file for CV: ${cvId}`);
      }
    } catch (err: any) {
      this.logger.error(
        `Failed to delete local thumbnail for CV ${cvId}: ${err.message}`,
      );
    }

    // 2. Delete Supabase Storage file
    if (this.supabase) {
      try {
        const key = `thumbnails/${cvId}.webp`;
        const { error } = await this.supabase.storage
          .from(this.bucket)
          .remove([key]);
        if (error) {
          this.logger.error(
            `Failed to delete Supabase storage thumbnail for CV ${cvId}: ${error.message}`,
          );
        } else {
          this.logger.log(`Deleted Supabase storage thumbnail for CV: ${cvId}`);
        }
      } catch (err: any) {
        this.logger.error(
          `Failed to delete Supabase storage thumbnail for CV ${cvId}: ${err.message}`,
        );
      }
    }

    // 3. Clear fields in the DB
    try {
      await this.prisma.cv.update({
        where: { id: cvId },
        data: {
          thumbnailUrl: null,
          thumbnailGeneratedAt: null,
          thumbnailStatus: 'PENDING',
        },
      });
    } catch (err: any) {
      this.logger.error(
        `Failed to clear DB fields on delete for CV ${cvId}: ${err.message}`,
      );
    }
  }
}
