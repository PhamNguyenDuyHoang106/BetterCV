import { z } from "zod";

export const SocialItemSchema = z.object({
  id: z.string(),
  type: z.string(), // e.g. "linkedin" | "github" | "facebook" | "twitter" | "behance" | "dribbble" | "youtube" | "instagram" | "website" | "custom"
  label: z.string().optional(),
  url: z.string().optional(),
});

export const ProfileSchema = z.object({
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  title: z.string().optional(),
  email: z.string().email("Email không hợp lệ").or(z.string().length(0)).optional(),
  phone: z.string().optional(),
  website: z.string().url("Đường dẫn website không hợp lệ").or(z.string().length(0)).optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  avatarUrl: z.string().url("Đường dẫn ảnh đại diện không hợp lệ").or(z.string().length(0)).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  socials: z.array(SocialItemSchema).default([]),
});

export const ExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Tên công ty là bắt buộc"),
  position: z.string().min(1, "Chức danh là bắt buộc"),
  location: z.string().optional(),
  startDate: z.string(), // Định dạng YYYY-MM
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string(), // Standard Markdown
});

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Tên trường/tổ chức là bắt buộc"),
  degree: z.string().min(1, "Bằng cấp/Chứng chỉ là bắt buộc"),
  fieldOfStudy: z.string().optional(),
  startDate: z.string(), // Định dạng YYYY-MM
  endDate: z.string().optional(),
  gpa: z.string().optional(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên kỹ năng là bắt buộc"),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên dự án là bắt buộc"),
  description: z.string(), // Markdown
  role: z.string().optional(),
  url: z.string().url("Đường dẫn dự án không hợp lệ").or(z.string().length(0)).optional(),
  technologies: z.array(z.string()).default([]),
});

export const CustomSectionItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(), // Markdown
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Tên phần tùy chỉnh là bắt buộc"),
  items: z.array(CustomSectionItemSchema).default([]),
});

export const ResumeDataSchema = z.object({
  schemaVersion: z.number().default(1),
  profile: ProfileSchema.default({ fullName: "" }),
  summary: z.string().default(""), // Markdown
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  customSections: z.array(CustomSectionSchema).default([]),
});

export type SocialItem = z.infer<typeof SocialItemSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CustomSectionItem = z.infer<typeof CustomSectionItemSchema>;
export type CustomSection = z.infer<typeof CustomSectionSchema>;
export type ResumeData = z.infer<typeof ResumeDataSchema>;
