import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../../database/prisma.service";
import { CvCreateDto, CvUpdateDto } from "./dto/cv.dto";
import { CvSectionUpsertDto } from "./dto/section.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CvService {
  constructor(private prisma: PrismaService) {}

  async create(supabaseId: string, dto: CvCreateDto) {
    const userId = await this.resolveUserId(supabaseId);
    return this.prisma.cv.create({
      data: {
        userId,
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId,
      },
    });
  }

  async list(supabaseId: string) {
    const userId = await this.resolveUserId(supabaseId);
    return this.prisma.cv.findMany({
      where: { userId, isDeleted: false },
      include: { sections: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async get(supabaseId: string, id: string) {
    const userId = await this.resolveUserId(supabaseId);
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      include: { sections: { orderBy: { order: "asc" } } },
    });
    if (!cv || cv.userId !== userId || cv.isDeleted) {
      throw new NotFoundException("CV not found");
    }
    return cv;
  }

  async update(supabaseId: string, id: string, dto: CvUpdateDto) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, id);
    const cv = await this.prisma.cv.update({
      where: { id },
      data: {
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId,
      },
    });
    await this.snapshotVersion(id);
    return cv;
  }

  async softDelete(supabaseId: string, id: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, id);
    await this.prisma.cv.update({
      where: { id },
      data: { isDeleted: true },
    });
    return { success: true };
  }

  async upsertSection(supabaseId: string, cvId: string, dto: CvSectionUpsertDto) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    if (dto.id) {
      const section = await this.prisma.cvSection.update({
        where: { id: dto.id },
        data: {
          type: dto.type,
          content: dto.content as Prisma.InputJsonValue,
          order: dto.order,
        },
      });
      await this.snapshotVersion(cvId);
      return section;
    }
    const section = await this.prisma.cvSection.create({
      data: {
        cvId,
        type: dto.type,
        content: dto.content as Prisma.InputJsonValue,
        order: dto.order,
      },
    });
    await this.snapshotVersion(cvId);
    return section;
  }

  async listVersions(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    return this.prisma.cvVersion.findMany({
      where: { cvId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  async createShareLink(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    const token = randomBytes(24).toString("hex");
    return this.prisma.shareLink.create({
      data: { cvId, token },
    });
  }

  // ── Private helpers ─────────────────────────────────────────────

  private async resolveUserId(supabaseId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId },
      select: { id: true },
    });
    if (!user) {
      throw new ForbiddenException("User not found");
    }
    return user.id;
  }

  private async assertOwnership(userId: string, cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true, isDeleted: true },
    });
    if (!cv || cv.userId !== userId || cv.isDeleted) {
      throw new NotFoundException("CV not found");
    }
  }

  private async snapshotVersion(cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv) return;
    await this.prisma.cvVersion.create({
      data: {
        cvId,
        snapshot: {
          title: cv.title,
          locale: cv.locale,
          templateId: cv.templateId,
          sections: cv.sections,
        },
      },
    });
  }
}
