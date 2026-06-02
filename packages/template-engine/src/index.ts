import { z } from "zod";

// ─── Gallery Demo Data ─────────────────────────────────────────────────────
// Canonical demo dataset for Gallery previews. Uses the same shape as real
// ResumeData so the Gallery renders through the exact same pipeline as the
// Editor and PDF Export. Stress-tests layout with realistic content density.

export const GALLERY_DEMO_DATA: Record<string, unknown> = {
  schemaVersion: 1,
  profile: {
    fullName: "Alex Mercer",
    title: "Senior Software Engineer",
    email: "alex.mercer@email.com",
    phone: "+84 987 654 321",
    linkedin: "https://linkedin.com/in/alexmercer",
    github: "https://github.com/alexmercer",
    website: "https://alexmercer.dev",
    address: "123 Cầu Giấy",
    city: "Hà Nội",
    avatarUrl: "",
    theme: { primaryColor: "", accentColor: "" },
  },
  summary: {
    text: "**Senior Software Engineer** với 7 năm kinh nghiệm xây dựng hệ thống phân tán. Dẫn dắt team 5 kỹ sư, tăng throughput hệ thống **40%** và giảm latency **60ms**. Thành thạo Java, Golang, Kubernetes và thiết kế event-driven architecture.",
  },
  experience: [
    {
      id: "exp_demo_1",
      position: "Senior Software Engineer",
      company: "TechCorp Vietnam",
      location: "Hà Nội",
      startDate: "2021-03",
      endDate: "",
      current: true,
      description:
        "- Thiết kế và triển khai microservices xử lý **2M+ requests/ngày**\n- Tối ưu query PostgreSQL, giảm p99 latency từ 800ms xuống 120ms\n- Dẫn dắt migration từ monolith sang event-driven với Apache Kafka",
    },
    {
      id: "exp_demo_2",
      position: "Software Engineer",
      company: "StartupXYZ",
      location: "TP.HCM",
      startDate: "2018-06",
      endDate: "2021-02",
      current: false,
      description:
        "- Xây dựng REST API cho nền tảng e-commerce phục vụ **500K users**\n- Implement CI/CD pipeline với GitHub Actions, giảm deploy time 70%\n- Mentor 3 junior engineers về clean code và SOLID principles",
    },
  ],
  education: [
    {
      id: "edu_demo_1",
      institution: "Đại học Bách khoa Hà Nội",
      degree: "Kỹ sư",
      fieldOfStudy: "Công nghệ Thông tin",
      startDate: "2014-09",
      endDate: "2018-06",
      current: false,
      gpa: "3.6/4.0",
    },
  ],
  skills: {
    items: [
      { id: "sk_1", name: "Java / Spring Boot", level: "Expert" },
      { id: "sk_2", name: "Golang", level: "Advanced" },
      { id: "sk_3", name: "PostgreSQL", level: "Expert" },
      { id: "sk_4", name: "Kubernetes / Docker", level: "Advanced" },
      { id: "sk_5", name: "Apache Kafka", level: "Intermediate" },
      { id: "sk_6", name: "React / TypeScript", level: "Advanced" },
    ],
    showLevel: true,
  },
  projects: [
    {
      id: "proj_demo_1",
      name: "BetterDeploy",
      role: "Lead Engineer",
      url: "https://github.com/alexmercer/betterdeploy",
      description:
        "- Platform tự động hóa deploy Kubernetes với zero-downtime rolling update\n- Giảm mean time to deploy từ **45 phút xuống 8 phút**",
      technologies: ["Golang", "Kubernetes", "Helm", "GitHub Actions"],
    },
  ],
  theme: { primaryColor: "", accentColor: "" },
};

export const SectionStylesSchema = z.object({
  experience: z.object({
    variant: z.enum(["classic", "timeline", "card", "minimal"]),
  }).optional(),
  education: z.object({
    variant: z.enum(["classic", "timeline", "minimal"]),
  }).optional(),
  skills: z.object({
    variant: z.enum(["badges", "bars", "columns"]),
  }).optional(),
  projects: z.object({
    variant: z.enum(["classic", "grid"]),
  }).optional(),
}).optional();

export type SectionStyles = z.infer<typeof SectionStylesSchema>;

export const ThemeTokensSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid primaryColor hex color"),
  secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid secondaryColor hex color"),
  accentColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid accentColor hex color"),
  dividerColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid dividerColor hex color"),
  fontHeader: z.string(),
  fontBody: z.string(),
  sidebarWidth: z.string(),
  sectionGap: z.string(),
  timelineBorderColor: z.string(),
  headerBackground: z.string(),
  headerTextColor: z.string(),
  sidebarBackground: z.string().optional(),
  sidebarTextColor: z.string().optional(),
  sidebarPadding: z.string().optional(),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export const LayoutConfigSchema = z.object({
  layoutMode: z.enum(["single-column", "sidebar-left", "sidebar-right", "minimal"]),
  columns: z.object({
    sidebar: z.array(z.string()).optional(),
    main: z.array(z.string()),
  }),
  order: z.array(z.string()),
  headerAlignment: z.enum(["left", "center", "right"]).optional().default("left"),
  showAvatar: z.boolean().optional().default(true),
  useTimeline: z.boolean().optional().default(false),
  fullBleedHeader: z.boolean().optional().default(false),
  fullPageBleed: z.boolean().optional().default(false),
});

export type LayoutConfig = z.infer<typeof LayoutConfigSchema>;

export const TemplateSchemaZod = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["TECH", "BUSINESS", "DESIGN"]),
  layout: z.object({
    sections: z.array(
      z.object({
        type: z.string(),
        blocks: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
          })
        ),
      })
    ),
  }),
  layoutConfig: LayoutConfigSchema.optional(),
  themeTokens: ThemeTokensSchema.optional(),
  sectionStyles: SectionStylesSchema.optional(),
  thumbnailUrl: z.string().optional(),
});

export type TemplateSchema = z.infer<typeof TemplateSchemaZod>;

export type RenderInput = {
  template: TemplateSchema;
  data: Record<string, unknown>;
  localFontsDir?: string;
};

// ─── Whitelist Entry-point Sanitizer ──────────────────────────────────────────

/**
 * A secure, fast, and XSS-immune markdown compiler.
 * Force-escapes all HTML tags first, then compiles whitelist safe tags.
 */
export const compileMarkdown = (markdown: string): string => {
  if (!markdown) return "";
  
  // Normalize Windows newlines to handle cross-platform parity
  const cleanMarkdown = markdown.replace(/\r\n/g, "\n");

  // 1. Strict HTML escape to defeat all HTML injection (XSS protection)
  let escaped = cleanMarkdown
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  // 2. Compile bold (non-nested)
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // 3. Compile italics
  escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
  
  // 4. Compile bullets
  escaped = escaped.replace(/^[ \t]*[-*][ \t]+(.*)$/gm, "<li>$1</li>");
  escaped = escaped.replace(/(?:<li>.*?<\/li>\n*)+/gs, (match) => `<ul>${match.trim()}</ul>`);

  // 5. Compile paragraphs and line breaks
  escaped = escaped
    .split("\n\n")
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("<ul>") && trimmed.endsWith("</ul>")) return trimmed;
      
      let lineBroken = trimmed.replace(/\n/g, "<br />");
      lineBroken = lineBroken.replace(/<\/li><br \/><li>/g, "</li>\n<li>");
      return `<p>${lineBroken}</p>`;
    })
    .filter(Boolean)
    .join("");

  // 6. Compile links [text](url)
  escaped = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 7. Security Link filtering: ensure no "javascript:" links can be loaded
  escaped = escaped.replace(/href=["']\s*javascript:/gi, 'href="#"');

  return escaped;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

// ─── Data Normalization Rules ────────────────────────────────────────────────

export const normalizeData = (data: Record<string, any>): Record<string, any> => {
  const normalized: Record<string, any> = {};

  // Normalize profile
  const profile = data.profile || {};
  normalized.profile = {
    fullName: (profile.fullName || profile.name || "").trim(),
    title: (profile.title || "").trim(),
    email: (profile.email || "").trim(),
    phone: (profile.phone || "").trim(),
    website: stripUnsafeUrls(profile.website || ""),
    github: stripUnsafeUrls(profile.github || ""),
    linkedin: stripUnsafeUrls(profile.linkedin || ""),
    avatarUrl: stripUnsafeUrls(profile.avatarUrl || ""),
    address: (profile.address || "").trim(),
    city: (profile.city || "").trim(),
  };

  // Normalize summary
  const summary = data.summary || {};
  normalized.summary = {
    text: (summary.text || "").trim(),
  };

  // Normalize experience
  const rawExp = data.experience || [];
  const expItems = Array.isArray(rawExp) ? rawExp : (rawExp.items || []);
  normalized.experience = expItems.map((item: any) => ({
    id: item.id || `exp_${Math.random()}`,
    position: (item.position || "").trim(),
    company: (item.company || "").trim(),
    location: (item.location || "").trim(),
    startDate: (item.startDate || "").trim(),
    endDate: item.current ? "" : (item.endDate || "").trim(),
    current: !!item.current,
    description: (item.description || "").trim(),
  }));

  // Normalize education
  const rawEdu = data.education || [];
  const eduItems = Array.isArray(rawEdu) ? rawEdu : (rawEdu.items || []);
  normalized.education = eduItems.map((item: any) => ({
    id: item.id || `edu_${Math.random()}`,
    institution: (item.institution || "").trim(),
    degree: (item.degree || "").trim(),
    fieldOfStudy: (item.fieldOfStudy || "").trim(),
    startDate: (item.startDate || "").trim(),
    endDate: item.current ? "" : (item.endDate || "").trim(),
    current: !!item.current,
    gpa: (item.gpa || "").trim(),
  }));

  // Normalize skills (with deduplication!)
  const rawSkills = data.skills || [];
  const skillItems = Array.isArray(rawSkills) ? rawSkills : (rawSkills.items || []);
  const showLevelSetting = Array.isArray(rawSkills) ? true : (rawSkills.showLevel !== false);
  const seenSkills = new Set<string>();
  const uniqueSkills: any[] = [];
  
  for (const item of skillItems) {
    const name = (item.name || "").trim();
    if (name && !seenSkills.has(name.toLowerCase())) {
      seenSkills.add(name.toLowerCase());
      uniqueSkills.push({
        id: item.id || `skill_${Math.random()}`,
        name,
        level: item.level || "Advanced",
      });
    }
  }
  (uniqueSkills as any).showLevel = showLevelSetting;
  normalized.skills = uniqueSkills;

  // Normalize projects
  const rawProjects = data.projects || [];
  const projectItems = Array.isArray(rawProjects) ? rawProjects : (rawProjects.items || []);
  normalized.projects = projectItems.map((item: any) => ({
    id: item.id || `proj_${Math.random()}`,
    name: (item.name || "").trim(),
    role: (item.role || "").trim(),
    url: stripUnsafeUrls(item.url || ""),
    description: (item.description || "").trim(),
    technologies: Array.isArray(item.technologies)
      ? item.technologies.map((t: string) => t.trim()).filter(Boolean)
      : [],
  }));

  return normalized;
};

const stripUnsafeUrls = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith("javascript:")) {
    return "#";
  }
  return trimmed;
};

const ensureAbsoluteUrl = (url: string): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed === "#") return "#";
  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const getDisplayUrl = (url: string): string => {
  if (!url || url === "#") return "";
  let clean = url.trim();
  // Remove protocol
  clean = clean.replace(/^(f|ht)tps?:\/\/(www\.)?/i, "");
  // Remove trailing slash
  if (clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
};

// ─── Semantic Theme Tokens & Layout Registry ────────────────────────────────

export const getTemplateStyles = (templateId: string): ThemeTokens => {
  const defaults: ThemeTokens = {
    primaryColor: "#1e293b",
    secondaryColor: "#475569",
    accentColor: "#3b82f6",
    dividerColor: "#cbd5e1",
    fontHeader: "'Merriweather', serif",
    fontBody: "'Inter', sans-serif",
    sidebarWidth: "30%",
    sectionGap: "20px",
    timelineBorderColor: "#e2e8f0",
    headerBackground: "transparent",
    headerTextColor: "#1e293b",
    sidebarBackground: "transparent",
    sidebarTextColor: "#334155",
    sidebarPadding: "0 16px 0 0",
  };

  switch (templateId) {
    case "business-classic":
      return {
        ...defaults,
        primaryColor: "#1e3a8a",
        accentColor: "#1d4ed8",
        dividerColor: "#3b82f6",
        fontHeader: "'Playfair Display', serif",
      };
    case "tech-classic":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        accentColor: "#0d9488",
        dividerColor: "#0d9488",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
        fontBody: "'Plus Jakarta Sans', sans-serif",
      };
    case "techstack":
      return {
        ...defaults,
        primaryColor: "#111827",
        accentColor: "#6366f1",
        dividerColor: "#818cf8",
        fontHeader: "'Manrope', sans-serif",
      };
    case "dublin":
      return {
        ...defaults,
        primaryColor: "#312e81",
        accentColor: "#4338ca",
        dividerColor: "#8b5cf6",
        headerBackground: "#312e81",
        headerTextColor: "#ffffff",
        fontHeader: "'Cormorant Garamond', serif",
      };
    case "design-classic":
      return {
        ...defaults,
        primaryColor: "#0f766e",
        accentColor: "#14b8a6",
        dividerColor: "#2dd4bf",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "nova":
      return {
        ...defaults,
        primaryColor: "#030712",
        accentColor: "#ec4899",
        dividerColor: "#f472b6",
        fontHeader: "'Manrope', sans-serif",
        fontBody: "'Manrope', sans-serif",
        timelineBorderColor: "#ec4899",
      };
    case "monarch":
      return {
        ...defaults,
        primaryColor: "#701a75",
        accentColor: "#d97706",
        dividerColor: "#f59e0b",
        fontHeader: "'Cormorant Garamond', serif",
        fontBody: "'Cormorant Garamond', serif",
      };
    case "minimalist":
      return {
        ...defaults,
        primaryColor: "#111827",
        accentColor: "#475569",
        dividerColor: "#e2e8f0",
        fontHeader: "'Cormorant Garamond', serif",
      };
    case "london":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        accentColor: "#4338ca",
        dividerColor: "#818cf8",
        fontHeader: "'Playfair Display', serif",
      };
    case "zurich":
      return {
        ...defaults,
        primaryColor: "#111827",
        accentColor: "#2563eb",
        dividerColor: "#93c5fd",
        fontHeader: "'Merriweather', serif",
      };
    case "oslo":
      return {
        ...defaults,
        primaryColor: "#064e3b",
        accentColor: "#22c55e",
        dividerColor: "#4ade80",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
        fontBody: "'Plus Jakarta Sans', sans-serif",
      };
    case "berlin":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        accentColor: "#fb923c",
        dividerColor: "#fbbf24",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "stockholm":
      return {
        ...defaults,
        primaryColor: "#111827",
        accentColor: "#64748b",
        dividerColor: "#cbd5e1",
        fontHeader: "'Merriweather', serif",
      };
    case "paris":
      return {
        ...defaults,
        primaryColor: "#581c87",
        accentColor: "#f472b6",
        dividerColor: "#f9a8d4",
        fontHeader: "'Cormorant Garamond', serif",
      };
    case "milan":
      return {
        ...defaults,
        primaryColor: "#7c3aed",
        accentColor: "#fbcfe8",
        dividerColor: "#ddd6fe",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "tokyo":
      return {
        ...defaults,
        primaryColor: "#be185d",
        accentColor: "#f472b6",
        dividerColor: "#fed7aa",
        fontHeader: "'Inter', sans-serif",
      };
    case "singapore":
      return {
        ...defaults,
        primaryColor: "#0c4a6e",
        accentColor: "#38bdf8",
        dividerColor: "#bae6fd",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "sydney":
      return {
        ...defaults,
        primaryColor: "#0f766e",
        accentColor: "#06b6d4",
        dividerColor: "#67e8f9",
        fontHeader: "'Inter', sans-serif",
      };
    case "toronto":
      return {
        ...defaults,
        primaryColor: "#92400e",
        accentColor: "#f59e0b",
        dividerColor: "#fed7aa",
        fontHeader: "'Playfair Display', serif",
      };
    case "seattle":
      return {
        ...defaults,
        primaryColor: "#0c4a6e",
        accentColor: "#38bdf8",
        dividerColor: "#bae6fd",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "austin":
      return {
        ...defaults,
        primaryColor: "#78350f",
        accentColor: "#facc15",
        dividerColor: "#fde68a",
        fontHeader: "'Inter', sans-serif",
      };
    case "boston":
      return {
        ...defaults,
        primaryColor: "#7c2d12",
        accentColor: "#f97316",
        dividerColor: "#fdba74",
        fontHeader: "'Merriweather', serif",
      };
    case "chicago":
      return {
        ...defaults,
        primaryColor: "#991b1b",
        accentColor: "#fb7185",
        dividerColor: "#fecaca",
        fontHeader: "'Playfair Display', serif",
      };
    case "amsterdam":
      return {
        ...defaults,
        primaryColor: "#ea580c",
        accentColor: "#fb923c",
        dividerColor: "#fdba74",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "copenhagen":
      return {
        ...defaults,
        primaryColor: "#047857",
        accentColor: "#6ee7b7",
        dividerColor: "#bbf7d0",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "vienna":
      return {
        ...defaults,
        primaryColor: "#7c2d12",
        accentColor: "#f472b6",
        dividerColor: "#fbcfe8",
        fontHeader: "'Cormorant Garamond', serif",
      };
    case "geneva":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        accentColor: "#2563eb",
        dividerColor: "#93c5fd",
        fontHeader: "'Merriweather', serif",
      };
    case "prague":
      return {
        ...defaults,
        primaryColor: "#312e81",
        accentColor: "#818cf8",
        dividerColor: "#c7d2fe",
        fontHeader: "'Inter', sans-serif",
      };
    case "helsinki":
      return {
        ...defaults,
        primaryColor: "#0f766e",
        accentColor: "#14b8a6",
        dividerColor: "#99f6e4",
        fontHeader: "'Merriweather', serif",
      };
    case "barcelona-creative":
      return {
        ...defaults,
        primaryColor: "#65a30d",
        accentColor: "#bef264",
        dividerColor: "#dcfce7",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
      };
    case "hong-kong-finance":
      return {
        ...defaults,
        primaryColor: "#78350f",
        accentColor: "#f59e0b",
        dividerColor: "#fde68a",
        fontHeader: "'Playfair Display', serif",
      };
    default:
      return defaults;
  }
};

export const getLayoutConfig = (templateId: string): LayoutConfig => {
  const defaults = {
    headerAlignment: "left" as const,
    showAvatar: true,
    useTimeline: false,
    fullBleedHeader: false,
    fullPageBleed: false,
  };

  switch (templateId) {
    case "techstack":
    case "nova":
    case "design-classic":
    case "london":
    case "singapore":
    case "barcelona-creative":
    case "amsterdam":
      return {
        ...defaults,
        layoutMode: "sidebar-left",
        columns: {
          sidebar: ["SKILLS", "EDUCATION"],
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
      };
    case "dublin":
    case "business-classic":
    case "oslo":
    case "berlin":
    case "copenhagen":
    case "hong-kong-finance":
      return {
        ...defaults,
        layoutMode: "sidebar-right",
        columns: {
          sidebar: ["SKILLS", "PROJECTS"],
          main: ["SUMMARY", "EXPERIENCE", "EDUCATION"],
        },
        order: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
      };
    case "minimalist":
    case "paris":
    case "boston":
    case "vienna":
    case "prague":
      return {
        ...defaults,
        layoutMode: "minimal",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
      };
    case "stockholm":
    case "austin":
    case "helsinki":
    case "toronto":
    case "chicago":
    case "geneva":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "SKILLS", "EDUCATION", "PROJECTS"],
        },
        order: ["SUMMARY", "SKILLS", "EXPERIENCE", "EDUCATION", "PROJECTS"],
      };
    case "tech-classic":
    case "sydney":
    case "tokyo":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"],
      };
    default:
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
      };
  }
};

// ─── Componentized Section Renderers ────────────────────────────────────────

const renderSummary = (data: any, variant = "classic"): string => {
  if (!data || !data.text) return "";
  return `<div class="summary-text">${compileMarkdown(data.text)}</div>`;
};

const renderExperience = (data: any, variant = "classic"): string => {
  if (!Array.isArray(data) || data.length === 0) return "";
  return data.map((item: any) => `
    <div class="experience-item variant-${variant}">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.position || '')}</span>
        <span class="item-date">${escapeHtml(item.startDate || '')} - ${item.current ? 'Hiện tại' : escapeHtml(item.endDate || '')}</span>
      </div>
      <div class="item-subtitle">
        <span>${escapeHtml(item.company || '')} ${item.location ? `| ${escapeHtml(item.location)}` : ''}</span>
      </div>
      <div class="item-description">${compileMarkdown(item.description || '')}</div>
    </div>
  `).join("");
};

const renderEducation = (data: any, variant = "classic"): string => {
  if (!Array.isArray(data) || data.length === 0) return "";
  return data.map((item: any) => `
    <div class="education-item variant-${variant}">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.institution || '')}</span>
        <span class="item-date">${escapeHtml(item.startDate || '')} - ${item.current ? 'Hiện tại' : escapeHtml(item.endDate || '')}</span>
      </div>
      <div class="item-subtitle">
        <span>${escapeHtml(item.degree || '')} ${item.fieldOfStudy ? `| Chuyên ngành: ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
        ${item.gpa ? `<span style="font-weight: 500; color: var(--accent-color);">GPA: ${escapeHtml(item.gpa)}</span>` : ''}
      </div>
    </div>
  `).join("");
};

const renderSkills = (data: any, variant = "badges"): string => {
  const items = Array.isArray(data) ? data : (data?.items || []);
  if (items.length === 0) return "";

  const showLevel = Array.isArray(data) ? ((data as any).showLevel !== false) : (data?.showLevel !== false);

  if (showLevel) {
    const getActiveCount = (level: string): number => {
      switch (level) {
        case "Beginner": return 1;
        case "Intermediate": return 2;
        case "Advanced": return 3;
        case "Professional": return 4;
        case "Expert": return 5;
        default: return 3;
      }
    };

    return `<div class="skills-container variant-bars">${
      items.map((item: any) => {
        const activeCount = getActiveCount(item.level || "Advanced");
        const barsHtml = Array.from({ length: 5 }, (_, i) => 
          `<span class="level-bar${i < activeCount ? " active" : ""}"></span>`
        ).join("");

        return `
          <div class="skill-item-with-level">
            <span class="skill-name">${escapeHtml(item.name || '')}</span>
            <div class="skill-level-bars">
              ${barsHtml}
            </div>
          </div>
        `;
      }).join("")
    }</div>`;
  }

  // default badges
  return `<div class="skills-container variant-badges">${
    items.map((item: any) => {
      return `<span class="skill-badge">${escapeHtml(item.name || '')}</span>`;
    }).join("")
  }</div>`;
};

const renderProjects = (data: any, variant = "classic"): string => {
  if (!Array.isArray(data) || data.length === 0) return "";
  
  if (variant === "grid") {
    return `<div class="projects-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">${
      data.map((item: any) => `
        <div class="project-item variant-card" style="margin-bottom: 0;">
          <div class="item-header">
            <span class="item-title">${escapeHtml(item.name || '')} ${item.role ? `(${escapeHtml(item.role)})` : ''}</span>
            ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" class="project-link">Link</a>` : ''}
          </div>
          <div class="project-description">${compileMarkdown(item.description || '')}</div>
          ${item.technologies && item.technologies.length > 0 ? `
            <div class="tech-container">
              ${item.technologies.map((t: string) => `<span class="tech-badge">${escapeHtml(t)}</span>`).join("")}
            </div>
          ` : ''}
        </div>
      `).join("")
    }</div>`;
  }

  return data.map((item: any) => `
    <div class="project-item variant-classic">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.name || '')} ${item.role ? `(${escapeHtml(item.role)})` : ''}</span>
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" class="project-link">Link dự án</a>` : ''}
      </div>
      <div class="project-description">${compileMarkdown(item.description || '')}</div>
      ${item.technologies && item.technologies.length > 0 ? `
        <div class="tech-container">
          ${item.technologies.map((t: string) => `<span class="tech-badge">${escapeHtml(t)}</span>`).join("")}
        </div>
      ` : ''}
    </div>
  `).join("");
};

const SECTION_RENDERERS: Record<string, (data: any, variant?: string) => string> = {
  SUMMARY: renderSummary,
  EXPERIENCE: renderExperience,
  EDUCATION: renderEducation,
  SKILLS: renderSkills,
  PROJECTS: renderProjects,
};

// ─── Deterministic Rendering Cache Layer ───────────────────────────────────

export const DEFAULT_TEMPLATE: TemplateSchema = {
  id: "standard-ats",
  name: "Standard ATS",
  category: "BUSINESS",
  layout: {
    sections: [
      { type: "PROFILE", blocks: [] },
      { type: "SUMMARY", blocks: [] },
      { type: "EXPERIENCE", blocks: [] },
      { type: "EDUCATION", blocks: [] },
      { type: "SKILLS", blocks: [] },
      { type: "PROJECTS", blocks: [] },
    ]
  },
  layoutConfig: {
    layoutMode: "single-column",
    columns: {
      main: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
    },
    order: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS"],
    headerAlignment: "left",
    showAvatar: true,
    useTimeline: false,
    fullBleedHeader: false,
    fullPageBleed: false,
  },
  themeTokens: {
    primaryColor: "#1e293b",
    secondaryColor: "#475569",
    accentColor: "#3b82f6",
    dividerColor: "#cbd5e1",
    fontHeader: "'Merriweather', serif",
    fontBody: "'Inter', sans-serif",
    sidebarWidth: "30%",
    sectionGap: "20px",
    timelineBorderColor: "#e2e8f0",
    headerBackground: "transparent",
    headerTextColor: "#1e293b",
    sidebarBackground: "transparent",
    sidebarTextColor: "#334155",
    sidebarPadding: "0 16px 0 0",
  },
  sectionStyles: {
    experience: { variant: "classic" },
    education: { variant: "classic" },
    skills: { variant: "badges" },
    projects: { variant: "classic" },
  }
};

export const sanitizeAndValidateTemplate = (rawSchema: any): TemplateSchema => {
  const baseId = typeof rawSchema?.id === "string" ? rawSchema.id : "default";
  
  const parsedId = z.string().safeParse(rawSchema?.id);
  const parsedName = z.string().safeParse(rawSchema?.name);
  const parsedCategory = z.enum(["TECH", "BUSINESS", "DESIGN"]).safeParse(rawSchema?.category);
  const parsedLayout = z.any().safeParse(rawSchema?.layout);
  
  const layoutConfigParsed = LayoutConfigSchema.safeParse(rawSchema?.layoutConfig);
  const themeTokensParsed = ThemeTokensSchema.safeParse(rawSchema?.themeTokens);
  const sectionStylesParsed = SectionStylesSchema.safeParse(rawSchema?.sectionStyles);

  return {
    id: parsedId.success ? parsedId.data : DEFAULT_TEMPLATE.id,
    name: parsedName.success ? parsedName.data : DEFAULT_TEMPLATE.name,
    category: parsedCategory.success ? parsedCategory.data : DEFAULT_TEMPLATE.category,
    layout: parsedLayout.success ? parsedLayout.data : DEFAULT_TEMPLATE.layout,
    layoutConfig: layoutConfigParsed.success ? layoutConfigParsed.data : getLayoutConfig(baseId),
    themeTokens: themeTokensParsed.success ? themeTokensParsed.data : getTemplateStyles(baseId),
    sectionStyles: sectionStylesParsed.success ? sectionStylesParsed.data : {
      experience: { variant: "classic" },
      education: { variant: "classic" },
      skills: { variant: "badges" },
      projects: { variant: "classic" }
    },
    thumbnailUrl: typeof rawSchema?.thumbnailUrl === "string" ? rawSchema.thumbnailUrl : undefined,
  };
};

const getHashCode = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString(36);
};

const renderCache = new Map<string, string>();

export const renderHtml = (input: RenderInput): string => {
  const validatedTemplate = sanitizeAndValidateTemplate(input.template);

  const hashKey = getHashCode(JSON.stringify({
    templateId: validatedTemplate.id,
    templateSchema: validatedTemplate,
    data: input.data,
    localFontsDir: input.localFontsDir,
  }));

  if (renderCache.has(hashKey)) {
    return renderCache.get(hashKey)!;
  }

  const result = renderHtmlDirect({
    ...input,
    template: validatedTemplate,
  });
  
  if (renderCache.size >= 100) {
    const firstKey = renderCache.keys().next().value;
    if (firstKey) renderCache.delete(firstKey);
  }
  renderCache.set(hashKey, result);
  return result;
};

// ─── Core Compilation Pipeline ─────────────────────────────────────────────

const renderHtmlDirect = ({ template, data, localFontsDir }: RenderInput): string => {
  // 1. Stage 1: Data Validation & Normalization
  const validatedTemplate = TemplateSchemaZod.parse(template);
  const normalized = normalizeData(data);

  let styles = validatedTemplate.themeTokens || getTemplateStyles(validatedTemplate.id);
  if (data.theme && typeof data.theme === "object") {
    const themeOverrides = data.theme as any;
    if (themeOverrides.primaryColor) {
      styles.primaryColor = themeOverrides.primaryColor;
    }
    if (themeOverrides.accentColor) {
      styles.accentColor = themeOverrides.accentColor;
      styles.dividerColor = themeOverrides.accentColor;
      styles.timelineBorderColor = themeOverrides.accentColor;
    }
  }
  try {
    styles = ThemeTokensSchema.parse(styles);
  } catch (err) {
    console.warn("Theme validation failed, using defaults:", err);
    styles = ThemeTokensSchema.parse(getTemplateStyles("default"));
  }

  let layout = validatedTemplate.layoutConfig || getLayoutConfig(validatedTemplate.id);
  try {
    layout = LayoutConfigSchema.parse(layout);
  } catch (err) {
    console.warn("Layout validation failed, using defaults:", err);
    layout = LayoutConfigSchema.parse(getLayoutConfig("default"));
  }

  const sectionStyles = validatedTemplate.sectionStyles || {
    experience: { variant: "classic" },
    education: { variant: "classic" },
    skills: { variant: "badges" },
    projects: { variant: "classic" },
  };

  // 2. Stage 2: Render Profile Block
  const profile = normalized.profile;
  const fullName = profile.fullName;
  const title = profile.title;
  const email = profile.email;
  const phone = profile.phone;
  const linkedin = profile.linkedin;
  const github = profile.github;
  const website = profile.website;
  const avatarUrl = profile.avatarUrl;
  const address = profile.address;
  const city = profile.city;

  const contacts: string[] = [];
  if (phone) contacts.push(`<span class="contact-item">📞 ${escapeHtml(phone)}</span>`);
  if (email) contacts.push(`<span class="contact-item">✉️ ${escapeHtml(email)}</span>`);
  
  const displayAddress = [address, city].filter(Boolean).join(", ");
  if (displayAddress) contacts.push(`<span class="contact-item">📍 ${escapeHtml(displayAddress)}</span>`);
  
  if (linkedin) contacts.push(`<span class="contact-item">🔗 <a href="${escapeHtml(ensureAbsoluteUrl(linkedin))}" target="_blank">${escapeHtml(getDisplayUrl(linkedin))}</a></span>`);
  if (github) contacts.push(`<span class="contact-item">💻 <a href="${escapeHtml(ensureAbsoluteUrl(github))}" target="_blank">${escapeHtml(getDisplayUrl(github))}</a></span>`);
  if (website) contacts.push(`<span class="contact-item">🌐 <a href="${escapeHtml(ensureAbsoluteUrl(website))}" target="_blank">${escapeHtml(getDisplayUrl(website))}</a></span>`);

  const contactBar = contacts.length > 0
    ? `<div class="contact-bar">${contacts.join(" | ")}</div>`
    : "";

  const avatarHtml = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" class="profile-avatar" alt="Avatar" />`
    : "";

  const profileHeader = `
    <header class="profile-header">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 24px;">
        <div style="flex: 1;">
          <h1 class="profile-name">${escapeHtml(fullName || "Họ tên ứng viên")}</h1>
          ${title ? `<h2 class="profile-title">${escapeHtml(title)}</h2>` : ""}
          ${contactBar}
        </div>
        ${avatarHtml}
      </div>
    </header>
  `;

  const isSidebarHeader = (layout.layoutMode === "sidebar-left" || layout.layoutMode === "sidebar-right") && layout.fullPageBleed;

  const profileHeaderSidebar = `
    <div class="profile-header-sidebar">
      ${avatarHtml}
      <h1 class="profile-name" style="margin-top: 0;">${escapeHtml(fullName || "Họ tên ứng viên")}</h1>
      ${title ? `<h2 class="profile-title">${escapeHtml(title)}</h2>` : ""}
      <div class="contact-bar-sidebar" style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
        ${contacts.map(c => `<div>${c}</div>`).join("")}
      </div>
    </div>
  `;

  // Helper mapping system sections to dynamic registry
  const getSectionTitle = (type: string): string => {
    const titleMap: Record<string, string> = {
      SUMMARY: "Giới thiệu",
      EXPERIENCE: "Kinh nghiệm làm việc",
      EDUCATION: "Học vấn & Bằng cấp",
      SKILLS: "Kỹ năng chuyên môn",
      PROJECTS: "Dự án tiêu biểu"
    };
    return titleMap[type] || type;
  };

  const renderSectionNode = (type: string): string => {
    const renderer = SECTION_RENDERERS[type];
    if (!renderer) return "";
    
    // Get correct variant from sectionStyles
    let variant = "classic";
    if (type === "EXPERIENCE" && sectionStyles.experience?.variant) variant = sectionStyles.experience.variant;
    if (type === "EDUCATION" && sectionStyles.education?.variant) variant = sectionStyles.education.variant;
    if (type === "SKILLS" && sectionStyles.skills?.variant) variant = sectionStyles.skills.variant;
    if (type === "PROJECTS" && sectionStyles.projects?.variant) variant = sectionStyles.projects.variant;

    const contentHtml = renderer(normalized[type.toLowerCase()], variant);
    if (!contentHtml) return "";

    return `
      <section class="section section-${type.toLowerCase()}">
        <h3 class="section-title">${escapeHtml(getSectionTitle(type))}</h3>
        <div class="section-content">${contentHtml}</div>
      </section>
    `;
  };

  // 3. Stage 3 & 4: Dynamic Layout Layouting & Assembly
  let bodyHtml = "";
  if (layout.layoutMode === "sidebar-left") {
    const sidebarItems = layout.columns.sidebar || [];
    const mainItems = layout.columns.main || [];

    const sidebarHtml = layout.order
      .filter(type => sidebarItems.includes(type))
      .map(type => renderSectionNode(type))
      .join("");

    const mainHtml = layout.order
      .filter(type => mainItems.includes(type))
      .map(type => renderSectionNode(type))
      .join("");

    bodyHtml = `
      ${isSidebarHeader ? "" : profileHeader}
      <div class="resume-container">
        <div class="sidebar">
          ${isSidebarHeader ? profileHeaderSidebar : ""}
          ${sidebarHtml}
        </div>
        <div class="main-content">
          ${mainHtml}
        </div>
      </div>
    `;
  } else if (layout.layoutMode === "sidebar-right") {
    const sidebarItems = layout.columns.sidebar || [];
    const mainItems = layout.columns.main || [];

    const sidebarHtml = layout.order
      .filter(type => sidebarItems.includes(type))
      .map(type => renderSectionNode(type))
      .join("");

    const mainHtml = layout.order
      .filter(type => mainItems.includes(type))
      .map(type => renderSectionNode(type))
      .join("");

    bodyHtml = `
      ${isSidebarHeader ? "" : profileHeader}
      <div class="resume-container sidebar-right">
        <div class="main-content">
          ${mainHtml}
        </div>
        <div class="sidebar">
          ${isSidebarHeader ? profileHeaderSidebar : ""}
          ${sidebarHtml}
        </div>
      </div>
    `;
  } else {
    // Stacked and minimalist sequential rendering
    const sectionsHtml = layout.order
      .map(type => renderSectionNode(type))
      .join("");

    bodyHtml = `
      ${profileHeader}
      <div class="resume-sections-container">
        ${sectionsHtml}
      </div>
    `;
  }

  // 4. Stage 5: Theme Processing & Stylesheet injection
  const fontCss = localFontsDir
    ? `
      @font-face {
        font-family: 'Inter';
        src: url('file://${localFontsDir}/Inter.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Merriweather';
        src: url('file://${localFontsDir}/Merriweather.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Playfair Display';
        src: url('file://${localFontsDir}/PlayfairDisplay.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Manrope';
        src: url('file://${localFontsDir}/Manrope.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Plus Jakarta Sans';
        src: url('file://${localFontsDir}/PlusJakartaSans.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      @font-face {
        font-family: 'Cormorant Garamond';
        src: url('file://${localFontsDir}/CormorantGaramond.ttf') format('truetype');
        font-weight: 400 700;
        font-style: normal;
      }
      `
    : `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Plus+Jakarta+Sans:ital,wght@0,400;0,700;1,400&display=swap');
      `;

  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>BetterCV Document Preview</title>
    <style>
      ${fontCss}
      
      :root {
        --primary-color: ${styles.primaryColor};
        --secondary-color: ${styles.secondaryColor};
        --accent-color: ${styles.accentColor};
        --divider-color: ${styles.dividerColor};
        --font-header: ${styles.fontHeader};
        --font-body: ${styles.fontBody};
        
        --sidebar-width: ${styles.sidebarWidth};
        --section-gap: ${styles.sectionGap};
        --timeline-border-color: ${styles.timelineBorderColor};
        --header-background: ${styles.headerBackground};
        --header-text-color: ${styles.headerTextColor};
        
        --sidebar-background: ${styles.sidebarBackground || "transparent"};
        --sidebar-text-color: ${styles.sidebarTextColor || "#334155"};
        --sidebar-padding: ${styles.sidebarPadding || "0 16px 0 0"};
      }
      
      body {
        font-family: var(--font-body);
        color: #334155;
        line-height: 1.5;
        font-size: 11.5px;
        margin: 0;
        padding: 40px;
        background-color: #ffffff;
        -webkit-font-smoothing: antialiased;
      }
      
      /* Profile Header */
      .profile-header {
        margin-bottom: 24px;
        border-bottom: 2px solid var(--divider-color);
        padding-bottom: 12px;
        background-color: var(--header-background);
        color: var(--header-text-color);
      }
      
      .profile-name {
        font-family: var(--font-header);
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-color);
        margin: 0 0 4px 0;
      }
      .profile-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin: 0 0 8px 0;
      }
      .contact-bar {
        font-size: 10.5px;
        color: #475569;
        margin-top: 4px;
      }
      .contact-item {
        display: inline-block;
      }
      .contact-item a {
        color: #475569;
        text-decoration: none;
      }
      .contact-item a:hover {
        color: var(--accent-color);
        text-decoration: underline;
      }
      .profile-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid var(--primary-color);
      }
      
      /* Sections styling */
      .section {
        margin-bottom: var(--section-gap);
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .section-title {
        font-family: var(--font-header);
        color: var(--primary-color);
        font-size: 12.5px;
        font-weight: 700;
        text-transform: uppercase;
        border-bottom: 1.5px solid var(--divider-color);
        padding-bottom: 2px;
        margin: 0 0 8px 0;
        letter-spacing: 0.5px;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      /* Items and Timelines with explicit Print Constraints */
      .experience-item, .education-item, .project-item {
        margin-bottom: 8px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      .item-header {
        display: flex;
        justify-content: space-between;
        font-weight: 600;
        color: #0f172a;
        font-size: 11.5px;
      }
      
      .item-title {
        color: #0f172a;
        font-weight: 600;
      }
      .item-date {
        font-weight: 400;
        color: #64748b;
        font-size: 10.5px;
      }
      .item-subtitle {
        display: flex;
        justify-content: space-between;
        font-size: 10.5px;
        color: #475569;
        font-style: italic;
        margin-top: 1px;
        margin-bottom: 3px;
      }
      
      .item-description, .project-description {
        font-size: 11px;
        color: #334155;
      }
      .item-description p, .project-description p {
        margin: 0 0 4px 0;
      }
      .item-description ul, .project-description ul {
        margin: 2px 0 4px 0;
        padding-left: 16px;
      }
      .item-description li, .project-description li {
        margin-bottom: 2px;
      }
      
      /* Skills and badges */
      .skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 24px;
      }
      .skill-badge {
        background-color: var(--sidebar-background, #f8fafc);
        color: var(--sidebar-text-color, #334155);
        font-size: 10.5px;
        font-weight: 500;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--divider-color);
      }
      .skill-item-with-level {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 140px;
        margin-bottom: 6px;
      }
      .skill-name {
        font-size: 11.5px;
        font-weight: 600;
        color: #1e293b;
      }
      .skill-level-bars {
        display: flex;
        gap: 3.5px;
      }
      .level-bar {
        width: 22px;
        height: 3.5px;
        border-radius: 1px;
        background-color: #e2e8f0;
      }
      .level-bar.active {
        background-color: var(--primary-color, #475569);
      }
      
      /* Projects link */
      .project-link {
        color: var(--accent-color);
        text-decoration: underline;
        font-size: 10.5px;
      }
      .tech-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }
      .tech-badge {
        font-size: 9.5px;
        background-color: #f1f5f9;
        color: #475569;
        padding: 1px 4px;
        border-radius: 2px;
        font-weight: 500;
        border: 1px solid var(--divider-color);
      }

      /* Dynamic Split Sidebar Columns */
      .resume-container {
        display: flex;
        gap: 24px;
      }
      .resume-container.sidebar-right {
        flex-direction: row-reverse;
      }
      .sidebar {
        width: var(--sidebar-width);
        background-color: var(--sidebar-background);
        color: var(--sidebar-text-color);
        padding: var(--sidebar-padding);
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-sizing: border-box;
      }
      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .sidebar .section-title {
        color: var(--sidebar-text-color);
        border-bottom: 1.5px solid var(--divider-color);
        margin-top: 16px;
      }
      
      /* Variant timeline style overrides */
      .variant-timeline {
        border-left: 2px solid var(--timeline-border-color);
        padding-left: 10px;
        margin-left: 4px;
        position: relative;
      }
      .timeline-style .section-title {
        border-bottom: none;
        background: #f1f5f9;
        padding: 4px 8px;
        border-radius: 4px;
      }

      /* Variant card style overrides */
      .variant-card {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        padding: 12px;
        background-color: #f8fafc;
        margin-bottom: 12px;
      }

      /* Variant minimal style overrides */
      .variant-minimal {
        margin-bottom: 4px;
      }

      /* Full Bleed Header (like Dublin) */
      .full-bleed-header .profile-header {
        background-color: var(--primary-color);
        color: #ffffff;
        margin: -40px -40px 24px -40px;
        padding: 28px 40px;
        border-bottom: none;
      }
      .full-bleed-header .profile-name {
        color: #ffffff;
      }
      .full-bleed-header .profile-title {
        color: var(--accent-color);
        filter: brightness(1.3);
      }
      .full-bleed-header .contact-bar {
        color: rgba(255, 255, 255, 0.8);
      }
      .full-bleed-header .contact-item a {
        color: rgba(255, 255, 255, 0.8);
      }

      /* Full Page Bleed (like Design Classic) */
      .full-page-bleed-style {
        padding: 0 !important;
      }
      .full-page-bleed-style .resume-container {
        display: flex;
        gap: 0;
        min-height: 1056px;
      }
      .full-page-bleed-style .sidebar {
        width: 36%;
        padding: 40px 24px;
        border-right: none;
      }
      .full-page-bleed-style .sidebar .profile-name {
        color: #ffffff;
        font-size: 18px;
        margin-bottom: 6px;
        font-family: var(--font-header);
      }
      .full-page-bleed-style .sidebar .profile-title {
        color: rgba(255, 255, 255, 0.85);
        font-size: 11px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.25);
        padding-bottom: 8px;
        margin-bottom: 16px;
      }
      .full-page-bleed-style .main-content {
        flex: 1;
        padding: 40px 32px;
        box-sizing: border-box;
      }

      /* Strict A4 Print-safe Rules */
      @media print {
        body { 
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .section {
          page-break-inside: avoid;
          break-inside: avoid;
          orphans: 2;
          widows: 2;
        }
        .item-header {
          page-break-after: avoid;
          break-after: avoid;
        }
      }
    </style>
  </head>
  <body class="template-${template.id} ${layout.fullBleedHeader ? 'full-bleed-header' : ''} ${layout.fullPageBleed ? 'full-page-bleed-style' : ''}">
    ${bodyHtml}
    <script>
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_HTML') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(event.data.html, 'text/html');
          document.body.className = doc.body.className;
          document.body.innerHTML = doc.body.innerHTML;
          
          const newStyles = doc.querySelectorAll('style');
          const head = document.head;
          const oldStyles = head.querySelectorAll('style');
          oldStyles.forEach(s => s.remove());
          newStyles.forEach(s => head.appendChild(s.cloneNode(true)));
        }
      });
    </script>
  </body>
</html>`;
};
