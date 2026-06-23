import { Prisma } from '@prisma/client';

type PrismaLike = {
  templateVersion: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<{ schema: unknown } | null>;
    findFirst: (args: {
      where: { templateId: string };
      orderBy: { version: 'desc' };
    }) => Promise<{ id: string; version: number; schema: unknown } | null>;
  };
  template: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<{ schema: unknown } | null>;
  };
};

type CvTemplateRefs = {
  templateSnapshot?: unknown;
  templateVersionId?: string | null;
  templateId?: string | null;
};

/** Resolve render schema with snapshot > version > live priority. */
export async function resolveTemplateSchemaForCv(
  prisma: PrismaLike,
  cv: CvTemplateRefs,
): Promise<unknown | null> {
  if (cv.templateSnapshot && typeof cv.templateSnapshot === 'object') {
    return cv.templateSnapshot;
  }

  if (cv.templateVersionId) {
    const ver = await prisma.templateVersion.findUnique({
      where: { id: cv.templateVersionId },
    });
    if (ver?.schema) {
      return ver.schema;
    }
  }

  if (cv.templateId) {
    const template = await prisma.template.findUnique({
      where: { id: cv.templateId },
    });
    if (template?.schema) {
      return template.schema;
    }
  }

  return null;
}

/** Build a snapshot from the latest template version or live template row. */
export async function buildTemplateSnapshotForTemplateId(
  prisma: PrismaLike,
  templateId: string,
): Promise<{
  templateVersionId: string | null;
  templateVersionNum: number;
  templateSnapshot: Prisma.InputJsonValue | undefined;
}> {
  const ver = await prisma.templateVersion.findFirst({
    where: { templateId },
    orderBy: { version: 'desc' },
  });

  if (ver?.schema) {
    return {
      templateVersionId: ver.id,
      templateVersionNum: ver.version,
      templateSnapshot: ver.schema as Prisma.InputJsonValue,
    };
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (template?.schema) {
    return {
      templateVersionId: null,
      templateVersionNum: 1,
      templateSnapshot: template.schema as Prisma.InputJsonValue,
    };
  }

  return {
    templateVersionId: null,
    templateVersionNum: 1,
    templateSnapshot: undefined,
  };
}
