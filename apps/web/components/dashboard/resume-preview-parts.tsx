import type { ReactNode } from "react";

/** Rich professional sample résumé — recruiter-ready, ATS-safe */
export const SAMPLE = {
  name: "Alex Nguyen",
  title: "Senior Software Engineer",
  contact: "alex.nguyen@email.com",
  location: "Hanoi, Vietnam",
  phone: "+84 90 123 4567",
  linkedin: "linkedin.com/in/alexnguyen",
  github: "github.com/alexnguyen",
  website: "alexnguyen.dev",
  summary:
    "Full-stack engineer with 6+ years building scalable B2B and consumer platforms. Proven in system design, API architecture, and leading cross-functional delivery from concept to production.",
  experience: [
    {
      role: "Senior Software Engineer",
      company: "TechCorp",
      period: "2021 – Present",
      bullets: [
        "Led payment API platform serving 2M+ MAU; 99.95% uptime SLA.",
        "Mentored team of 5 engineers; instituted design review practice.",
        "Cut infrastructure costs 22% via rightsizing and caching strategy.",
      ],
    },
    {
      role: "Software Engineer",
      company: "StartupXYZ",
      period: "2018 – 2021",
      bullets: [
        "Shipped checkout redesign; reduced cart abandonment 18%.",
        "Owned CI/CD migration; release cadence improved 4×.",
      ],
    },
    {
      role: "Junior Developer",
      company: "Digital Agency Co.",
      period: "2016 – 2018",
      bullets: ["Delivered 12+ client web apps on React and Node.js stack."],
    },
  ],
  internships: [
    {
      role: "Engineering Intern",
      company: "FPT Software",
      period: "Summer 2015",
      bullet: "Built internal reporting dashboard used by 40+ PMs.",
    },
  ],
  education: {
    degree: "BSc Computer Science",
    school: "Hanoi University of Science",
    year: "2016",
    honors: "GPA 3.7 / 4.0 · Dean's List",
  },
  skills: {
    hard: ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "GraphQL"],
    soft: ["Leadership", "Stakeholder mgmt", "Agile", "Technical writing"],
  },
  tools: ["Git", "Jira", "Figma", "Datadog", "Terraform", "GitHub Actions"],
  projects: [
    { name: "Payments SDK", detail: "Open-source npm · 4.2k stars", link: "github.com/alex/payments-sdk" },
    { name: "Analytics Dashboard", detail: "Real-time product metrics SaaS", link: "alexnguyen.dev/analytics" },
    { name: "CLI Toolkit", detail: "Node.js developer productivity suite", link: "npmjs.com/package/acv-cli" },
  ],
  certifications: [
    "AWS Solutions Architect – Associate",
    "Professional Scrum Master I (PSM I)",
  ],
  courses: [
    "System Design — Educative (2023)",
    "Advanced React Patterns — Frontend Masters (2022)",
  ],
  languages: ["Vietnamese (Native)", "English (Professional working)"],
  achievements: [
    "Employee of the Year, TechCorp Engineering (2024)",
    "Hackathon winner — FinTech track, Vietnam DevFest (2022)",
  ],
  awards: ["Best Technical Blog, Company Engineering Week 2023"],
  leadership: [
    "Tech Lead, Platform Guild — drove API standards across 4 squads",
    "Organizer, internal mentorship program (30+ mentor pairs)",
  ],
  volunteer: [
    "Code mentor, Girls Who Code Vietnam (2022 – Present)",
    "Open-source maintainer, local developer community tools",
  ],
  publications: [
    "Nguyen, A. — Scaling Node.js APIs at TechCorp. Eng Blog, 2024.",
    "Nguyen, A. — Caching strategies for high-traffic APIs. Medium, 2023.",
  ],
  research: [
    "Undergraduate thesis: Distributed task scheduling on Kubernetes",
    "Research assistant — NLP lab, sentiment analysis on Vietnamese text",
  ],
  conferences: [
    "Speaker, Vietnam Web Summit 2024 — API reliability patterns",
    "Attendee, AWS re:Invent 2023",
  ],
  organizations: ["ACM Student Chapter — Vice President (2014–2016)"],
  extracurricular: ["University programming club founder · Hackathon coach"],
  interests: ["Open source", "Technical writing", "Trail running"],
  references: "Available upon request — former VP Engineering & Engineering Manager",
} as const;

type HeadingVariant = "default" | "accent" | "inverted" | "serif" | "caps" | "minimal";

export function SectionHeading({
  children,
  className = "",
  variant = "default",
  dense = false,
}: {
  children: ReactNode;
  className?: string;
  variant?: HeadingVariant;
  dense?: boolean;
}) {
  const styles: Record<HeadingVariant, string> = {
    default: "text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800 border-b border-slate-200/90 pb-[3px]",
    accent: "text-[10px] font-bold uppercase tracking-[0.1em] text-primary border-b border-primary/25 pb-[3px]",
    inverted: "text-[9px] font-bold uppercase tracking-[0.12em] text-white border-b border-white/30 pb-[2px]",
    serif: "text-[11px] font-bold text-slate-900 border-b border-slate-400/80 pb-[3px] tracking-wide",
    caps: "text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-900",
    minimal: "text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500",
  };
  const mt = dense ? "mt-[6px]" : "mt-[8px]";

  return (
    <h4 className={`leading-none mb-[4px] first:mt-0 ${mt} ${styles[variant]} ${className}`}>
      {children}
    </h4>
  );
}

export function ResumeSection({
  title,
  variant = "default",
  dense = false,
  children,
  className = "",
}: {
  title: string;
  variant?: HeadingVariant;
  dense?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <SectionHeading variant={variant} dense={dense}>
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}

export function BulletList({
  items,
  limit,
  className = "",
}: {
  items: readonly string[];
  limit?: number;
  className?: string;
}) {
  const list = limit ? items.slice(0, limit) : items;
  return (
    <ul className={`space-y-[2px] ${className}`}>
      {list.map((item) => (
        <li key={item} className="text-[8.5px] text-slate-700 leading-snug pl-[5px]">
          • {item}
        </li>
      ))}
    </ul>
  );
}

export function ContactLines({
  inverted = false,
  includeLinks = true,
  compact = false,
}: {
  inverted?: boolean;
  includeLinks?: boolean;
  compact?: boolean;
}) {
  const text = inverted ? "text-slate-300" : "text-slate-600";
  const size = compact ? "text-[8px]" : "text-[8.5px]";
  return (
    <div className={`${size} leading-snug space-y-[1px] ${text}`}>
      <p>{SAMPLE.contact}</p>
      <p>{SAMPLE.phone}</p>
      <p>{SAMPLE.location}</p>
      {includeLinks && (
        <>
          <p className={inverted ? "text-slate-400" : "text-slate-500"}>{SAMPLE.linkedin}</p>
          <p className={inverted ? "text-slate-400" : "text-slate-500"}>{SAMPLE.github}</p>
          <p className={inverted ? "text-slate-400" : "text-slate-500"}>{SAMPLE.website}</p>
        </>
      )}
    </div>
  );
}

export function PortfolioLinks({ inverted = false }: { inverted?: boolean }) {
  const c = inverted ? "text-teal-100" : "text-primary";
  return (
    <div className={`text-[8px] leading-snug space-y-[1px] ${c}`}>
      <p>{SAMPLE.website}</p>
      <p>{SAMPLE.github}</p>
      <p>{SAMPLE.linkedin}</p>
    </div>
  );
}

export function ExperienceList({
  compact = false,
  showBullets = true,
  dateRight = false,
  maxJobs,
  bulletsPerJob = 2,
}: {
  compact?: boolean;
  showBullets?: boolean;
  dateRight?: boolean;
  maxJobs?: number;
  bulletsPerJob?: number;
}) {
  const jobs = SAMPLE.experience.slice(0, maxJobs ?? (compact ? 2 : 3));

  return (
    <ul className="space-y-[5px]">
      {jobs.map((job) => (
        <li key={job.company}>
          <div className={dateRight ? "flex justify-between gap-1 items-baseline" : ""}>
            <p className="text-[9.5px] font-semibold text-slate-900 leading-tight">
              {job.role}
              <span className="font-normal text-slate-600"> · {job.company}</span>
            </p>
            {dateRight && (
              <span className="text-[8px] text-slate-500 shrink-0 tabular-nums">{job.period}</span>
            )}
          </div>
          {!dateRight && <p className="text-[8px] text-slate-500">{job.period}</p>}
          {showBullets &&
            job.bullets.slice(0, compact ? 1 : bulletsPerJob).map((b) => (
              <p key={b} className="text-[8.5px] text-slate-700 leading-snug pl-[5px] mt-[1px]">
                • {b}
              </p>
            ))}
        </li>
      ))}
    </ul>
  );
}

export function InternshipsList() {
  return (
    <ul className="space-y-[4px]">
      {SAMPLE.internships.map((i) => (
        <li key={i.company}>
          <p className="text-[9px] font-semibold text-slate-900">
            {i.role} · {i.company}
          </p>
          <p className="text-[8px] text-slate-500">{i.period}</p>
          <p className="text-[8.5px] text-slate-700 pl-[5px]">• {i.bullet}</p>
        </li>
      ))}
    </ul>
  );
}

export function EducationBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-slate-900">{SAMPLE.education.degree}</p>
      <p className="text-[8.5px] text-slate-600">
        {SAMPLE.education.school} · {SAMPLE.education.year}
      </p>
      {!compact && <p className="text-[8px] text-slate-500 mt-[1px]">{SAMPLE.education.honors}</p>}
    </div>
  );
}

export function SkillsTags({ inverted = false, limit = 8 }: { inverted?: boolean; limit?: number }) {
  const chip = inverted ? "bg-white/15 text-slate-100" : "bg-slate-100 text-slate-700";
  return (
    <div className="flex flex-wrap gap-[2px]">
      {SAMPLE.skills.hard.slice(0, limit).map((s) => (
        <span key={s} className={`text-[7px] font-medium px-[4px] py-[1px] rounded-sm ${chip}`}>
          {s}
        </span>
      ))}
    </div>
  );
}

export function HardSkillsLine({ inverted = false }: { inverted?: boolean }) {
  return (
    <p className={`text-[8px] leading-snug ${inverted ? "text-slate-200" : "text-slate-700"}`}>
      {SAMPLE.skills.hard.join(" · ")}
    </p>
  );
}

export function SoftSkillsLine({ inverted = false }: { inverted?: boolean }) {
  return (
    <p className={`text-[8px] leading-snug ${inverted ? "text-slate-300" : "text-slate-600"}`}>
      {SAMPLE.skills.soft.join(" · ")}
    </p>
  );
}

export function SkillsInline({ inverted = false }: { inverted?: boolean }) {
  return <HardSkillsLine inverted={inverted} />;
}

export function ToolsList({ limit = 6 }: { limit?: number }) {
  return (
    <p className="text-[8px] text-slate-600 leading-snug">
      {SAMPLE.tools.slice(0, limit).join(" · ")}
    </p>
  );
}

export function ProjectsList({
  withLinks = false,
  limit = 3,
}: {
  withLinks?: boolean;
  limit?: number;
}) {
  return (
    <ul className="space-y-[4px]">
      {SAMPLE.projects.slice(0, limit).map((p) => (
        <li key={p.name}>
          <p className="text-[9px] font-semibold text-slate-900">{p.name}</p>
          <p className="text-[8px] text-slate-600 leading-snug">{p.detail}</p>
          {withLinks && <p className="text-[7.5px] text-primary">{p.link}</p>}
        </li>
      ))}
    </ul>
  );
}

export function SummaryParagraph({ className = "", lines = 2 }: { className?: string; lines?: 1 | 2 }) {
  const text = lines === 1 ? SAMPLE.summary.split(".")[0] + "." : SAMPLE.summary;
  return <p className={`text-[8.5px] text-slate-700 leading-[1.45] ${className}`}>{text}</p>;
}

export function ProfileAvatar({
  size = "md",
  url,
  fallbackInitials = "AN",
}: {
  size?: "sm" | "md" | "lg";
  url?: string;
  fallbackInitials?: string;
}) {
  const dim = { sm: "w-8 h-8", md: "w-10 h-10", lg: "w-12 h-12" }[size];
  const defaultUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80";
  const imageUrl = url || defaultUrl;

  return (
    <div className={`${dim} rounded-full ring-2 ring-white shadow-sm shrink-0 overflow-hidden bg-slate-100 flex items-center justify-center`}>
      <img
        src={imageUrl}
        alt="Avatar"
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function CertificationsList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.certifications} limit={limit} />;
}

export function CoursesList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.courses} limit={limit} />;
}

export function LanguagesLine() {
  return <p className="text-[8px] text-slate-700 leading-snug">{SAMPLE.languages.join(" · ")}</p>;
}

export function AchievementsList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.achievements} limit={limit} />;
}

export function AwardsList({ limit = 1 }: { limit?: number }) {
  return <BulletList items={SAMPLE.awards} limit={limit} />;
}

export function LeadershipList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.leadership} limit={limit} />;
}

export function VolunteerList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.volunteer} limit={limit} />;
}

export function PublicationsList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.publications} limit={limit} />;
}

export function ResearchList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.research} limit={limit} />;
}

export function ConferencesList({ limit = 2 }: { limit?: number }) {
  return <BulletList items={SAMPLE.conferences} limit={limit} />;
}

export function OrganizationsList({ limit = 1 }: { limit?: number }) {
  return <BulletList items={SAMPLE.organizations} limit={limit} />;
}

export function ExtracurricularList({ limit = 1 }: { limit?: number }) {
  return <BulletList items={SAMPLE.extracurricular} limit={limit} />;
}

export function InterestsLine() {
  return <p className="text-[8px] text-slate-600">{SAMPLE.interests.join(" · ")}</p>;
}

export function ReferencesLine() {
  return <p className="text-[8px] text-slate-500 italic leading-snug">{SAMPLE.references}</p>;
}

export function HorizontalRule() {
  return <hr className="border-0 h-px bg-slate-300/80 my-[6px]" />;
}
