import { z } from "zod";
import {
  DEFAULT_TEMPLATE_ID,
  DEFAULT_TEMPLATE_REGISTRY_ENTRY,
} from "@acv/shared";

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
  languages: [
    { id: "lang_1", name: "Tiếng Việt", level: "Native" },
    { id: "lang_2", name: "English", level: "Professional" },
  ],
  certifications: [
    {
      id: "cert_1",
      name: "AWS Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-08",
    },
    {
      id: "cert_2",
      name: "CKA: Certified Kubernetes Administrator",
      issuer: "CNCF",
      date: "2022-11",
    },
  ],
  awards: [
    {
      id: "award_1",
      title: "Engineering Excellence Award",
      issuer: "TechCorp Vietnam",
      date: "2024-01",
      description: "Dẫn dắt migration event-driven giảm 60ms latency hệ thống.",
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
  locale?: string;
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
    renderOptions: {
      hiddenSections: Array.isArray(profile.renderOptions?.hiddenSections)
        ? profile.renderOptions.hiddenSections.map((section: unknown) => String(section))
        : [],
      hiddenBlocks: Array.isArray(profile.renderOptions?.hiddenBlocks)
        ? profile.renderOptions.hiddenBlocks.map((block: unknown) => String(block))
        : [],
      sectionVariants:
        profile.renderOptions?.sectionVariants &&
        typeof profile.renderOptions.sectionVariants === "object"
          ? Object.fromEntries(
              Object.entries(profile.renderOptions.sectionVariants).map(([key, value]) => [
                String(key).toUpperCase(),
                String(value),
              ]),
            )
          : {},
    },
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

  normalized.contact = normalized.profile;

  const rawLanguages = data.languages || [];
  const languageItems = Array.isArray(rawLanguages) ? rawLanguages : (rawLanguages.items || []);
  normalized.languages = languageItems.map((item: any) => ({
    id: item.id || `lang_${Math.random()}`,
    name: (item.name || "").trim(),
    level: (item.level || "").trim(),
  }));

  const rawCerts = data.certifications || [];
  const certItems = Array.isArray(rawCerts) ? rawCerts : (rawCerts.items || []);
  normalized.certifications = certItems.map((item: any) => ({
    id: item.id || `cert_${Math.random()}`,
    name: (item.name || item.title || "").trim(),
    issuer: (item.issuer || item.organization || "").trim(),
    date: (item.date || "").trim(),
    url: stripUnsafeUrls(item.url || ""),
  }));

  const rawAwards = data.awards || [];
  const awardItems = Array.isArray(rawAwards) ? rawAwards : (rawAwards.items || []);
  normalized.awards = awardItems.map((item: any) => ({
    id: item.id || `award_${Math.random()}`,
    title: (item.title || item.name || "").trim(),
    issuer: (item.issuer || item.organization || "").trim(),
    date: (item.date || "").trim(),
    description: (item.description || "").trim(),
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
    case "ironclad-ats":
      return {
        ...defaults,
        primaryColor: "#000000",
        secondaryColor: "#1e293b",
        accentColor: "#0f172a",
        dividerColor: "#94a3b8",
        fontHeader: "'Georgia', serif",
      };
    case "synergy-pro":
      return {
        ...defaults,
        primaryColor: "#1e1b4b",
        secondaryColor: "#312e81",
        accentColor: "#dc2626", // Elegant red details
        dividerColor: "#dc2626",
        fontHeader: "'Outfit', sans-serif",
        sidebarBackground: "#f5f5f4",
        sidebarTextColor: "#1e293b",
        sidebarWidth: "30%",
      };
    case "pinnacle-executive":
      return {
        ...defaults,
        primaryColor: "#ffffff",
        secondaryColor: "#e2e8f0",
        accentColor: "#d97706", // Gold accent
        dividerColor: "#d97706",
        fontHeader: "'Cormorant Garamond', serif",
        fontBody: "'Georgia', serif",
        sidebarBackground: "#4a3728", // Solid Dark Brown
        sidebarTextColor: "#fafafa",
        sidebarWidth: "35%",
      };
    case "chronos-modern":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#ec4899", // Rose border ring accent
        dividerColor: "#fbcfe8",
        fontHeader: "'Outfit', sans-serif",
        fontBody: "'Plus Jakarta Sans', sans-serif",
      };
    case "strategy-pro":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#2563eb",
        dividerColor: "#2563eb",
        fontHeader: "'Outfit', sans-serif",
        fontBody: "'Plus Jakarta Sans', sans-serif",
        timelineBorderColor: "#2563eb",
      };
    case "block-minimalist":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#475569",
        dividerColor: "#e2e8f0",
        fontHeader: "'JetBrains Mono', monospace",
      };
    case "linear-tech":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#2563eb",
        dividerColor: "#cbd5e1",
        fontHeader: "'Geist Sans', sans-serif",
        fontBody: "'Geist Sans', sans-serif",
        headerBackground: "#f8fafc",
        headerTextColor: "#0f172a",
      };
    case "ai-builder":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#10b981", // Cyber Emerald
        dividerColor: "#bae6d0",
        fontHeader: "'Fira Code', monospace",
        sidebarWidth: "35%",
      };
    case "neo-gradient":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#8b5cf6", // Neon purple/pink glow
        dividerColor: "#ec4899",
        fontHeader: "'Outfit', sans-serif",
        fontBody: "'Outfit', sans-serif",
      };
    case "glass-resume":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#0ea5e9",
        dividerColor: "#cbd5e1",
        fontHeader: "'Geist Sans', sans-serif",
        fontBody: "'Geist Sans', sans-serif",
      };
    case "card-stack":
      return {
        ...defaults,
        primaryColor: "#0f172a",
        secondaryColor: "#475569",
        accentColor: "#7c3aed",
        dividerColor: "#e2e8f0",
        fontHeader: "'Plus Jakarta Sans', sans-serif",
        fontBody: "'Plus Jakarta Sans', sans-serif",
      };
    case "startup-operator":
      return {
        ...defaults,
        primaryColor: "#1e293b",
        secondaryColor: "#475569",
        accentColor: "#ff6600", // YC Orange
        dividerColor: "#ff8833",
        fontHeader: "'Geist Sans', sans-serif",
        sidebarWidth: "30%",
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
    case "synergy-pro":
      return {
        ...defaults,
        layoutMode: "sidebar-left",
        columns: {
          sidebar: ["CONTACT", "SKILLS", "EDUCATION", "LANGUAGES"],
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "CONTACT", "SKILLS", "EDUCATION", "LANGUAGES"],
        fullPageBleed: true,
      };
    case "pinnacle-executive":
      return {
        ...defaults,
        layoutMode: "sidebar-left",
        columns: {
          sidebar: ["CONTACT", "EDUCATION", "CERTIFICATIONS"],
          main: ["SUMMARY", "EXPERIENCE", "AWARDS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "AWARDS", "CONTACT", "EDUCATION", "CERTIFICATIONS"],
        fullPageBleed: true,
      };
    case "ai-builder":
      return {
        ...defaults,
        layoutMode: "sidebar-right",
        columns: {
          sidebar: ["SKILLS", "EDUCATION", "CERTIFICATIONS"],
          main: ["SUMMARY", "PROJECTS", "EXPERIENCE"],
        },
        order: ["SUMMARY", "PROJECTS", "EXPERIENCE", "SKILLS", "EDUCATION", "CERTIFICATIONS"],
      };
    case "startup-operator":
      return {
        ...defaults,
        layoutMode: "sidebar-right",
        columns: {
          sidebar: ["SKILLS", "EDUCATION"],
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"],
      };
    case "block-minimalist":
      return {
        ...defaults,
        layoutMode: "minimal",
        columns: {
          main: ["SUMMARY", "EDUCATION", "PROJECTS", "EXPERIENCE", "SKILLS"],
        },
        order: ["SUMMARY", "EDUCATION", "PROJECTS", "EXPERIENCE", "SKILLS"],
      };
    case "strategy-pro":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "EDUCATION", "SKILLS"],
        useTimeline: true,
      };
    case "ironclad-ats":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "CERTIFICATIONS"],
      };
    case "chronos-modern":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION"],
      };
    case "neo-gradient":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "PROJECTS", "EXPERIENCE", "EDUCATION", "SKILLS"],
        },
        order: ["SUMMARY", "PROJECTS", "EXPERIENCE", "EDUCATION", "SKILLS"],
      };
    case "linear-tech":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION", "CERTIFICATIONS"],
        },
        order: ["EXPERIENCE", "PROJECTS", "SKILLS", "EDUCATION", "CERTIFICATIONS"],
      };
    case "card-stack":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "SKILLS", "EDUCATION", "PROJECTS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "SKILLS", "EDUCATION", "PROJECTS"],
      };
    case "glass-resume":
      return {
        ...defaults,
        layoutMode: "single-column",
        columns: {
          main: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS"],
        },
        order: ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS"],
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

export const getTemplateSectionStyles = (templateId: string): NonNullable<SectionStyles> => {
  switch (templateId) {
    case "ironclad-ats":
      return {
        experience: { variant: "minimal" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
    case "strategy-pro":
      return {
        experience: { variant: "timeline" },
        education: { variant: "timeline" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
    case "block-minimalist":
      return {
        experience: { variant: "card" },
        education: { variant: "minimal" },
        skills: { variant: "bars" },
        projects: { variant: "classic" },
      };
    case "chronos-modern":
      return {
        experience: { variant: "classic" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "grid" },
      };
    case "startup-operator":
      return {
        experience: { variant: "minimal" },
        education: { variant: "classic" },
        skills: { variant: "columns" },
        projects: { variant: "grid" },
      };
    case "pinnacle-executive":
      return {
        experience: { variant: "timeline" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
    case "linear-tech":
      return {
        experience: { variant: "minimal" },
        education: { variant: "minimal" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
    case "ai-builder":
      return {
        experience: { variant: "card" },
        education: { variant: "classic" },
        skills: { variant: "columns" },
        projects: { variant: "grid" },
      };
    case "card-stack":
      return {
        experience: { variant: "card" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "grid" },
      };
    case "neo-gradient":
      return {
        experience: { variant: "timeline" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "grid" },
      };
    case "glass-resume":
      return {
        experience: { variant: "card" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "grid" },
      };
    case "synergy-pro":
      return {
        experience: { variant: "classic" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
    default:
      return {
        experience: { variant: "classic" },
        education: { variant: "classic" },
        skills: { variant: "badges" },
        projects: { variant: "classic" },
      };
  }
};

export type TemplateBlock = { key: string; label: string };
export type TemplateSectionLayout = { type: string; blocks: TemplateBlock[] };

const PROFILE_BLOCKS: TemplateBlock[] = [
  { key: "profile.fullName", label: "Họ và tên" },
  { key: "profile.title", label: "Chức danh" },
  { key: "profile.email", label: "Email" },
  { key: "profile.phone", label: "Số điện thoại" },
  { key: "profile.linkedin", label: "LinkedIn" },
  { key: "profile.github", label: "GitHub" },
  { key: "profile.website", label: "Website" },
];

const CONTACT_BLOCKS: TemplateBlock[] = [
  { key: "profile.phone", label: "SĐT" },
  { key: "profile.email", label: "Email" },
  { key: "profile.address", label: "Địa chỉ" },
  { key: "profile.linkedin", label: "LinkedIn" },
  { key: "profile.github", label: "GitHub" },
  { key: "profile.website", label: "Website" },
];

const DEFAULT_SECTION_BLOCKS: Record<string, TemplateBlock[]> = {
  PROFILE: PROFILE_BLOCKS,
  SUMMARY: [{ key: "summary.text", label: "Giới thiệu" }],
  CONTACT: CONTACT_BLOCKS,
  EXPERIENCE: [{ key: "experience", label: "Kinh nghiệm làm việc" }],
  EDUCATION: [{ key: "education", label: "Học vấn & Bằng cấp" }],
  SKILLS: [{ key: "skills", label: "Kỹ năng chuyên môn" }],
  PROJECTS: [{ key: "projects", label: "Dự án tiêu biểu" }],
  LANGUAGES: [{ key: "languages", label: "Ngôn ngữ" }],
  CERTIFICATIONS: [{ key: "certifications", label: "Chứng chỉ" }],
  AWARDS: [{ key: "awards", label: "Giải thưởng" }],
};

const TEMPLATE_SECTION_BLOCK_OVERRIDES: Record<string, Partial<Record<string, TemplateBlock[]>>> = {
  "block-minimalist": {
    SKILLS: [
      { key: "skills", label: "Kỹ năng" },
    ],
  },
  "startup-operator": {
    PROJECTS: [{ key: "projects", label: "Sản phẩm & Dự án" }],
  },
  "pinnacle-executive": {
    AWARDS: [{ key: "awards", label: "Thành tựu nổi bật" }],
  },
};

export const getSectionBlocks = (templateId: string, sectionType: string): TemplateBlock[] => {
  const override = TEMPLATE_SECTION_BLOCK_OVERRIDES[templateId]?.[sectionType];
  if (override) return override;
  return DEFAULT_SECTION_BLOCKS[sectionType] || [{ key: sectionType.toLowerCase(), label: sectionType }];
};

export const getTemplateLayout = (templateId: string): { sections: TemplateSectionLayout[] } => {
  const layoutConfig = getLayoutConfig(templateId);
  const columnSections = new Set([
    ...(layoutConfig.columns.main || []),
    ...(layoutConfig.columns.sidebar || []),
  ]);

  const orderedSectionTypes = layoutConfig.order.filter((type) => columnSections.has(type));

  return {
    sections: [
      { type: "PROFILE", blocks: getSectionBlocks(templateId, "PROFILE") },
      ...orderedSectionTypes.map((type) => ({
        type,
        blocks: getSectionBlocks(templateId, type),
      })),
    ],
  };
};

const mergeTemplateLayout = (
  parsedLayout: { sections?: TemplateSectionLayout[] } | null | undefined,
  templateId: string,
): { sections: TemplateSectionLayout[] } => {
  const canonical = getTemplateLayout(templateId);
  if (!parsedLayout?.sections?.length) return canonical;

  const canonicalByType = new Map(canonical.sections.map((section) => [section.type, section]));
  const parsedByType = new Map(parsedLayout.sections.map((section) => [section.type, section]));

  const mergedSections: TemplateSectionLayout[] = [];

  for (const section of canonical.sections) {
    const existing = parsedByType.get(section.type);
    mergedSections.push(
      existing?.blocks?.length
        ? { type: section.type, blocks: existing.blocks }
        : section,
    );
  }

  for (const section of parsedLayout.sections) {
    if (!canonicalByType.has(section.type)) {
      mergedSections.push(section);
    }
  }

  return { sections: mergedSections };
};

// ─── Componentized Section Renderers ────────────────────────────────────────

const renderSummary = (data: any, variant = "classic"): string => {
  if (!data || !data.text) return "";
  return `<div class="summary-text">${compileMarkdown(data.text)}</div>`;
};

const renderExperience = (data: any, variant = "classic", locale = "vi"): string => {
  if (!Array.isArray(data) || data.length === 0) return "";
  const presentLabel = locale === "en" ? "Present" : "Hiện tại";
  return data.map((item: any) => `
    <div class="experience-item variant-${variant}">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.position || '')}</span>
        <span class="item-date">${escapeHtml(item.startDate || '')} - ${item.current ? presentLabel : escapeHtml(item.endDate || '')}</span>
      </div>
      <div class="item-subtitle">
        <span>${escapeHtml(item.company || '')} ${item.location ? `| ${escapeHtml(item.location)}` : ''}</span>
      </div>
      <div class="item-description">${compileMarkdown(item.description || '')}</div>
    </div>
  `).join("");
};

const renderEducation = (data: any, variant = "classic", locale = "vi"): string => {
  if (!Array.isArray(data) || data.length === 0) return "";
  const presentLabel = locale === "en" ? "Present" : "Hiện tại";
  const fieldLabel = locale === "en" ? "Major" : "Chuyên ngành";
  return data.map((item: any) => `
    <div class="education-item variant-${variant}">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.institution || '')}</span>
        <span class="item-date">${escapeHtml(item.startDate || '')} - ${item.current ? presentLabel : escapeHtml(item.endDate || '')}</span>
      </div>
      <div class="item-subtitle">
        <span>${escapeHtml(item.degree || '')} ${item.fieldOfStudy ? `| ${fieldLabel}: ${escapeHtml(item.fieldOfStudy)}` : ''}</span>
        ${item.gpa ? `<span style="font-weight: 500; color: var(--accent-color);">GPA: ${escapeHtml(item.gpa)}</span>` : ''}
      </div>
    </div>
  `).join("");
};

const renderSkills = (data: any, variant = "badges"): string => {
  const items = Array.isArray(data) ? data : (data?.items || []);
  if (items.length === 0) return "";

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

  if (variant === "bars") {
    return `<div class="skills-container variant-bars">${
      items.map((item: any) => {
        const activeCount = getActiveCount(item.level || "Advanced");
        const barsHtml = Array.from({ length: 5 }, (_, i) =>
          `<span class="level-bar${i < activeCount ? " active" : ""}"></span>`
        ).join("");

        return `
          <div class="skill-item-with-level">
            <span class="skill-name">${escapeHtml(item.name || "")}</span>
            <div class="skill-level-bars">
              ${barsHtml}
            </div>
          </div>
        `;
      }).join("")
    }</div>`;
  }

  if (variant === "columns") {
    return `<div class="skills-container variant-columns">${
      items.map((item: any) => `
        <div class="skill-column-item">
          <span class="skill-name">${escapeHtml(item.name || "")}</span>
          ${item.level ? `<span class="skill-level-label">${escapeHtml(item.level)}</span>` : ""}
        </div>
      `).join("")
    }</div>`;
  }

  return `<div class="skills-container variant-badges">${
    items.map((item: any) => `<span class="skill-badge">${escapeHtml(item.name || "")}</span>`).join("")
  }</div>`;
};

const renderContact = (profile: any, _variant = "classic", locale = "vi"): string => {
  if (!profile || typeof profile !== "object") return "";

  const rows: string[] = [];
  const labels = locale === "en"
    ? { phone: "Phone", email: "Email", address: "Address", linkedin: "LinkedIn", github: "GitHub", website: "Website" }
    : { phone: "SĐT", email: "Email", address: "Địa chỉ", linkedin: "LinkedIn", github: "GitHub", website: "Website" };

  if (profile.phone) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.phone}</span><span class="contact-value">${escapeHtml(profile.phone)}</span></div>`);
  }
  if (profile.email) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.email}</span><span class="contact-value">${escapeHtml(profile.email)}</span></div>`);
  }

  const displayAddress = [profile.address, profile.city].filter(Boolean).join(", ");
  if (displayAddress) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.address}</span><span class="contact-value">${escapeHtml(displayAddress)}</span></div>`);
  }
  if (profile.linkedin) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.linkedin}</span><span class="contact-value"><a href="${escapeHtml(ensureAbsoluteUrl(profile.linkedin))}" target="_blank">${escapeHtml(getDisplayUrl(profile.linkedin))}</a></span></div>`);
  }
  if (profile.github) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.github}</span><span class="contact-value"><a href="${escapeHtml(ensureAbsoluteUrl(profile.github))}" target="_blank">${escapeHtml(getDisplayUrl(profile.github))}</a></span></div>`);
  }
  if (profile.website) {
    rows.push(`<div class="contact-row"><span class="contact-label">${labels.website}</span><span class="contact-value"><a href="${escapeHtml(ensureAbsoluteUrl(profile.website))}" target="_blank">${escapeHtml(getDisplayUrl(profile.website))}</a></span></div>`);
  }

  if (rows.length === 0) return "";
  return `<div class="contact-list">${rows.join("")}</div>`;
};

const renderLanguages = (data: any): string => {
  const items = Array.isArray(data) ? data : (data?.items || []);
  if (items.length === 0) return "";

  return items.map((item: any) => `
    <div class="language-item">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.name || "")}</span>
        ${item.level ? `<span class="item-date">${escapeHtml(item.level)}</span>` : ""}
      </div>
    </div>
  `).join("");
};

const renderCertifications = (data: any): string => {
  const items = Array.isArray(data) ? data : (data?.items || []);
  if (items.length === 0) return "";

  return items.map((item: any) => `
    <div class="certification-item">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.name || "")}</span>
        ${item.date ? `<span class="item-date">${escapeHtml(item.date)}</span>` : ""}
      </div>
      ${item.issuer ? `<div class="item-subtitle">${escapeHtml(item.issuer)}</div>` : ""}
      ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" class="project-link">Credential</a>` : ""}
    </div>
  `).join("");
};

const renderAwards = (data: any): string => {
  const items = Array.isArray(data) ? data : (data?.items || []);
  if (items.length === 0) return "";

  return items.map((item: any) => `
    <div class="award-item">
      <div class="item-header">
        <span class="item-title">${escapeHtml(item.title || "")}</span>
        ${item.date ? `<span class="item-date">${escapeHtml(item.date)}</span>` : ""}
      </div>
      ${item.issuer ? `<div class="item-subtitle">${escapeHtml(item.issuer)}</div>` : ""}
      ${item.description ? `<div class="item-description">${compileMarkdown(item.description)}</div>` : ""}
    </div>
  `).join("");
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
        ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" class="project-link">Link</a>` : ''}
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

const SECTION_RENDERERS: Record<string, (data: any, variant?: string, locale?: string) => string> = {
  SUMMARY: renderSummary,
  CONTACT: renderContact,
  EXPERIENCE: renderExperience,
  EDUCATION: renderEducation,
  SKILLS: renderSkills,
  PROJECTS: renderProjects,
  LANGUAGES: renderLanguages,
  CERTIFICATIONS: renderCertifications,
  AWARDS: renderAwards,
};

const BLOCK_TO_SECTION: Record<string, string> = {
  contact: "CONTACT",
  experience: "EXPERIENCE",
  education: "EDUCATION",
  skills: "SKILLS",
  projects: "PROJECTS",
  languages: "LANGUAGES",
  certifications: "CERTIFICATIONS",
  awards: "AWARDS",
};

const renderTemplateBlock = (
  block: TemplateBlock,
  normalized: Record<string, any>,
  variant: string,
  locale: string,
): string => {
  const { key, label } = block;

  if (key.startsWith("profile.")) {
    const field = key.slice("profile.".length);
    const profile = normalized.profile || {};

    if (field === "address") {
      const displayAddress = [profile.address, profile.city].filter(Boolean).join(", ");
      if (!displayAddress) return "";
      return `<div class="contact-row block-profile-address"><span class="contact-label">${escapeHtml(label)}</span><span class="contact-value">${escapeHtml(displayAddress)}</span></div>`;
    }

    const value = profile[field];
    if (!value) return "";

    if (field === "linkedin" || field === "github" || field === "website") {
      return `<div class="contact-row block-profile-${field}"><span class="contact-label">${escapeHtml(label)}</span><span class="contact-value"><a href="${escapeHtml(ensureAbsoluteUrl(value))}" target="_blank">${escapeHtml(getDisplayUrl(value))}</a></span></div>`;
    }

    return `<div class="contact-row block-profile-${field}"><span class="contact-label">${escapeHtml(label)}</span><span class="contact-value">${escapeHtml(String(value))}</span></div>`;
  }

  if (key === "summary.text") {
    const summaryHtml = renderSummary(normalized.summary, variant);
    return summaryHtml ? `<div class="block-summary">${summaryHtml}</div>` : "";
  }

  const sectionType = BLOCK_TO_SECTION[key];
  if (!sectionType) return "";

  const renderer = SECTION_RENDERERS[sectionType];
  if (!renderer) return "";

  const data = sectionType === "CONTACT" ? normalized.contact : normalized[key];
  const blockHtml = renderer(data, variant, locale);
  return blockHtml ? `<div class="block-${key}">${blockHtml}</div>` : "";
};

// ─── Deterministic Rendering Cache Layer ───────────────────────────────────

export const DEFAULT_TEMPLATE: TemplateSchema = {
  id: DEFAULT_TEMPLATE_ID,
  name: DEFAULT_TEMPLATE_REGISTRY_ENTRY.name,
  category: DEFAULT_TEMPLATE_REGISTRY_ENTRY.categoryCode,
  layout: getTemplateLayout(DEFAULT_TEMPLATE_ID),
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
  sectionStyles: getTemplateSectionStyles(DEFAULT_TEMPLATE_ID),
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
  const resolvedId = parsedId.success ? parsedId.data : DEFAULT_TEMPLATE.id;

  return {
    id: resolvedId,
    name: parsedName.success ? parsedName.data : DEFAULT_TEMPLATE.name,
    category: parsedCategory.success ? parsedCategory.data : DEFAULT_TEMPLATE.category,
    layout: mergeTemplateLayout(
      parsedLayout.success ? parsedLayout.data : undefined,
      resolvedId,
    ),
    layoutConfig: layoutConfigParsed.success ? layoutConfigParsed.data : getLayoutConfig(baseId),
    themeTokens: themeTokensParsed.success ? themeTokensParsed.data : getTemplateStyles(baseId),
    sectionStyles: sectionStylesParsed.success ? sectionStylesParsed.data : getTemplateSectionStyles(baseId),
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
    locale: input.locale,
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

const renderHtmlDirect = ({ template, data, localFontsDir, locale }: RenderInput): string => {
  const activeLocale = locale || "vi";
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

  const sectionStyles = validatedTemplate.sectionStyles || getTemplateSectionStyles(validatedTemplate.id);

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

  const avatarHtml = (avatarUrl && layout.showAvatar)
    ? `<img src="${escapeHtml(avatarUrl)}" class="profile-avatar" alt="Avatar" />`
    : "";

  let profileHeader = "";
  if (validatedTemplate.id === "ironclad-ats" && avatarHtml) {
    profileHeader = `
      <header class="profile-header">
        <div style="display: flex; align-items: center; gap: 24px;">
          ${avatarHtml}
          <div style="flex: 1;">
            <h1 class="profile-name" style="margin: 0;">${escapeHtml(fullName || (activeLocale === "en" ? "Candidate Name" : "Họ tên ứng viên"))}</h1>
            ${title ? `<h2 class="profile-title" style="margin-top: 4px; margin-bottom: 8px;">${escapeHtml(title)}</h2>` : ""}
            ${contactBar}
          </div>
        </div>
      </header>
    `;
  } else {
    profileHeader = `
      <header class="profile-header">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 24px;">
          <div style="flex: 1;">
            <h1 class="profile-name">${escapeHtml(fullName || (activeLocale === "en" ? "Candidate Name" : "Họ tên ứng viên"))}</h1>
            ${title ? `<h2 class="profile-title">${escapeHtml(title)}</h2>` : ""}
            ${contactBar}
          </div>
          ${avatarHtml}
        </div>
      </header>
    `;
  }

  const isSidebarHeader = (layout.layoutMode === "sidebar-left" || layout.layoutMode === "sidebar-right") && layout.fullPageBleed;

  const profileHeaderSidebar = `
    <div class="profile-header-sidebar">
      ${avatarHtml}
      <h1 class="profile-name" style="margin-top: 0;">${escapeHtml(fullName || (activeLocale === "en" ? "Candidate Name" : "Họ tên ứng viên"))}</h1>
      ${title ? `<h2 class="profile-title">${escapeHtml(title)}</h2>` : ""}
      <div class="contact-bar-sidebar" style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px;">
        ${contacts.map(c => `<div>${c}</div>`).join("")}
      </div>
    </div>
  `;

  // Helper mapping system sections to dynamic registry
  const getSectionTitle = (type: string): string => {
    const viTitles: Record<string, string> = {
      SUMMARY: "Giới thiệu",
      CONTACT: "Liên hệ",
      EXPERIENCE: "Kinh nghiệm làm việc",
      EDUCATION: "Học vấn & Bằng cấp",
      SKILLS: "Kỹ năng chuyên môn",
      PROJECTS: "Dự án tiêu biểu",
      LANGUAGES: "Ngôn ngữ",
      CERTIFICATIONS: "Chứng chỉ",
      AWARDS: "Giải thưởng",
    };
    const enTitles: Record<string, string> = {
      SUMMARY: "Summary",
      CONTACT: "Contact",
      EXPERIENCE: "Work Experience",
      EDUCATION: "Education",
      SKILLS: "Skills",
      PROJECTS: "Projects",
      LANGUAGES: "Languages",
      CERTIFICATIONS: "Certifications",
      AWARDS: "Awards",
    };
    const titleMap = activeLocale === "en" ? enTitles : viTitles;
    return titleMap[type] || type;
  };

  const getSectionData = (type: string): any => {
    if (type === "CONTACT") return normalized.contact;
    return normalized[type.toLowerCase()];
  };

  const renderOptions = (
    (normalized.profile && typeof normalized.profile.renderOptions === "object" && normalized.profile.renderOptions) ||
    (data && typeof data === "object" && (data as any).renderOptions) ||
    {}
  ) as {
    hiddenSections?: string[];
    hiddenBlocks?: string[];
    sectionVariants?: Record<string, string>;
  };

  const hiddenSections = new Set(
    Array.isArray(renderOptions.hiddenSections)
      ? renderOptions.hiddenSections.map((section) => String(section).toUpperCase())
      : [],
  );
  const hiddenBlocks = new Set(
    Array.isArray(renderOptions.hiddenBlocks)
      ? renderOptions.hiddenBlocks.map((block) => String(block))
      : [],
  );
  const sectionVariants = renderOptions.sectionVariants && typeof renderOptions.sectionVariants === "object"
    ? renderOptions.sectionVariants
    : {};

  const renderSectionNode = (type: string): string => {
    if (type === "CONTACT" && isSidebarHeader) return "";
    if (type === "PROFILE") return "";
    if (hiddenSections.has(type)) return "";

    const sectionDef = validatedTemplate.layout.sections.find((section) => section.type === type);
    const blocks = (sectionDef?.blocks?.length
      ? sectionDef.blocks
      : getSectionBlocks(validatedTemplate.id, type))
      .filter((block) => !hiddenBlocks.has(block.key));

    let variant = "classic";
    if (type === "EXPERIENCE" && sectionStyles.experience?.variant) variant = sectionStyles.experience.variant;
    if (type === "EDUCATION" && sectionStyles.education?.variant) variant = sectionStyles.education.variant;
    if (type === "SKILLS" && sectionStyles.skills?.variant) variant = sectionStyles.skills.variant;
    if (type === "PROJECTS" && sectionStyles.projects?.variant) variant = sectionStyles.projects.variant;
    if (sectionVariants[type]) variant = sectionVariants[type];

    const blockHtml = blocks
      .map((block) => renderTemplateBlock(block, normalized, variant, activeLocale))
      .filter(Boolean)
      .join("");

    const fallbackRenderer = SECTION_RENDERERS[type];
    const contentHtml = blockHtml || (fallbackRenderer
      ? fallbackRenderer(getSectionData(type), variant, activeLocale)
      : "");

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
      .skills-container.variant-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 16px;
      }
      .skill-column-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .skill-level-label {
        font-size: 10px;
        color: #64748b;
      }

      /* Contact, languages, certifications, awards */
      .contact-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .contact-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .contact-label {
        font-size: 9.5px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #64748b;
      }
      .contact-value {
        font-size: 11px;
        color: inherit;
      }
      .contact-value a {
        color: var(--accent-color);
        text-decoration: none;
      }
      .language-item,
      .certification-item,
      .award-item {
        margin-bottom: 10px;
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

      /* ─── Template-Specific CSS Overrides ───────────────────────────────── */
      
      /* 1. ironclad-ats */
      .template-ironclad-ats .profile-avatar {
        border-radius: 4px !important;
        border: 1.5px solid #000000 !important;
        width: 64px !important;
        height: 64px !important;
      }
      
      /* 2. synergy-pro */
      .template-synergy-pro .sidebar {
        background-color: #faf9f6 !important;
        border-right: 1px solid #e7e5e4 !important;
        padding: 30px 20px !important;
      }
      .template-synergy-pro .sidebar .profile-avatar {
        border: 2px solid #dc2626 !important;
        border-radius: 50% !important;
        width: 64px !important;
        height: 64px !important;
      }
      .template-synergy-pro .sidebar .profile-name {
        color: #1e1b4b !important;
      }
      .template-synergy-pro .sidebar .profile-title {
        color: #dc2626 !important;
      }
      .template-synergy-pro .main-content .section-title {
        color: #1e1b4b !important;
        border-bottom: 2px solid #dc2626 !important;
      }
      .template-synergy-pro .skill-badge {
        background-color: #fee2e2 !important;
        border: 1px solid #fecaca !important;
        color: #991b1b !important;
      }

      /* 3. pinnacle-executive */
      .template-pinnacle-executive .sidebar {
        background-color: #4a3728 !important;
        color: #fafafa !important;
        padding: 35px 20px !important;
      }
      .template-pinnacle-executive .sidebar .profile-avatar {
        border: 3px solid #ffffff !important;
        border-radius: 50% !important;
        width: 72px !important;
        height: 72px !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      }
      .template-pinnacle-executive .sidebar .profile-name {
        color: #ffffff !important;
        font-family: 'Cormorant Garamond', serif !important;
      }
      .template-pinnacle-executive .sidebar .profile-title {
        color: #fbbf24 !important;
      }
      .template-pinnacle-executive .sidebar .contact-item,
      .template-pinnacle-executive .sidebar .contact-item a {
        color: #e7e5e4 !important;
      }
      .template-pinnacle-executive .sidebar .section-title {
        color: #fbbf24 !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      }
      .template-pinnacle-executive .main-content {
        background-color: #fafaf9 !important;
        padding: 35px 25px !important;
      }
      .template-pinnacle-executive .main-content .section-title {
        color: #4a3728 !important;
        border-bottom: 2px solid #4a3728 !important;
        font-family: 'Cormorant Garamond', serif !important;
      }

      /* 4. chronos-modern */
      .template-chronos-modern .profile-avatar {
        border: 3px solid #ec4899 !important;
        border-radius: 50% !important;
        width: 64px !important;
        height: 64px !important;
      }
      .template-chronos-modern .profile-title {
        color: #ec4899 !important;
      }
      .template-chronos-modern .section-title {
        color: #ec4899 !important;
        border-bottom: 1.5px solid #fbcfe8 !important;
      }
      .template-chronos-modern .skill-badge {
        border-radius: 9999px !important;
        padding: 3px 10px !important;
        border: 1px solid #fbcfe8 !important;
        font-weight: 600 !important;
      }
      .template-chronos-modern .skill-badge:nth-child(4n+1) {
        background-color: rgba(236, 72, 153, 0.1) !important;
        color: #be185d !important;
      }
      .template-chronos-modern .skill-badge:nth-child(4n+2) {
        background-color: rgba(249, 115, 22, 0.1) !important;
        color: #c2410c !important;
      }
      .template-chronos-modern .skill-badge:nth-child(4n+3) {
        background-color: rgba(99, 102, 241, 0.1) !important;
        color: #4338ca !important;
      }
      .template-chronos-modern .skill-badge:nth-child(4n+4) {
        background-color: rgba(20, 184, 166, 0.1) !important;
        color: #0f766e !important;
      }

      /* 5. strategy-pro */
      .template-strategy-pro .profile-header {
        border-bottom: 2px solid #2563eb !important;
      }
      .template-strategy-pro .section-title {
        color: #0f172a !important;
        border-bottom: none !important;
        background-color: #eff6ff !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      .template-strategy-pro .experience-item {
        border-left: 2px dashed #2563eb !important;
        padding-left: 15px !important;
        margin-left: 6px !important;
        position: relative !important;
      }
      .template-strategy-pro .experience-item::before {
        content: "" !important;
        position: absolute !important;
        left: -6px !important;
        top: 4px !important;
        width: 10px !important;
        height: 10px !important;
        border-radius: 50% !important;
        background-color: #2563eb !important;
        border: 2px solid #ffffff !important;
        box-shadow: 0 0 0 2px #dbeafe !important;
      }

      /* 6. block-minimalist */
      .template-block-minimalist .profile-name::before {
        content: "🚀 " !important;
      }
      .template-block-minimalist .summary-text {
        background-color: #f3f4f6 !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 8px !important;
        padding: 12px !important;
        margin-bottom: 16px !important;
      }
      .template-block-minimalist .section-title {
        text-transform: lowercase !important;
        border-bottom: 1.5px solid #e5e7eb !important;
        font-size: 12px !important;
        color: #0f172a !important;
      }
      .template-block-minimalist .section-title::before {
        content: "/ " !important;
        color: #9ca3af !important;
      }
      .template-block-minimalist .skill-badge {
        background-color: #f3f4f6 !important;
        border: 1px solid #e5e7eb !important;
        color: #374151 !important;
        border-radius: 4px !important;
        font-family: monospace !important;
      }
      .template-block-minimalist .experience-item,
      .template-block-minimalist .education-item,
      .template-block-minimalist .project-item {
        background-color: #f9fafb !important;
        border: 1px solid #f3f4f6 !important;
        border-radius: 6px !important;
        padding: 10px !important;
        margin-bottom: 8px !important;
      }

      /* 7. linear-tech */
      .template-linear-tech {
        background-color: #f8fafc !important;
        color: #475569 !important;
      }
      .template-linear-tech .profile-header {
        border-bottom: 1px solid #cbd5e1 !important;
      }
      .template-linear-tech .profile-name,
      .template-linear-tech .section-title,
      .template-linear-tech .item-title {
        color: #0f172a !important;
        font-family: monospace !important;
      }
      .template-linear-tech .section-title {
        border-bottom: 1px solid #cbd5e1 !important;
      }
      .template-linear-tech .contact-item,
      .template-linear-tech .contact-item a,
      .template-linear-tech .item-subtitle {
        color: #475569 !important;
        font-family: monospace !important;
      }
      .template-linear-tech .skill-badge {
        background-color: #eff6ff !important;
        border: 1px solid #bfdbfe !important;
        color: #3b82f6 !important;
        border-radius: 4px !important;
        font-family: monospace !important;
      }
      .template-linear-tech .experience-item,
      .template-linear-tech .education-item,
      .template-linear-tech .project-item {
        border-left: 2px solid #cbd5e1 !important;
        padding-left: 10px !important;
        margin-bottom: 12px !important;
      }

      /* 8. ai-builder */
      .template-ai-builder {
        background-color: #f8fffc !important;
        color: #475569 !important;
      }
      .template-ai-builder .profile-header {
        border-bottom: 1px solid #bae6d0 !important;
      }
      .template-ai-builder .profile-name,
      .template-ai-builder .section-title,
      .template-ai-builder .item-title {
        color: #0f172a !important;
        font-family: monospace !important;
      }
      .template-ai-builder .profile-title {
        color: #10b981 !important;
      }
      .template-ai-builder .section-title {
        border-bottom: 1px solid #10b981 !important;
      }
      .template-ai-builder .sidebar {
        background-color: #ecfdf5 !important;
        border-left: 1px solid #bae6d0 !important;
        padding: 30px 15px !important;
      }
      .template-ai-builder .sidebar .section-title {
        color: #10b981 !important;
      }
      .template-ai-builder .skill-badge {
        background-color: #ecfdf5 !important;
        border: 1px solid #a7f3d0 !important;
        color: #10b981 !important;
        font-family: monospace !important;
      }
      .template-ai-builder .profile-avatar {
        border: 2px solid #10b981 !important;
      }

      /* 9. neo-gradient */
      .template-neo-gradient .profile-name {
        background: linear-gradient(to right, #8b5cf6, #ec4899) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        font-weight: 900 !important;
      }
      .template-neo-gradient .profile-header {
        border-bottom: 2px solid transparent !important;
        border-image: linear-gradient(to right, #8b5cf6, #ec4899) 1 !important;
      }
      .template-neo-gradient .section-title {
        color: #8b5cf6 !important;
        border-bottom: 1.5px solid transparent !important;
        border-image: linear-gradient(to right, #8b5cf6, #ec4899) 1 !important;
      }
      .template-neo-gradient .skill-badge {
        background: linear-gradient(to right, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08)) !important;
        border: 1px solid rgba(139, 92, 246, 0.3) !important;
        color: #a78bfa !important;
        border-radius: 9999px !important;
      }
      .template-neo-gradient .project-item {
        border: 1px solid rgba(139, 92, 246, 0.15) !important;
        background-color: #fafafc !important;
        padding: 10px !important;
        border-radius: 8px !important;
      }
      .template-neo-gradient .profile-avatar {
        border: 2px solid #8b5cf6 !important;
      }

      /* 10. glass-resume */
      .template-glass-resume {
        background: linear-gradient(to bottom right, #f8fafc, #eff6ff, #f8fafc) !important;
        color: #334155 !important;
      }
      .template-glass-resume .profile-header,
      .template-glass-resume .section {
        background: rgba(255, 255, 255, 0.82) !important;
        border: 1px solid rgba(148, 163, 184, 0.35) !important;
        border-radius: 12px !important;
        padding: 16px !important;
        backdrop-filter: blur(12px) !important;
        box-shadow: 0 4px 18px rgba(15, 23, 42, 0.06) !important;
      }
      .template-glass-resume .profile-name {
        color: #0f172a !important;
      }
      .template-glass-resume .profile-title {
        color: #38bdf8 !important;
      }
      .template-glass-resume .section-title {
        color: #38bdf8 !important;
        border-bottom: none !important;
      }
      .template-glass-resume .item-title,
      .template-glass-resume .contact-item,
      .template-glass-resume .contact-item a {
        color: #1e293b !important;
      }
      .template-glass-resume .skill-badge {
        background: rgba(224, 242, 254, 0.9) !important;
        border: 1px solid rgba(125, 211, 252, 0.5) !important;
        color: #0369a1 !important;
      }
      .template-glass-resume .profile-avatar {
        border: 2px solid rgba(56, 189, 248, 0.5) !important;
      }

      /* 11. card-stack */
      .template-card-stack {
        background-color: #f1f5f9 !important;
        padding: 30px !important;
      }
      .template-card-stack .profile-header {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 14px !important;
        padding: 16px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
        margin-bottom: 16px !important;
      }
      .template-card-stack .section {
        background: #ffffff !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 14px !important;
        padding: 16px !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02) !important;
      }
      .template-card-stack .section-title {
        color: #4f46e5 !important;
        border-bottom: 1px solid #e2e8f0 !important;
      }
      .template-card-stack .skill-badge {
        background-color: #f5f3ff !important;
        border: 1px solid #ddd6fe !important;
        color: #6d28d9 !important;
      }

      /* 12. startup-operator */
      .template-startup-operator .profile-title {
        color: #ff6600 !important;
      }
      .template-startup-operator .section-title {
        border-bottom: 2px solid #ff6600 !important;
      }
      .template-startup-operator .skill-badge {
        background-color: #fff8f5 !important;
        border: 1px solid #fed7aa !important;
        color: #ff6600 !important;
      }
      .template-startup-operator .sidebar {
        background-color: #fffaf7 !important;
        border-left: 1px solid #ffeada !important;
        padding: 30px 15px !important;
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
