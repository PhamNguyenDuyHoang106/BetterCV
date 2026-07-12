import * as fs from 'fs';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { renderHtml } from '@acv/template-engine';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { CvService } from '../cv/cv.service';
import { resolveTemplateSchemaForCv } from '../template/template-schema.util';
import { EntitlementService } from '../entitlement/entitlement.service';
import { Feature, getTemplateRegistryEntry } from '@acv/shared';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private cvService: CvService,
    private entitlementService: EntitlementService,
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

  async exportPdf(supabaseId: string, cvId: string) {
    const { cv, templateSchema } = await this.getCvAndTemplate(
      supabaseId,
      cvId,
    );
    if (!templateSchema) {
      throw new ForbiddenException('Template not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const registryEntry = getTemplateRegistryEntry(cv.templateId);
    if (registryEntry?.tag === 'Premium') {
      await this.entitlementService.assertFeature(user.id, Feature.PREMIUM_TEMPLATE, {
        cvId,
        templateId: cv.templateId,
      });
    }

    // Force immediate snapshot tagged as export checkpoint
    await this.cvService.snapshotVersion(cvId, true, true);

    const hasHdExport = await this.entitlementService.hasFeature(user.id, Feature.EXPORT_PDF_HD);

    const renderData = {
      ...this.flatten(cv),
      rendering: {
        watermark: {
          enabled: !hasHdExport,
        },
      },
    };

    const html = renderHtml({
      template: templateSchema as any,
      data: renderData,
      locale: cv.locale || 'vi',
    });
    const buffer = await this.renderPdf(html);
    const key = `exports/${cvId}/${Date.now()}.pdf`;
    const url = await this.upload(key, buffer, 'application/pdf');
    return { url };
  }

  async exportDocx(supabaseId: string, cvId: string) {
    const { cv } = await this.getCvAndTemplate(supabaseId, cvId, false);
    const buffer = await this.renderDocx(cv);
    const key = `exports/${cvId}/${Date.now()}.docx`;
    const url = await this.upload(
      key,
      Buffer.from(buffer),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    return { url };
  }

  // ── Private ───────────────────────────────────────────────────

  private flatten(cv: {
    title: string;
    sections: Array<{ type: string; content: any }>;
  }) {
    // Mirror the data assembly used by ThumbnailService and the frontend's
    // assembleLocalResumeData() so that renderHtml produces identical output
    // across Editor, Thumbnail, and PDF Export pipelines.
    const data: Record<string, unknown> = {
      schemaVersion: 1,
      profile: {},
      summary: {},
      experience: [],
      education: [],
      skills: { items: [] },
      projects: [],
    };

    for (const section of cv.sections) {
      data[section.type.toLowerCase()] = section.content;
    }

    // Extract user theme overrides (primaryColor, accentColor) from the
    // PROFILE section so renderHtmlDirect applies them to CSS variables.
    if (data.profile && typeof data.profile === 'object') {
      data.theme = (data.profile as any).theme;
    }

    return data;
  }

  private async getCvAndTemplate(
    supabaseId: string,
    cvId: string,
    requireTemplate = true,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv || cv.userId !== user.id) {
      throw new ForbiddenException('CV not found');
    }

    if (!cv.templateId && !cv.templateVersionId && !cv.templateSnapshot) {
      if (requireTemplate)
        throw new ForbiddenException('Template not selected');
      return { cv, templateSchema: null };
    }

    const templateSchema = await resolveTemplateSchemaForCv(this.prisma, cv);

    if (!templateSchema && requireTemplate) {
      throw new ForbiddenException('Template not found');
    }

    return { cv, templateSchema };
  }

  private printCount = 0;
  private browserInstance: any = null;

  private async getBrowser(): Promise<any> {
    if (this.browserInstance) {
      if (this.printCount >= 25) {
        this.logger.log(
          'Recycling Puppeteer browser pool to prevent memory leaks (25 prints threshold hit)...',
        );
        await this.closeBrowser();
      } else {
        return this.browserInstance;
      }
    }
    this.logger.log(
      'Launching warm, sandboxed Puppeteer browser instance for exports...',
    );

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
        `Failed to launch standard Puppeteer Chrome revision: ${err.message}. Trying system Chrome fallback...`,
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
        this.logger.log(
          `Found system Chrome fallback path: ${systemChromePath}`,
        );
        this.browserInstance = await puppeteer.launch({
          headless: true,
          executablePath: systemChromePath,
          args: launchArgs,
        });
      } else {
        this.logger.error(
          'No system Chrome installation found. PDF rendering might fail.',
        );
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

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    this.printCount++;
    const page = await browser.newPage();

    // Đặt timeout mặc định 15 giây để tránh treo vô hạn
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);

    try {
      // Match the viewport dimensions used by ThumbnailService and the
      // editor iframe (794×1123 = standard A4 at 96dpi).
      await page.setViewport({ width: 794, height: 1123 });

      await page.setContent(html, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      // Wait for web fonts to finish loading before printing
      await page
        .evaluate('document.fonts ? document.fonts.ready : Promise.resolve()')
        .catch(() => {});

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        // The template HTML already has 40px body padding, so we set
        // Puppeteer margins to 0 to avoid double-padding that squeezes
        // the content into a narrow column.
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        timeout: 15000,
      });
      return Buffer.from(pdf);
    } catch (err: any) {
      this.logger.error(
        `Puppeteer render PDF failed or timed out: ${err.message}`,
      );
      throw err;
    } finally {
      await page.close();
    }
  }

  private async renderDocx(cv: {
    title: string;
    sections: Array<{ type: string; content: any }>;
  }) {
    const children = [
      new Paragraph({ text: cv.title, heading: HeadingLevel.HEADING_1 }),
    ];
    for (const section of cv.sections) {
      children.push(
        new Paragraph({ text: section.type, heading: HeadingLevel.HEADING_2 }),
      );
      children.push(
        new Paragraph({
          text:
            typeof section.content === 'string'
              ? section.content
              : JSON.stringify(section.content, null, 2),
        }),
      );
    }
    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }

  async uploadAvatar(supabaseId: string, file: any) {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new ForbiddenException('User not found');

    const fileExtension = file.originalname?.split('.').pop() || 'jpg';
    const key = `avatars/${user.id}/${Date.now()}.${fileExtension}`;
    const url = await this.upload(key, file.buffer, file.mimetype);
    return { url };
  }

  private async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.supabase) {
      throw new ForbiddenException('Storage not configured');
    }

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, body, { contentType, upsert: true });

    if (error) {
      this.logger.error(`Storage upload failed: ${error.message}`);
      throw new ForbiddenException('Upload failed');
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
    return data.publicUrl;
  }
}
