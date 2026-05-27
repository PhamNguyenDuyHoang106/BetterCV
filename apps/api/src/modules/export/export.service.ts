import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { renderHtml } from '@acv/template-engine';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { Document, HeadingLevel, Packer, Paragraph } from 'docx';
import { CvService } from '../cv/cv.service';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private cvService: CvService,
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
    const { cv, template } = await this.getCvAndTemplate(supabaseId, cvId);
    if (!template) {
      throw new ForbiddenException('Template not found');
    }

    // Force immediate snapshot tagged as export checkpoint
    await this.cvService.snapshotVersion(cvId, true, true);

    const html = renderHtml({
      template: template.schema as any,
      data: this.flatten(cv),
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
    const data: Record<string, unknown> = { title: cv.title };
    for (const section of cv.sections) {
      data[section.type.toLowerCase()] = section.content;
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

    if (!cv.templateId) {
      if (requireTemplate)
        throw new ForbiddenException('Template not selected');
      return { cv, template: null };
    }

    const template = await this.prisma.template.findUnique({
      where: { id: cv.templateId },
    });
    if (!template && requireTemplate) {
      throw new ForbiddenException('Template not found');
    }
    return { cv, template };
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
    this.browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });
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
    try {
      await page.setContent(html, { waitUntil: 'networkidle0' as any });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdf);
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
