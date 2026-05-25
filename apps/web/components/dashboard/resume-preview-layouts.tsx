import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";
import {
  AchievementsList,
  AwardsList,
  CertificationsList,
  ConferencesList,
  ContactLines,
  CoursesList,
  EducationBlock,
  ExperienceList,
  ExtracurricularList,
  HardSkillsLine,
  HorizontalRule,
  InternshipsList,
  LanguagesLine,
  LeadershipList,
  OrganizationsList,
  PortfolioLinks,
  ProfileAvatar,
  ProjectsList,
  PublicationsList,
  ReferencesLine,
  ResearchList,
  ResumeSection,
  SAMPLE,
  SoftSkillsLine,
  SummaryParagraph,
  ToolsList,
  VolunteerList,
} from "./resume-preview-parts";

/** 1 — Minimal sidebar: contact, skills stack, tools | summary, experience, projects, certs */
export function LayoutMinimalSidebar() {
  return (
    <div className="flex h-full bg-white text-[8.5px]">
      <aside className="w-[30%] bg-[#f4f4f1] px-[6px] py-[4px] border-r border-slate-200/70">
        <h1 className="text-[12px] font-semibold text-slate-900 leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8px] text-slate-500 mt-[2px]">{SAMPLE.title}</p>
        <ResumeSection title="Contact" variant="minimal" dense>
          <ContactLines compact includeLinks={false} />
        </ResumeSection>
        <ResumeSection title="Hard Skills" variant="minimal" dense>
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Soft Skills" variant="minimal" dense>
          <SoftSkillsLine />
        </ResumeSection>
        <ResumeSection title="Tools" variant="minimal" dense>
          <ToolsList limit={5} />
        </ResumeSection>
        <ResumeSection title="Languages" variant="minimal" dense>
          <LanguagesLine />
        </ResumeSection>
      </aside>
      <main className="flex-1 px-[6px] py-[4px] min-w-0 overflow-hidden">
        <ResumeSection title="Professional Summary" variant="minimal" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Work Experience" variant="minimal" dense>
          <ExperienceList compact showBullets bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="minimal" dense>
          <ProjectsList limit={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="minimal" dense>
          <EducationBlock compact />
        </ResumeSection>
        <ResumeSection title="Certifications" variant="minimal" dense>
          <CertificationsList />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 2 — Academic: research, publications, conferences, organizations */
export function LayoutClassicAcademic() {
  return (
    <div className="px-[6px] py-[5px] h-full text-center overflow-hidden">
      <header>
        <h1 className="text-[19px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[10px] italic text-slate-600 mt-[3px]">{SAMPLE.title}</p>
        <p className="text-[8px] text-slate-500 mt-[4px]">
          {SAMPLE.contact} · {SAMPLE.phone} · {SAMPLE.location}
        </p>
      </header>
      <HorizontalRule />
      <div className="text-left">
        <ResumeSection title="Professional Summary" variant="serif" dense>
          <SummaryParagraph />
        </ResumeSection>
        <HorizontalRule />
        <ResumeSection title="Research Experience" variant="serif" dense>
          <ResearchList />
        </ResumeSection>
        <ResumeSection title="Publications" variant="serif" dense>
          <PublicationsList />
        </ResumeSection>
        <ResumeSection title="Conferences" variant="serif" dense>
          <ConferencesList limit={1} />
        </ResumeSection>
        <HorizontalRule />
        <ResumeSection title="Work Experience" variant="serif" dense>
          <ExperienceList compact showBullets maxJobs={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="serif" dense>
          <EducationBlock />
        </ResumeSection>
        <ResumeSection title="Organizations" variant="serif" dense>
          <OrganizationsList />
        </ResumeSection>
        <ResumeSection title="References" variant="serif" dense>
          <ReferencesLine />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 3 — Executive: leadership, achievements, full experience */
export function LayoutExecutive() {
  return (
    <div className="h-full flex flex-col bg-[#fafaf9] overflow-hidden">
      <header className="bg-slate-800 text-white px-[6px] py-[4px] shrink-0">
        <h1 className="text-[16px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9px] text-slate-300 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-400 mt-[3px]">
          {SAMPLE.contact} · {SAMPLE.phone} · {SAMPLE.linkedin}
        </p>
      </header>
      <div className="flex-1 px-[7px] py-[5px] min-h-0 overflow-hidden bg-white mx-[4px] mb-[4px] mt-[4px] rounded-sm border border-slate-200/60">
        <ResumeSection title="Executive Summary" variant="caps" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Leadership Experience" variant="caps" dense>
          <LeadershipList />
        </ResumeSection>
        <ResumeSection title="Key Achievements" variant="caps" dense>
          <AchievementsList />
        </ResumeSection>
        <ResumeSection title="Professional Experience" variant="caps" dense>
          <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="caps" dense>
          <EducationBlock compact />
        </ResumeSection>
        <div className="grid grid-cols-2 gap-[6px]">
          <ResumeSection title="Core Skills" variant="caps" dense className="!mt-[6px]">
            <HardSkillsLine />
          </ResumeSection>
          <ResumeSection title="Certifications" variant="caps" dense className="!mt-[6px]">
            <CertificationsList limit={1} />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

/** 4 — Creative: portfolio links, projects, awards, volunteer */
export function LayoutCreativeDesigner() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[36%] bg-gradient-to-b from-teal-600 to-teal-800 text-white px-[6px] py-[5px] flex flex-col">
        <h1 className="text-[14px] font-bold leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8.5px] text-teal-100 mt-[2px]">{SAMPLE.title}</p>
        <div className="mt-[8px] space-y-[6px] flex-1">
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-teal-200/90 mb-[2px]">
              Contact
            </p>
            <ContactLines inverted compact includeLinks={false} />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-teal-200/90 mb-[2px]">
              Portfolio
            </p>
            <PortfolioLinks inverted />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-teal-200/90 mb-[2px]">
              Skills
            </p>
            <SoftSkillsLine inverted />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-teal-200/90 mb-[2px]">
              Interests
            </p>
            <p className="text-[8px] text-teal-100">{SAMPLE.interests.join(" · ")}</p>
          </div>
        </div>
      </div>
      <main className="flex-1 bg-white px-[7px] py-[4px] min-w-0 overflow-hidden">
        <ResumeSection title="Profile" variant="accent" dense className="!mt-0">
          <SummaryParagraph lines={1} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets maxJobs={2} />
        </ResumeSection>
        <ResumeSection title="Projects & Portfolio" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Awards" variant="accent" dense>
          <AwardsList />
        </ResumeSection>
        <ResumeSection title="Volunteer" variant="accent" dense>
          <VolunteerList limit={1} />
        </ResumeSection>
        <ResumeSection title="Education" variant="accent" dense>
          <EducationBlock compact />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 5 — Compact ATS: dense single column, maximum recruiter sections */
export function LayoutCompactAts() {
  return (
    <div className="px-[7px] py-[4px] h-full flex flex-col text-black overflow-hidden">
      <header className="border-b border-black pb-[5px] shrink-0">
        <h1 className="text-[17px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] mt-[2px] leading-snug">
          {SAMPLE.contact} | {SAMPLE.phone} | {SAMPLE.location}
        </p>
        <p className="text-[7.5px]">{SAMPLE.linkedin} | {SAMPLE.github}</p>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden pt-[3px] space-y-[4px]">
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Professional Summary</p>
          <SummaryParagraph className="!text-[8px] !text-black" lines={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Work Experience</p>
          <ExperienceList showBullets maxJobs={3} bulletsPerJob={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Education</p>
          <EducationBlock />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Technical Skills</p>
          <HardSkillsLine />
          <p className="text-[7.5px] text-slate-600 mt-[2px]">
            Soft: {SAMPLE.skills.soft.join(", ")}
          </p>
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Projects</p>
          <ProjectsList limit={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Certifications</p>
          <CertificationsList />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Languages</p>
          <LanguagesLine />
        </section>
      </div>
    </div>
  );
}

/** 6 — Modern profile: two columns — experience + leadership | education + skills stack */
export function LayoutModernProfile() {
  return (
    <div className="h-full flex flex-col bg-[#f8fafc] overflow-hidden">
      <header className="px-[7px] pt-[9px] pb-[7px] flex gap-[8px] items-center bg-white border-b border-slate-200/80 shrink-0">
        <ProfileAvatar size="md" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
          <p className="text-[9px] text-primary font-semibold mt-[1px]">{SAMPLE.title}</p>
          <p className="text-[7.5px] text-slate-500 mt-[2px]">{SAMPLE.contact} · {SAMPLE.location}</p>
        </div>
      </header>
      <div className="flex-1 flex gap-[6px] px-[6px] py-[5px] min-h-0 overflow-hidden">
        <div className="flex-[3] min-w-0 bg-white rounded-sm px-[7px] py-[4px] border border-slate-100 overflow-hidden">
          <ResumeSection title="Summary" variant="accent" dense className="!mt-0">
            <SummaryParagraph lines={1} />
          </ResumeSection>
          <ResumeSection title="Experience" variant="accent" dense>
            <ExperienceList compact showBullets bulletsPerJob={2} />
          </ResumeSection>
          <ResumeSection title="Leadership" variant="accent" dense>
            <LeadershipList limit={1} />
          </ResumeSection>
          <ResumeSection title="Achievements" variant="accent" dense>
            <AchievementsList limit={1} />
          </ResumeSection>
        </div>
        <div className="flex-[2] min-w-0 bg-white rounded-sm px-[7px] py-[4px] border border-slate-100 overflow-hidden">
          <ResumeSection title="Education" variant="accent" dense className="!mt-0">
            <EducationBlock />
          </ResumeSection>
          <ResumeSection title="Technical Stack" variant="accent" dense>
            <HardSkillsLine />
          </ResumeSection>
          <ResumeSection title="Tools" variant="accent" dense>
            <ToolsList limit={5} />
          </ResumeSection>
          <ResumeSection title="Certifications" variant="accent" dense>
            <CertificationsList limit={1} />
          </ResumeSection>
          <ResumeSection title="Courses" variant="accent" dense>
            <CoursesList limit={1} />
          </ResumeSection>
          <ResumeSection title="Languages" variant="accent" dense>
            <LanguagesLine />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

/** 7 — Elegant mono: editorial spacing + awards + publications */
export function LayoutElegantMono() {
  return (
    <div className="px-[6px] py-[4px] h-full flex flex-col overflow-hidden">
      <header className="mb-[10px] shrink-0">
        <h1 className="text-[21px] font-normal text-black leading-none tracking-[-0.02em]">
          {SAMPLE.name}
        </h1>
        <p className="text-[8.5px] uppercase tracking-[0.3em] text-slate-500 mt-[6px]">{SAMPLE.title}</p>
        <p className="text-[8px] text-slate-400 mt-[6px]">{SAMPLE.contact} — {SAMPLE.location}</p>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden space-y-[8px]">
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Profile</p>
          <SummaryParagraph className="!text-slate-600" lines={2} />
        </section>
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Experience</p>
          <ExperienceList compact showBullets dateRight maxJobs={2} bulletsPerJob={2} />
        </section>
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Awards</p>
          <AwardsList />
        </section>
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Education</p>
          <EducationBlock compact />
        </section>
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Publications</p>
          <PublicationsList limit={1} />
        </section>
        <section>
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Languages</p>
          <LanguagesLine />
        </section>
      </div>
    </div>
  );
}

/** 8 — Tech startup: GitHub, stack, projects, internships, courses */
export function LayoutTechStartup() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-[7px] py-[4px] border-b-2 border-[#006491] shrink-0">
        <h1 className="text-[16px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold text-[#006491] mt-[1px]">{SAMPLE.title}</p>
        <div className="flex flex-wrap gap-x-[6px] mt-[3px] text-[7.5px] text-slate-600">
          <span>{SAMPLE.github}</span>
          <span>·</span>
          <span>{SAMPLE.website}</span>
          <span>·</span>
          <span>{SAMPLE.linkedin}</span>
        </div>
      </header>
      <div className="flex-1 px-[7px] py-[4px] min-h-0 overflow-hidden">
        <ResumeSection title="Technical Stack" variant="accent" dense className="!mt-0">
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Tools & Technologies" variant="accent" dense>
          <ToolsList />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Internships" variant="accent" dense>
          <InternshipsList />
        </ResumeSection>
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Certifications & Courses" variant="accent" dense>
          <CertificationsList limit={1} />
          <CoursesList limit={1} />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 9 — Finance: achievements, leadership, structured grid */
export function LayoutFinanceConsulting() {
  return (
    <div className="px-[6px] py-[5px] h-full overflow-hidden">
      <header className="text-center border-b-2 border-slate-900 pb-[6px] mb-[6px]">
        <h1 className="text-[17px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] text-slate-700 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-500 mt-[3px]">
          {SAMPLE.location} · {SAMPLE.phone} · {SAMPLE.contact}
        </p>
      </header>
      <ResumeSection title="Professional Summary" variant="serif" dense className="!mt-0">
        <SummaryParagraph lines={2} />
      </ResumeSection>
      <ResumeSection title="Leadership Highlights" variant="serif" dense>
        <LeadershipList limit={1} />
      </ResumeSection>
      <ResumeSection title="Professional Experience" variant="serif" dense>
        <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
      </ResumeSection>
      <ResumeSection title="Key Achievements" variant="serif" dense>
        <AchievementsList limit={1} />
      </ResumeSection>
      <ResumeSection title="Education" variant="serif" dense>
        <EducationBlock />
      </ResumeSection>
      <div className="grid grid-cols-2 gap-[8px]">
        <ResumeSection title="Skills" variant="serif" dense className="!mt-[6px]">
          <HardSkillsLine />
          <p className="text-[7.5px] text-slate-500 mt-[2px]">Soft: {SAMPLE.skills.soft.slice(0, 2).join(", ")}</p>
        </ResumeSection>
        <ResumeSection title="Certifications" variant="serif" dense className="!mt-[6px]">
          <CertificationsList />
        </ResumeSection>
      </div>
      <ResumeSection title="Languages" variant="serif" dense>
        <LanguagesLine />
      </ResumeSection>
      <ResumeSection title="Extracurricular" variant="serif" dense>
        <ExtracurricularList />
      </ResumeSection>
    </div>
  );
}

export const PREVIEW_LAYOUTS: Record<TemplatePreviewVariant, () => JSX.Element> = {
  "minimal-sidebar": LayoutMinimalSidebar,
  "classic-academic": LayoutClassicAcademic,
  executive: LayoutExecutive,
  "creative-designer": LayoutCreativeDesigner,
  "compact-ats": LayoutCompactAts,
  "modern-profile": LayoutModernProfile,
  "elegant-mono": LayoutElegantMono,
  "tech-startup": LayoutTechStartup,
  finance: LayoutFinanceConsulting,
};
