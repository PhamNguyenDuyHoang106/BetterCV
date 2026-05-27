import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CvCreateDto, CvUpdateDto } from './dto/cv.dto';
import { CvSectionUpsertDto } from './dto/section.dto';
import { Prisma } from '@prisma/client';
import { migrateCvData } from './migrations';

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
      include: { sections: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(supabaseId: string, id: string) {
    const userId = await this.resolveUserId(supabaseId);
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      include: { sections: { orderBy: { order: 'asc' } } },
    });
    if (!cv || cv.userId !== userId || cv.isDeleted) {
      throw new NotFoundException('CV not found');
    }

    // Run the on-read migration pipeline
    const assembled = this.assembleResumeData(cv);
    const { migrated, data: migratedData } = migrateCvData(assembled);

    if (migrated) {
      await this.persistMigratedData(cv.id, migratedData);
      // Reload CV with updated sections
      const updatedCv = await this.prisma.cv.findUnique({
        where: { id },
        include: { sections: { orderBy: { order: 'asc' } } },
      });
      if (updatedCv) return updatedCv;
    }

    return cv;
  }

  async update(
    supabaseId: string,
    id: string,
    dto: CvUpdateDto,
    clientSession?: { sessionId?: string; device?: string },
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, id);

    const existing = await this.prisma.cv.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('CV not found');

    if (
      dto.version !== undefined &&
      existing.version !== dto.version &&
      (!clientSession?.sessionId ||
        clientSession.sessionId !== existing.lastEditedSessionId)
    ) {
      throw new ConflictException({
        message:
          'Xung đột dữ liệu: CV này đã được chỉnh sửa trên thiết bị khác.',
        latestVersion: existing.version,
        lastEditedAt: existing.lastEditedAt,
        lastEditedDevice: existing.lastEditedDevice,
      });
    }

    const cv = await this.prisma.cv.update({
      where: { id },
      data: {
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId,
        version: { increment: 1 },
        lastEditedSessionId: clientSession?.sessionId || null,
        lastEditedDevice: clientSession?.device || null,
        lastEditedAt: new Date(),
      },
    });
    await this.snapshotVersion(id, true);
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

  async upsertSection(
    supabaseId: string,
    cvId: string,
    dto: CvSectionUpsertDto,
    clientSession?: { sessionId?: string; device?: string },
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);

    const existingCv = await this.prisma.cv.findUnique({ where: { id: cvId } });
    if (!existingCv) throw new NotFoundException('CV not found');

    if (
      dto.version !== undefined &&
      existingCv.version !== dto.version &&
      (!clientSession?.sessionId ||
        clientSession.sessionId !== existingCv.lastEditedSessionId)
    ) {
      throw new ConflictException({
        message:
          'Xung đột dữ liệu: CV này đã được chỉnh sửa ở tab hoặc thiết bị khác.',
        latestVersion: existingCv.version,
        lastEditedAt: existingCv.lastEditedAt,
        lastEditedDevice: existingCv.lastEditedDevice,
      });
    }

    let section;
    if (dto.id && !dto.id.startsWith('temp_')) {
      section = await this.prisma.cvSection.update({
        where: { id: dto.id },
        data: {
          type: dto.type,
          content: dto.content as Prisma.InputJsonValue,
          order: dto.order,
        },
      });
    } else {
      section = await this.prisma.cvSection.create({
        data: {
          cvId,
          type: dto.type,
          content: dto.content as Prisma.InputJsonValue,
          order: dto.order,
        },
      });
    }

    // Increment document version and update edit attributions
    await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        version: { increment: 1 },
        lastEditedSessionId: clientSession?.sessionId || null,
        lastEditedDevice: clientSession?.device || null,
        lastEditedAt: new Date(),
      },
    });

    await this.snapshotVersion(cvId, false);
    return section;
  }

  async listVersions(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    return this.prisma.cvVersion.findMany({
      where: { cvId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async restoreVersion(supabaseId: string, cvId: string, versionId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);

    const cvVersion = await this.prisma.cvVersion.findFirst({
      where: { id: versionId, cvId },
    });
    if (!cvVersion) throw new NotFoundException('Version not found');

    const snapshot = cvVersion.snapshot as any;

    // Clear all existing sections for this CV
    await this.prisma.cvSection.deleteMany({
      where: { cvId },
    });

    // Recreate sections from snapshot
    if (snapshot.sections && Array.isArray(snapshot.sections)) {
      for (const sec of snapshot.sections) {
        await this.prisma.cvSection.create({
          data: {
            cvId,
            type: sec.type,
            content: sec.content,
            order: sec.order,
          },
        });
      }
    }

    // Update CV details, incrementing version to push to other tabs
    const updated = await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        title: snapshot.title || 'Untitled CV',
        locale: snapshot.locale || 'en',
        templateId: snapshot.templateId || null,
        version: { increment: 1 },
        lastEditedSessionId: 'rollback',
        lastEditedDevice: 'Hệ thống (Phục hồi phiên bản)',
        lastEditedAt: new Date(),
      },
      include: { sections: { orderBy: { order: 'asc' } } },
    });

    await this.snapshotVersion(cvId, true);
    return updated;
  }

  async createShareLink(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    const token = randomBytes(24).toString('hex');
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
      throw new ForbiddenException('User not found');
    }
    return user.id;
  }

  private async assertOwnership(userId: string, cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      select: { userId: true, isDeleted: true },
    });
    if (!cv || cv.userId !== userId || cv.isDeleted) {
      throw new NotFoundException('CV not found');
    }
  }

  async snapshotVersion(cvId: string, force = false, isExport = false) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv) return;

    if (!force) {
      const latest = await this.prisma.cvVersion.findFirst({
        where: { cvId },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        const timeDiff = Date.now() - new Date(latest.createdAt).getTime();
        if (timeDiff < 120000) {
          // Skip autosave if it has been less than 2 minutes
          return;
        }
      }
    }

    await this.prisma.cvVersion.create({
      data: {
        cvId,
        snapshot: {
          title: cv.title,
          locale: cv.locale,
          templateId: cv.templateId,
          sections: cv.sections,
          metadata: {
            isManual: force && !isExport,
            isExport: isExport,
            createdAt: new Date().toISOString(),
          },
        } as Prisma.InputJsonValue,
      },
    });

    // Run Retention Policy Cleanups
    try {
      const versions = await this.prisma.cvVersion.findMany({
        where: { cvId },
      });

      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const ninetyDays = 90 * 24 * 60 * 60 * 1000;

      const idsToDelete: string[] = [];

      for (const ver of versions) {
        const age = now - new Date(ver.createdAt).getTime();
        const snap = ver.snapshot as any;
        const meta = snap?.metadata || {};

        if (meta.isManual) {
          // Manual checkpoints are kept forever
          continue;
        }

        if (meta.isExport) {
          // Export checkpoints are kept for 90 days
          if (age > ninetyDays) {
            idsToDelete.push(ver.id);
          }
        } else {
          // Autosave checkpoints are kept for 30 days
          if (age > thirtyDays) {
            idsToDelete.push(ver.id);
          }
        }
      }

      if (idsToDelete.length > 0) {
        await this.prisma.cvVersion.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        });
      }
    } catch (cleanupErr) {
      console.error('Failed to run version retention cleanup:', cleanupErr);
    }
  }

  private assembleResumeData(cv: {
    title: string;
    sections: Array<{ type: string; content: any }>;
  }): any {
    const data: Record<string, any> = { schemaVersion: 1 };
    for (const section of cv.sections) {
      data[section.type.toLowerCase()] = section.content;
    }
    // If schemaVersion is inside PROFILE section, extract it.
    if (data.profile && typeof data.profile === 'object') {
      data.schemaVersion = data.profile.schemaVersion ?? 1;
    }
    return data;
  }

  private async persistMigratedData(cvId: string, migratedData: any) {
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
      const content = migratedData[lowerType];
      if (content !== undefined) {
        const existing = await this.prisma.cvSection.findFirst({
          where: { cvId, type: type as any },
        });
        if (existing) {
          // If this is the PROFILE section, save the updated schemaVersion within its content
          const updatedContent =
            type === 'PROFILE'
              ? { ...content, schemaVersion: migratedData.schemaVersion }
              : content;

          await this.prisma.cvSection.update({
            where: { id: existing.id },
            data: { content: updatedContent as Prisma.InputJsonValue },
          });
        }
      }
    }
  }
}
