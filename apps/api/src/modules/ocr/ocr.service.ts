import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AiProvider } from '../ai/providers/ai-provider.interface';
import { PrismaService } from '../../database/prisma.service';
import { CvService } from '../cv/cv.service';
import sharp from 'sharp';
import { PDFParse } from 'pdf-parse';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, UnrecoverableError } from 'bullmq';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import { addJobWithTrace } from '../../core/utils/queue.util';

export type OcrJobStatus =
  | 'UPLOADED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'REVIEWING'
  | 'COMPLETED'
  | 'FAILED';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private supabase: SupabaseClient | null = null;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private cvService: CvService,
    private config: ConfigService,
    @Inject('AiProvider') private aiProvider: AiProvider,
    @InjectQueue('ocr-queue') private ocrQueue: Queue,
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

  async createJob(
    supabaseId: string,
    file: any,
    requestId?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Phân loại lỗi hàng đợi: Từ chối ngay lập tức định dạng không hỗ trợ để tránh đẩy vào DB/Queue
    const fileExtension =
      file.originalname?.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
      throw new UnrecoverableError(
        'Unsupported file format. Only PDF, JPG, JPEG, and PNG are allowed.',
      );
    }

    const jobId = crypto.randomUUID();

    // 2. Lưu OCR Job vào database dưới dạng UPLOADED
    await this.prisma.ocrJob.create({
      data: {
        id: jobId,
        userId: user.id,
        filename: file.originalname,
        status: 'UPLOADED',
      },
    });

    this.logger.log(
      `OCR Job ${jobId} initialized in Database for user ${user.id}`,
    );

    // 3. Upload file trực tiếp lên Supabase Storage thay vì lưu cục bộ để hỗ trợ scale ngang
    const storageKey = `ocr-temp/${jobId}.${fileExtension}`;
    if (!this.supabase) {
      throw new Error('Supabase Storage is not configured on this server');
    }

    // Cập nhật status sang QUEUED trước khi đưa vào hàng đợi
    await this.updateJobStatus(jobId, 'QUEUED');

    try {
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucket)
        .upload(storageKey, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          `Failed to upload OCR file to storage: ${uploadError.message}`,
        );
      }
      this.logger.log(
        `Temporary OCR file successfully uploaded to storage: ${storageKey}`,
      );

      // 4. Đẩy storageKey vào BullMQ ocr-queue
      await addJobWithTrace(
        this.ocrQueue,
        'ocr-task',
        {
          jobId,
          storageKey,
          filename: file.originalname,
          mimetype: file.mimetype,
          meta: {
            requestId,
          },
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            count: 100, // Chỉ giữ tối đa 100 jobs hoàn tất gần nhất trong Redis để tối ưu dung lượng
          },
          removeOnFail: {
            count: 500, // Chỉ giữ tối đa 500 jobs thất bại gần nhất
          },
        },
      );
      this.logger.log(`OCR Job ${jobId} pushed to BullMQ ocr-queue`);
    } catch (err: any) {
      this.logger.error(
        `Failed to execute queue submission for job ${jobId}: ${err.message}`,
      );

      // Zombie Job prevention: Chuyển DB sang FAILED và dọn dẹp file tạm trên Cloud nếu đã upload
      await this.updateJobStatus(jobId, 'FAILED', {
        error: `Queue submission failed: ${err.message}`.slice(0, 2000),
      });

      try {
        await this.deleteStorageFile(storageKey);
      } catch (cleanupErr) {
        // Bỏ qua lỗi dọn dẹp phụ trợ
      }
      throw err;
    }

    return this.getJobStatus(jobId);
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = await this.prisma.ocrJob.findUnique({
      where: { id: jobId },
    });
    if (!job) throw new NotFoundException('OCR job not found');
    return job;
  }

  async deleteStorageFile(storageKey: string): Promise<void> {
    if (!this.supabase) return;
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([storageKey]);
    if (error) {
      this.logger.warn(
        `Failed to delete storage file ${storageKey}: ${error.message}`,
      );
    } else {
      this.logger.log(`Storage file ${storageKey} cleaned up successfully`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOrphanStorageFiles() {
    this.logger.log(
      'Starting scheduled sweep of orphaned OCR cloud storage files...',
    );
    if (!this.supabase) return;

    try {
      const { data: files, error } = await this.supabase.storage
        .from(this.bucket)
        .list('ocr-temp');

      if (error) {
        throw new Error(`Failed to list storage files: ${error.message}`);
      }

      if (!files || files.length === 0) {
        this.logger.log('No OCR temporary storage files found.');
        return;
      }

      const now = Date.now();
      const threshold = 24 * 60 * 60 * 1000; // 24 hours
      let count = 0;

      for (const file of files) {
        const fileCreatedAt = file.created_at
          ? new Date(file.created_at).getTime()
          : 0;
        if (fileCreatedAt && now - fileCreatedAt > threshold) {
          // Trích xuất jobId từ tên file (uuid.extension)
          const jobId = file.name.split('.')[0];

          // Tra cứu trạng thái job trong cơ sở dữ liệu
          const job = await this.prisma.ocrJob.findUnique({
            where: { id: jobId },
            select: { status: true },
          });

          // Chỉ xóa nếu job mồ côi (không tìm thấy) HOẶC đã COMPLETED / FAILED
          if (!job || ['COMPLETED', 'FAILED'].includes(job.status)) {
            const storageKey = `ocr-temp/${file.name}`;
            this.logger.warn(
              `Deleting stale orphaned storage file: ${storageKey} (DB Job Status: ${job ? job.status : 'NOT_FOUND'})`,
            );
            await this.deleteStorageFile(storageKey);
            count++;
          } else {
            this.logger.log(
              `Stale file found for job ${jobId} but skipping cloud deletion because DB status is [${job.status}]`,
            );
          }
        }
      }
      this.logger.log(
        `Orphan storage sweeper finished. Cleaned up ${count} file(s).`,
      );
    } catch (err: any) {
      this.logger.error(`Orphan storage sweeper failed: ${err.message}`);
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: OcrJobStatus,
    extra: Record<string, any> = {},
  ) {
    if (extra.error && typeof extra.error === 'string') {
      extra.error = extra.error.slice(0, 2000);
    }
    await this.prisma.ocrJob.update({
      where: { id: jobId },
      data: {
        status,
        ...extra,
      },
    });
    this.logger.log(`OCR Job ${jobId} transitioned to [${status}]`);
  }

  /**
   * Phương thức được gọi bởi BullMQ Processor để thực hiện tải file và xử lý OCR
   */
  async processJob(
    jobId: string,
    storageKey: string,
    filename: string,
    mimetype: string,
  ): Promise<void> {
    await this.updateJobStatus(jobId, 'PROCESSING');

    try {
      if (!this.supabase) {
        throw new Error('Supabase Storage is not configured on this server');
      }

      // Tải file tạm từ Cloud Storage về bộ nhớ đệm (in-memory stateless)
      const { data, error: downloadError } = await this.supabase.storage
        .from(this.bucket)
        .download(storageKey);

      if (downloadError || !data) {
        throw new Error(
          `Failed to download file from storage: ${downloadError?.message || 'No data returned'}`,
        );
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      let extractedData: any;

      // 1. PDF Hybrid Classifier & Parser
      if (mimetype === 'application/pdf') {
        this.logger.log(
          `Job ${jobId}: PDF file received. Extracting text using pdf-parse...`,
        );
        let pdfText = '';
        try {
          const parser = new PDFParse({ data: buffer });
          const pdfData = await parser.getText();
          pdfText = pdfData.text || '';
        } catch (pdfErr) {
          this.logger.error(
            `Job ${jobId}: pdf-parse failed: ${(pdfErr as Error).message}`,
          );
        }

        const cleanText = pdfText.replace(/\s+/g, ' ').trim();

        if (cleanText.length > 150) {
          this.logger.log(
            `Job ${jobId}: Native PDF detected (extracted ${cleanText.length} characters). Performing deterministic parsing...`,
          );
          extractedData = await this.parseTextDeterministically(cleanText);
        } else {
          this.logger.log(
            `Job ${jobId}: Scanned PDF detected (minimal extracted text). Extracting embedded image...`,
          );
          const extractedImage = await this.extractImageFromPdf(buffer);
          extractedData = await this.processVisionOCR(extractedImage);
        }
      } else {
        // It's an image scan, process with Sharp and send to Vision API
        extractedData = await this.processVisionOCR(buffer);
      }

      // 2. Save extracted CV to database
      const job = await this.getJobStatus(jobId);
      const cv = await this.prisma.cv.create({
        data: {
          userId: job.userId,
          title: `Imported - ${filename.replace(/\.[^/.]+$/, '')}`,
          locale: 'vi',
        },
      });

      // Insert sections
      const sectionTypes = [
        'PROFILE',
        'SUMMARY',
        'EXPERIENCE',
        'EDUCATION',
        'SKILLS',
        'PROJECTS',
      ];
      for (const type of sectionTypes) {
        const lowerType = type.toLowerCase();
        const content = extractedData[lowerType] || {};
        await this.prisma.cvSection.create({
          data: {
            cvId: cv.id,
            type: type as any,
            content: content,
            order: sectionTypes.indexOf(type) + 1,
          },
        });
      }

      await this.updateJobStatus(jobId, 'COMPLETED', { extractedCvId: cv.id });
    } catch (err: any) {
      this.logger.error(`Job ${jobId} failed: ${err.message}`);
      await this.updateJobStatus(jobId, 'FAILED', { error: err.message });
      throw err;
    }
  }

  /**
   * Extract embedded JPEGs from scanned PDF files cleanly
   */
  private async extractImageFromPdf(buffer: Buffer): Promise<Buffer> {
    try {
      const soi = Buffer.from([0xff, 0xd8]);
      const eoi = Buffer.from([0xff, 0xd9]);

      let startIdx = buffer.indexOf(soi);
      while (startIdx !== -1) {
        const endIdx = buffer.indexOf(eoi, startIdx + 2);
        if (endIdx !== -1) {
          const candidate = buffer.subarray(startIdx, endIdx + 2);
          try {
            await sharp(candidate).metadata();
            this.logger.log(
              `Successfully extracted embedded JPEG image from scanned PDF!`,
            );
            return candidate;
          } catch {
            startIdx = buffer.indexOf(soi, startIdx + 2);
          }
        } else {
          break;
        }
      }

      this.logger.warn(
        `Could not extract valid DCTDecode image stream from PDF, using original buffer.`,
      );
      return buffer;
    } catch (err) {
      this.logger.warn(
        `Failed to extract image from PDF: ${(err as Error).message}`,
      );
      return buffer;
    }
  }

  /**
   * Sharp Image processing to resize to max 1200px and clean format for cheap, accurate OCR
   */
  private async preprocessImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // limit to max 1200px
        .grayscale() // grayscaling for cleaner profiles
        .jpeg({ quality: 80 }) // compressed high quality JPEG
        .toBuffer();
    } catch (err) {
      this.logger.warn(
        `Sharp processing failed, using original buffer: ${(err as Error).message}`,
      );
      return buffer;
    }
  }

  private async processVisionOCR(buffer: Buffer): Promise<any> {
    const cleanedImage = await this.preprocessImage(buffer);

    const systemPrompt = `You are an expert ATS CV extraction engine.
Analyze the image CV and extract all sections strictly matching this JSON schema:
{
  "profile": { "fullName": "", "title": "", "email": "", "phone": "", "website": "" },
  "summary": { "text": "" },
  "experience": [ { "company": "", "position": "", "startDate": "", "endDate": "", "current": false, "description": "" } ],
  "education": [ { "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "gpa": "" } ],
  "skills": [ { "name": "", "level": "Advanced" } ],
  "projects": [ { "name": "", "description": "", "role": "", "url": "", "technologies": [] } ]
}
CRITICAL ETHICAL RULES:
- Do NOT fabricate or invent numbers, results, or statistics.
- If a section or detail is missing, leave it blank or omit it.
- Return ONLY valid JSON.`;

    const userPrompt =
      'Perform OCR extraction on this resume scan. Make sure to represent bullet points as Markdown inside description fields.';

    const envelope = await this.aiProvider.visionOCR(
      cleanedImage,
      systemPrompt,
      userPrompt,
    );
    return envelope.output;
  }

  private async parseTextDeterministically(text: string): Promise<any> {
    const systemPrompt = `You are a structured CV text extraction assistant.
Extract all details from the raw CV text into this JSON format:
{
  "profile": { "fullName": "", "title": "", "email": "", "phone": "", "website": "" },
  "summary": { "text": "" },
  "experience": [ { "company": "", "position": "", "startDate": "", "endDate": "", "current": false, "description": "" } ],
  "education": [ { "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "gpa": "" } ],
  "skills": [ { "name": "", "level": "Advanced" } ],
  "projects": [ { "name": "", "description": "", "role": "", "url": "", "technologies": [] } ]
}
Return ONLY valid JSON. Never fabricate content.`;

    const envelope = await this.aiProvider.generate(
      {
        system: systemPrompt,
        user: 'Parse this CV text:',
        input: { text },
      },
      0.0,
    );

    return envelope.output;
  }
}
