type TemplateLike = {
  id: string;
  name?: string;
  schema?: unknown;
};

type CvTemplateLike = {
  templateId?: string | null;
  templateSnapshot?: unknown;
};

/** Frontend render priority: CV snapshot > live catalog template > null. */
export function resolveCvTemplateSchema(
  cv: CvTemplateLike,
  templates: TemplateLike[] = [],
): unknown | null {
  if (cv.templateSnapshot && typeof cv.templateSnapshot === 'object') {
    return cv.templateSnapshot;
  }

  if (!cv.templateId) {
    return null;
  }

  const template = templates.find((item) => item.id === cv.templateId);
  return template?.schema ?? null;
}

export function resolveCvTemplateRecord(
  cv: CvTemplateLike,
  templates: TemplateLike[] = [],
): TemplateLike | null {
  if (cv.templateSnapshot && typeof cv.templateSnapshot === 'object') {
    const snapshot = cv.templateSnapshot as { id?: string; name?: string };
    return {
      id: snapshot.id || cv.templateId || 'unknown',
      name: snapshot.name,
      schema: cv.templateSnapshot,
    };
  }

  if (!cv.templateId) {
    return null;
  }

  return templates.find((item) => item.id === cv.templateId) ?? null;
}
