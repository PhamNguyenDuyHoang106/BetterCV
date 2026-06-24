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
import { ThumbnailService } from './thumbnail.service';
import { AuditLogService } from '../audit/audit.service';
import {
  buildTemplateSnapshotForTemplateId,
  resolveTemplateSchemaForCv,
} from '../template/template-schema.util';

@Injectable()
export class CvService {
  constructor(
    private prisma: PrismaService,
    private thumbnailService: ThumbnailService,
    private auditService: AuditLogService,
  ) {}

  async create(supabaseId: string, dto: CvCreateDto) {
    const userId = await this.resolveUserId(supabaseId);
    let templateVersionId: string | null = null;
    let templateVersionNum = 1;
    let templateSnapshot: Prisma.InputJsonValue | undefined;
    if (dto.templateId) {
      const pinned = await buildTemplateSnapshotForTemplateId(
        this.prisma,
        dto.templateId,
      );
      templateVersionId = pinned.templateVersionId;
      templateVersionNum = pinned.templateVersionNum;
      templateSnapshot = pinned.templateSnapshot ?? undefined;
    }
    return this.prisma.cv.create({
      data: {
        userId,
        title: dto.title,
        locale: dto.locale,
        templateId: dto.templateId,
        templateVersionId,
        templateVersionNum,
        templateSnapshot,
        atsScore: 0,
        completenessScore: 0,
      },
    });
  }

  async list(supabaseId: string) {
    const userId = await this.resolveUserId(supabaseId);
    const cvs = await this.prisma.cv.findMany({
      where: { userId, isDeleted: false },
      include: {
        sections: { orderBy: { order: 'asc' } },
        atsScans: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
    for (const cv of cvs) {
      if (cv.atsScore === null || cv.completenessScore === null) {
        const scores = this.computeScoresFromSections(cv.sections);
        cv.atsScore = scores.atsScore;
        cv.completenessScore = scores.completenessScore;
      }
      this.autoEnqueueThumbnailIfNeeded(cv);
    }
    return cvs;
  }

  async get(supabaseId: string, id: string) {
    const userId = await this.resolveUserId(supabaseId);
    const cv = await this.prisma.cv.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { order: 'asc' } },
        atsScans: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!cv || cv.userId !== userId || cv.isDeleted) {
      throw new NotFoundException('CV not found');
    }

    if (cv.atsScore === null || cv.completenessScore === null) {
      const scores = this.computeScoresFromSections(cv.sections);
      cv.atsScore = scores.atsScore;
      cv.completenessScore = scores.completenessScore;
    }

    this.autoEnqueueThumbnailIfNeeded(cv);

    if (!cv.templateSnapshot && (cv.templateVersionId || cv.templateId)) {
      const resolvedSnapshot = await resolveTemplateSchemaForCv(
        this.prisma,
        cv,
      );
      if (resolvedSnapshot) {
        await this.prisma.cv.update({
          where: { id },
          data: {
            templateSnapshot: resolvedSnapshot as Prisma.InputJsonValue,
          },
        });
        cv.templateSnapshot = resolvedSnapshot;
      }
    }

    // Run the on-read migration pipeline
    const assembled = this.assembleResumeData(cv);
    const { migrated, data: migratedData } = migrateCvData(assembled);

    if (migrated) {
      await this.persistMigratedData(cv.id, migratedData);
      // Reload CV with updated sections
      const updatedCv = await this.prisma.cv.findUnique({
        where: { id },
        include: {
          sections: { orderBy: { order: 'asc' } },
          atsScans: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      if (updatedCv) {
        this.autoEnqueueThumbnailIfNeeded(updatedCv);
        return updatedCv;
      }
    }

    return cv;
  }

  async update(
    supabaseId: string,
    id: string,
    dto: CvUpdateDto,
    clientSession?: { sessionId?: string; device?: string },
    requestId?: string,
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

    let templateVersionId = existing.templateVersionId;
    let templateVersionNum = existing.templateVersionNum;
    let templateSnapshot:
      | Prisma.InputJsonValue
      | typeof Prisma.JsonNull
      | undefined =
      (existing.templateSnapshot as Prisma.InputJsonValue | null) ?? undefined;
    if (
      dto.templateId !== undefined &&
      dto.templateId !== existing.templateId
    ) {
      if (dto.templateId) {
        const pinned = await buildTemplateSnapshotForTemplateId(
          this.prisma,
          dto.templateId,
        );
        templateVersionId = pinned.templateVersionId;
        templateVersionNum = pinned.templateVersionNum;
        templateSnapshot = pinned.templateSnapshot ?? undefined;
      } else {
        templateVersionId = null;
        templateVersionNum = 1;
        templateSnapshot = Prisma.JsonNull;
      }
    }

    const cv = await this.prisma.$transaction(async (tx) => {
      const updatedCv = await tx.cv.update({
        where: { id },
        data: {
          title: dto.title,
          locale: dto.locale,
          templateId: dto.templateId,
          templateVersionId,
          templateVersionNum,
          templateSnapshot,
          version: { increment: 1 },
          lastEditedSessionId: clientSession?.sessionId || null,
          lastEditedDevice: clientSession?.device || null,
          lastEditedAt: new Date(),
          atsScannedAt: null,
          thumbnailStatus: 'PENDING',
        },
      });

      await this.snapshotVersion(id, true, false, tx);

      await this.auditService.logEvent(
        {
          actorUserId: userId,
          actorType: 'USER',
          eventType: 'CV_UPDATED',
          action: 'CV metadata updated',
          resourceType: 'Cv',
          resourceId: id,
          oldValue: existing,
          newValue: updatedCv,
          severity: 'INFO',
        },
        tx,
      );

      return updatedCv;
    });

    // Trigger real-time CV thumbnail generation
    await this.thumbnailService.enqueueThumbnailGeneration(
      id,
      cv.version,
      requestId,
    );

    return cv;
  }

  async softDelete(supabaseId: string, id: string, requestId?: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, id);
    await this.prisma.cv.update({
      where: { id },
      data: { isDeleted: true },
    });
    await this.thumbnailService.enqueueThumbnailCleanup(id, requestId);
    return { success: true };
  }

  async upsertSection(
    supabaseId: string,
    cvId: string,
    dto: CvSectionUpsertDto,
    clientSession?: { sessionId?: string; device?: string },
    requestId?: string,
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

    const result = await this.prisma.$transaction(async (tx) => {
      let section;
      const existingSection =
        dto.id && !dto.id.startsWith('temp_')
          ? await tx.cvSection.findUnique({ where: { id: dto.id } })
          : null;

      if (dto.id && !dto.id.startsWith('temp_')) {
        section = await tx.cvSection.update({
          where: { id: dto.id },
          data: {
            type: dto.type,
            content: dto.content as Prisma.InputJsonValue,
            order: dto.order,
          },
        });
      } else {
        section = await tx.cvSection.create({
          data: {
            cvId,
            type: dto.type,
            content: dto.content as Prisma.InputJsonValue,
            order: dto.order,
          },
        });
      }

      // Increment document version, update edit attributions, and compute new scores
      const allSections = await tx.cvSection.findMany({
        where: { cvId },
      });
      const { completenessScore } = this.computeScoresFromSections(allSections);

      const updatedCv = await tx.cv.update({
        where: { id: cvId },
        data: {
          version: { increment: 1 },
          lastEditedSessionId: clientSession?.sessionId || null,
          lastEditedDevice: clientSession?.device || null,
          lastEditedAt: new Date(),
          completenessScore,
          atsScannedAt: null,
          thumbnailStatus: 'PENDING',
        },
      });

      await this.snapshotVersion(cvId, false, false, tx);

      // Audit section update inside transaction
      await this.auditService.logEvent(
        {
          actorUserId: userId,
          actorType: 'USER',
          eventType: 'CV_SECTION_UPDATED',
          action: existingSection
            ? `Section ${dto.type} updated`
            : `Section ${dto.type} created`,
          resourceType: 'CvSection',
          resourceId: section.id,
          oldValue: existingSection,
          newValue: section,
          severity: 'INFO',
        },
        tx,
      );

      return { section, updatedCv };
    });

    // Trigger real-time CV thumbnail generation
    await this.thumbnailService.enqueueThumbnailGeneration(
      cvId,
      result.updatedCv.version,
      requestId,
    );

    return result.section;
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

  async createManualVersion(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    await this.snapshotVersion(cvId, true, false);
    return { success: true };
  }

  async renameVersion(
    supabaseId: string,
    cvId: string,
    versionId: string,
    title: string,
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);

    const version = await this.prisma.cvVersion.findFirst({
      where: { id: versionId, cvId },
    });
    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.prisma.cvVersion.update({
      where: { id: versionId },
      data: { title },
    });
  }

  async deleteVersion(supabaseId: string, cvId: string, versionId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);

    const version = await this.prisma.cvVersion.findFirst({
      where: { id: versionId, cvId },
    });
    if (!version) {
      throw new NotFoundException('Version not found');
    }

    await this.prisma.cvVersion.delete({
      where: { id: versionId },
    });
    return { success: true };
  }

  /**
   * Retrieves the 20 most recent ATS scans for a CV.
   * To ensure the frontend Sparkline chart plots chronologically from left to right (oldest to newest),
   * we fetch the latest 20 scans in descending order, then reverse the array to ascending chronological order.
   * This prevents database over-indexing on old scans and shields the client from reverse-sorting bugs.
   */
  async listAtsHistory(supabaseId: string, cvId: string) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);
    const scans = await this.prisma.atsScan.findMany({
      where: { cvId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return scans.reverse(); // Descending latest 20 -> reverse to return chronologically ascending (oldest to newest)
  }

  async restoreVersion(
    supabaseId: string,
    cvId: string,
    versionId: string,
    requestId?: string,
  ) {
    const userId = await this.resolveUserId(supabaseId);
    await this.assertOwnership(userId, cvId);

    const cvVersion = await this.prisma.cvVersion.findFirst({
      where: { id: versionId, cvId },
    });
    if (!cvVersion) throw new NotFoundException('Version not found');

    const snapshot = cvVersion.snapshot as any;

    // Get current sections for old state logging
    const oldSections = await this.prisma.cvSection.findMany({
      where: { cvId },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // Clear all existing sections for this CV
      await tx.cvSection.deleteMany({
        where: { cvId },
      });

      // Recreate sections from snapshot
      const sectionsToCreate: any[] = [];
      if (snapshot.sections && Array.isArray(snapshot.sections)) {
        for (const sec of snapshot.sections) {
          const created = await tx.cvSection.create({
            data: {
              cvId,
              type: sec.type,
              content: sec.content,
              order: sec.order,
            },
          });
          sectionsToCreate.push(created);
        }
      }

      const { completenessScore } =
        this.computeScoresFromSections(sectionsToCreate);

      // Update CV details, incrementing version to push to other tabs
      const updated = await tx.cv.update({
        where: { id: cvId },
        data: {
          title: snapshot.title || 'Untitled CV',
          locale: snapshot.locale || 'en',
          templateId: snapshot.templateId || null,
          templateSnapshot: snapshot.templateSnapshot ?? Prisma.JsonNull,
          version: { increment: 1 },
          lastEditedSessionId: 'rollback',
          lastEditedDevice: 'Hệ thống (Phục hồi phiên bản)',
          lastEditedAt: new Date(),
          completenessScore,
          atsScannedAt: null,
          thumbnailStatus: 'PENDING',
        },
        include: { sections: { orderBy: { order: 'asc' } } },
      });

      await this.snapshotVersion(cvId, true, false, tx);

      // Audit log inside transaction
      await this.auditService.logEvent(
        {
          actorUserId: userId,
          actorType: 'USER',
          eventType: 'CV_RESTORED',
          action: `CV restored to version ${cvVersion.id}`,
          resourceType: 'Cv',
          resourceId: cvId,
          oldValue: oldSections,
          newValue: sectionsToCreate,
          severity: 'INFO',
        },
        tx,
      );

      return updated;
    });

    // Trigger real-time CV thumbnail generation outside of tx
    await this.thumbnailService.enqueueThumbnailGeneration(
      cvId,
      result.version,
      requestId,
    );

    return result;
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

  private autoEnqueueThumbnailIfNeeded(cv: any) {
    if (
      cv &&
      (cv.thumbnailStatus === 'PENDING' ||
        cv.thumbnailStatus === 'PROCESSING') &&
      this.thumbnailService.isRenderable(cv)
    ) {
      this.thumbnailService
        .enqueueThumbnailGeneration(cv.id, cv.version)
        .catch(() => {});
    }
  }

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

  async snapshotVersion(
    cvId: string,
    force = false,
    isExport = false,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const cv = await client.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv) return;

    if (!force) {
      const latest = await client.cvVersion.findFirst({
        where: { cvId },
        orderBy: { createdAt: 'desc' },
      });
      if (latest) {
        const timeDiff = Date.now() - new Date(latest.createdAt).getTime();
        if (timeDiff < 60000) {
          // Skip autosave if it has been less than 1 minute
          return;
        }
      }
    }

    await client.cvVersion.create({
      data: {
        cvId,
        snapshot: {
          title: cv.title,
          locale: cv.locale,
          templateId: cv.templateId,
          templateSnapshot: cv.templateSnapshot,
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
      const versions = await client.cvVersion.findMany({
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
        await client.cvVersion.deleteMany({
          where: {
            id: { in: idsToDelete },
          },
        });
      }
    } catch (cleanupErr) {
      console.error('Failed to run version retention cleanup:', cleanupErr);
    }
  }

  private computeScoresFromSections(sections: any[]) {
    let completeness = 0;

    // 1. PROFILE: 20 pts
    const profileSec = sections.find((s: any) => s.type === 'PROFILE');
    if (profileSec) {
      const content = profileSec.content || {};
      if (content.fullName && content.fullName.trim()) {
        completeness += 20;
      } else {
        completeness += 10;
      }
    }

    // 2. SUMMARY: 10 pts
    const summarySec = sections.find((s: any) => s.type === 'SUMMARY');
    if (summarySec) {
      const content = summarySec.content || {};
      const text = content.text || content.objective || '';
      if (text.trim().length > 0) {
        completeness += 10;
      } else {
        completeness += 5;
      }
    }

    // 3. EXPERIENCE: 25 pts
    const expSec = sections.find((s: any) => s.type === 'EXPERIENCE');
    if (expSec) {
      const content = expSec.content || {};
      const items = content.items || (Array.isArray(content) ? content : []);
      if (items.length > 0) {
        completeness += 25;
      } else {
        completeness += 10;
      }
    }

    // 4. EDUCATION: 20 pts
    const eduSec = sections.find((s: any) => s.type === 'EDUCATION');
    if (eduSec) {
      const content = eduSec.content || {};
      const items = content.items || (Array.isArray(content) ? content : []);
      if (items.length > 0) {
        completeness += 20;
      } else {
        completeness += 8;
      }
    }

    // 5. SKILLS: 15 pts
    const skillsSec = sections.find((s: any) => s.type === 'SKILLS');
    if (skillsSec) {
      const content = skillsSec.content || {};
      const items = content.items || (Array.isArray(content) ? content : []);
      if (items.length > 0) {
        completeness += 15;
      } else {
        completeness += 5;
      }
    }

    // 6. PROJECTS: 10 pts
    const projSec = sections.find((s: any) => s.type === 'PROJECTS');
    if (projSec) {
      const content = projSec.content || {};
      const items = content.items || (Array.isArray(content) ? content : []);
      if (items.length > 0) {
        completeness += 10;
      } else {
        completeness += 4;
      }
    }

    return {
      completenessScore: completeness,
      atsScore: completeness,
    };
  }

  private async updateCvScores(cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { sections: true },
    });
    if (!cv) return;

    const { completenessScore } = this.computeScoresFromSections(cv.sections);

    await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        completenessScore,
        atsScannedAt: null,
        thumbnailStatus: 'PENDING',
      },
    });
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
