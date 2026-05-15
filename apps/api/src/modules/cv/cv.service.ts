import { ForbiddenException, Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CvCreateDto, CvUpdateDto } from "./dto/cv.dto";
import { CvSectionUpsertDto } from "./dto/section.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CvService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CvCreateDto) {
    return this.prisma.cv.create({
      data: {
        userId,
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId
      }
    });
  }

  async list(userId: string) {
    return this.prisma.cv.findMany({
      where: { userId },
      include: { sections: true }
    });
  }

  async get(userId: string, id: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      include: { sections: true }
    });
    if (!cv || cv.userId !== userId) {
      throw new ForbiddenException();
    }
    return cv;
  }

  async update(userId: string, id: string, dto: CvUpdateDto) {
    await this.assertOwnership(userId, id);
    const cv = await this.prisma.cv.update({
      where: { id },
      data: {
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId
      }
    });
    await this.snapshotVersion(id);
    return cv;
  }

  async upsertSection(userId: string, cvId: string, dto: CvSectionUpsertDto) {
    await this.assertOwnership(userId, cvId);
    if (dto.id) {
      const section = await this.prisma.cvSection.update({
        where: { id: dto.id },
        data: {
          type: dto.type,
          content: dto.content as Prisma.InputJsonValue,
          order: dto.order
        }
      });
      await this.snapshotVersion(cvId);
      return section;
    }
    const section = await this.prisma.cvSection.create({
      data: {
        cvId,
        type: dto.type,
        content: dto.content as Prisma.InputJsonValue,
        order: dto.order
      }
    });
    await this.snapshotVersion(cvId);
    return section;
  }

  async listVersions(userId: string, cvId: string) {
    await this.assertOwnership(userId, cvId);
    return this.prisma.cvVersion.findMany({
      where: { cvId },
      orderBy: { createdAt: "desc" }
    });
  }

  async createShareLink(userId: string, cvId: string) {
    await this.assertOwnership(userId, cvId);
    const token = randomBytes(24).toString("hex");
    return this.prisma.shareLink.create({
      data: { cvId, token }
    });
  }

  private async assertOwnership(userId: string, cvId: string) {
    const cv = await this.prisma.cv.findUnique({ where: { id: cvId } });
    if (!cv || cv.userId !== userId) {
      throw new ForbiddenException();
    }
  }

  private async snapshotVersion(cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true }
    });
    if (!cv) {
      return;
    }
    await this.prisma.cvVersion.create({
      data: {
        cvId,
        snapshot: {
          title: cv.title,
          locale: cv.locale,
          templateId: cv.templateId,
          sections: cv.sections
        }
      }
    });
  }
}
