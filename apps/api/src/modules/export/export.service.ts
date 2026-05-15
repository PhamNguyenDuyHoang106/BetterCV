import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { renderHtml } from "@acv/template-engine";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import puppeteer from "puppeteer";
import { Document, HeadingLevel, Packer, Paragraph } from "docx";

@Injectable()
export class ExportService {
  private s3: S3Client;

  constructor(private prisma: PrismaService, private config: ConfigService) {
    this.s3 = new S3Client({
      region: this.config.get<string>("S3_REGION") ?? "auto",
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY") ?? "",
        secretAccessKey: this.config.get<string>("S3_SECRET_KEY") ?? ""
      },
      forcePathStyle: true
    });
  }

  async exportPdf(userId: string, cvId: string) {
    const { cv, template } = await this.getCvAndTemplate(userId, cvId);
    if (!template) {
      throw new ForbiddenException("Template not found");
    }
    const html = renderHtml({ template: template.schema as any, data: this.flatten(cv) });
    const buffer = await this.renderPdf(html);
    const key = `exports/${cvId}/${Date.now()}.pdf`;
    const url = await this.upload(key, Buffer.from(buffer), "application/pdf");
    return { url };
  }

  async exportDocx(userId: string, cvId: string) {
    const { cv } = await this.getCvAndTemplate(userId, cvId, false);
    const buffer = await this.renderDocx(cv);
    const key = `exports/${cvId}/${Date.now()}.docx`;
    const url = await this.upload(
      key,
      Buffer.from(buffer),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    return { url };
  }

  private flatten(cv: { title: string; sections: Array<{ type: string; content: any }> }) {
    const data: Record<string, unknown> = { title: cv.title };
    for (const section of cv.sections) {
      const key = section.type.toLowerCase();
      data[key] = section.content;
    }
    return data;
  }

  private async getCvAndTemplate(userId: string, cvId: string, requireTemplate = true) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true }
    });
    if (!cv || cv.userId !== userId) {
      throw new ForbiddenException("CV not found");
    }
    if (!cv.templateId) {
      if (requireTemplate) {
        throw new ForbiddenException("Template not selected");
      }
      return { cv, template: null };
    }
    const template = await this.prisma.template.findUnique({
      where: { id: cv.templateId }
    });
    if (!template && requireTemplate) {
      throw new ForbiddenException("Template not found");
    }
    return { cv, template };
  }

  private async renderPdf(html: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      return await page.pdf({ format: "A4", printBackground: true });
    } finally {
      await browser.close();
    }
  }

  private async renderDocx(cv: { title: string; sections: Array<{ type: string; content: any }> }) {
    const children = [
      new Paragraph({
        text: cv.title,
        heading: HeadingLevel.HEADING_1
      })
    ];
    for (const section of cv.sections) {
      children.push(
        new Paragraph({ text: section.type, heading: HeadingLevel.HEADING_2 })
      );
      children.push(
        new Paragraph({
          text:
            typeof section.content === "string"
              ? section.content
              : JSON.stringify(section.content, null, 2)
        })
      );
    }
    const doc = new Document({ sections: [{ children }] });
    return Packer.toBuffer(doc);
  }

  private async upload(key: string, body: Buffer, contentType: string) {
    const bucket = this.config.get<string>("S3_BUCKET");
    if (!bucket) {
      throw new ForbiddenException("S3 not configured");
    }
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType
      })
    );
    const publicBase = this.config.get<string>("S3_PUBLIC_URL");
    if (publicBase) {
      return `${publicBase.replace(/\/$/, "")}/${key}`;
    }
    const signed = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 3600 }
    );
    return signed;
  }
}
