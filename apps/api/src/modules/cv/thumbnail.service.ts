import * as fs from 'fs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../database/redis/redis.service';
import { renderHtml } from '@acv/template-engine';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const METRICS_KEY = 'cv:thumbnail:metrics';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;

  constructor(
    @InjectQueue('thumbnail-queue') private thumbnailQueue: Queue,
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
        `Skipping enqueuing thumbnail for CV ${cvId}: not renderable yet.`,
      );
      return;
    }

    this.logger.log(
      `Enqueuing thumbnail generation for CV ${cvId} (Version: ${version})`,
    );

    const debounceMs = this.config.get<number>('THUMBNAIL_DEBOUNCE_MS', 30000);

    await this.thumbnailQueue
      .add(
        'generate-thumbnail',
        { cvId, version },
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
      )
      .catch((err) => {
        this.logger.error(
          `Failed to add thumbnail job to queue: ${err.message}`,
        );
      });
  }

  async generateThumbnail(cvId: string, targetVersion?: number): Promise<void> {
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

    // Race condition prevention: check target version
    if (targetVersion !== undefined && targetVersion < cv.version) {
      this.logger.warn(
        `Skipping thumbnail rendering for CV ${cvId}: job version (${targetVersion}) is older than current database version (${cv.version})`,
      );
      await this.redisService.hincrby(METRICS_KEY, 'skippedJobs', 1);
      return;
    }

    let templateSchema: any = null;
    if (cv.templateVersionId) {
      const ver = await this.prisma.templateVersion.findUnique({
        where: { id: cv.templateVersionId },
      });
      if (ver) {
        templateSchema = ver.schema;
      }
    }

    if (!templateSchema && cv.templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: cv.templateId },
      });
      if (template) {
        templateSchema = template.schema;
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

      const key = `thumbnails/${cvId}.webp`;

      const startUpload = performance.now();
      const url = await this.uploadToStorage(key, webpBuffer, 'image/webp');
      const endUpload = performance.now();
      const uploadMs = Math.round(endUpload - startUpload);
      await this.redisService.hset(
        METRICS_KEY,
        'lastUploadMs',
        String(uploadMs),
      );

      await this.prisma.cv.update({
        where: { id: cvId },
        data: {
          thumbnailUrl: url,
          thumbnailGeneratedAt: new Date(),
        },
      });

      await this.redisService.hincrby(METRICS_KEY, 'successJobs', 1);
      this.logger.log(
        `Thumbnail successfully generated and updated for CV: ${cvId}`,
      );
    } catch (err: any) {
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
}
