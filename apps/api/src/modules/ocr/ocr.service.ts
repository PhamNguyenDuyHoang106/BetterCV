import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AiProvider } from '../ai/providers/ai-provider.interface';
import { QueueService } from '../../core/services/queue.service';
import { PrismaService } from '../../database/prisma.service';
import { CvService } from '../cv/cv.service';
import sharp from 'sharp';
import pdfParse = require('pdf-parse');

export type OcrJobStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'reviewing'
  | 'completed'
  | 'failed';

export interface OcrJob {
  id: string;
  userId: string;
  filename: string;
  status: OcrJobStatus;
  extractedCvId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  // In-memory state machine for OCR jobs (can be backed by DB/Redis)
  private jobs: Map<string, OcrJob> = new Map();

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private cvService: CvService,
    @Inject('AiProvider') private aiProvider: AiProvider,
  ) {
    // Start background queue listener for processing queued OCR jobs
    this.startWorker();
  }

  async createJob(supabaseId: string, file: any): Promise<OcrJob> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const jobId = Math.random().toString(36).substring(7);
    const job: OcrJob = {
      id: jobId,
      userId: user.id,
      filename: file.originalname,
      status: 'uploaded',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(`OCR Job ${jobId} initialized for user ${user.id}`);

    // Transition status to queued and push to BullMQ-style QueueService
    this.updateJobStatus(jobId, 'queued');
    await this.queueService.addJob('ocr', 'medium', {
      jobId,
      fileBuffer: file.buffer,
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    return job;
  }

  getJobStatus(jobId: string): OcrJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new NotFoundException('OCR job not found');
    return job;
  }

  private updateJobStatus(
    jobId: string,
    status: OcrJobStatus,
    extra: Partial<OcrJob> = {},
  ) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
      Object.assign(job, extra);
      this.jobs.set(jobId, job);
      this.logger.log(`OCR Job ${jobId} transitioned to [${status}]`);
    }
  }

  // Background worker loop picking up items from Priority Queue
  private async startWorker() {
    setInterval(async () => {
      const activeJob = await this.queueService.getNextJob();
      if (!activeJob || activeJob.type !== 'ocr') return;

      const { jobId, fileBuffer, filename, mimetype } = activeJob.payload;
      this.updateJobStatus(jobId, 'processing');

      try {
        let extractedData: any;
        const buffer = Buffer.from(fileBuffer);

        // 1. PDF Hybrid Classifier & Parser
        if (mimetype === 'application/pdf') {
          this.logger.log(
            `Job ${jobId}: PDF file received. Extracting text using pdf-parse...`,
          );
          let pdfText = '';
          try {
            const pdfData = await (pdfParse as any)(buffer);
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
        const job = this.jobs.get(jobId);
        if (job) {
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

          this.updateJobStatus(jobId, 'completed', { extractedCvId: cv.id });
          await this.queueService.completeJob(activeJob.id);
        }
      } catch (err: any) {
        this.logger.error(`Job ${jobId} failed: ${err.message}`);
        this.updateJobStatus(jobId, 'failed', { error: err.message });
        await this.queueService.failJob(activeJob.id, err.message);
      }
    }, 3000);
  }

  /**
   * Extract DCTDecode embedded JPEGs from scanned PDF files cleanly
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
    // Fallback deterministic extractor using OpenAI text parsing (zero-temperature, robust classification)
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
