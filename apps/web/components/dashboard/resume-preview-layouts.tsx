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

/** 10 — London: Executive with purple header accent */
export function LayoutLondon() {
  return (
    <div className="h-full flex flex-col bg-[#fafaf9] overflow-hidden">
      <header className="bg-indigo-900 text-white px-[6px] py-[4px] shrink-0">
        <h1 className="text-[16px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9px] text-indigo-200 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-indigo-300 mt-[3px]">
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
      </div>
    </div>
  );
}

/** 11 — Zurich: Finance with clean serif */
export function LayoutZurich() {
  return (
    <div className="px-[6px] py-[5px] h-full overflow-hidden">
      <header className="text-center border-b-2 border-slate-700 pb-[6px] mb-[6px]">
        <h1 className="text-[17px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] text-slate-700 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-500 mt-[3px]">
          {SAMPLE.location} · {SAMPLE.contact} · {SAMPLE.phone}
        </p>
      </header>
      <ResumeSection title="Professional Summary" variant="serif" dense className="!mt-0">
        <SummaryParagraph lines={2} />
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
      <ResumeSection title="Certifications" variant="serif" dense>
        <CertificationsList />
      </ResumeSection>
    </div>
  );
}

/** 12 — Oslo: Minimal Sidebar with green accent */
export function LayoutOslo() {
  return (
    <div className="flex h-full bg-white text-[8.5px]">
      <aside className="w-[30%] bg-green-50 px-[6px] py-[4px] border-r-2 border-green-600">
        <h1 className="text-[12px] font-semibold text-slate-900 leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8px] text-green-700 mt-[2px] font-semibold">{SAMPLE.title}</p>
        <ResumeSection title="Contact" variant="minimal" dense>
          <ContactLines compact includeLinks={false} />
        </ResumeSection>
        <ResumeSection title="Skills" variant="minimal" dense>
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Tools" variant="minimal" dense>
          <ToolsList limit={5} />
        </ResumeSection>
        <ResumeSection title="Languages" variant="minimal" dense>
          <LanguagesLine />
        </ResumeSection>
      </aside>
      <main className="flex-1 px-[6px] py-[4px] min-w-0 overflow-hidden">
        <ResumeSection title="Summary" variant="minimal" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="minimal" dense>
          <ExperienceList compact showBullets bulletsPerJob={2} />
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

/** 13 — Berlin: Tech with orange accent */
export function LayoutBerlin() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-[7px] py-[4px] border-b-2 border-orange-500 shrink-0">
        <h1 className="text-[16px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold text-orange-600 mt-[1px]">{SAMPLE.title}</p>
        <div className="flex flex-wrap gap-x-[6px] mt-[3px] text-[7.5px] text-slate-600">
          <span>{SAMPLE.github}</span>
          <span>·</span>
          <span>{SAMPLE.website}</span>
        </div>
      </header>
      <div className="flex-1 px-[7px] py-[4px] min-h-0 overflow-hidden">
        <ResumeSection title="Technical Stack" variant="accent" dense className="!mt-0">
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="accent" dense>
          <EducationBlock compact />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 14 — Stockholm: Dense ATS with gray */
export function LayoutStockholm() {
  return (
    <div className="px-[7px] py-[4px] h-full flex flex-col text-black overflow-hidden">
      <header className="border-b-2 border-gray-600 pb-[5px] shrink-0">
        <h1 className="text-[17px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] mt-[2px] leading-snug">
          {SAMPLE.contact} | {SAMPLE.phone} | {SAMPLE.location}
        </p>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden pt-[3px] space-y-[4px]">
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Summary</p>
          <SummaryParagraph className="!text-[8px] !text-black" lines={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Experience</p>
          <ExperienceList showBullets maxJobs={3} bulletsPerJob={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Education</p>
          <EducationBlock />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Skills</p>
          <HardSkillsLine />
        </section>
      </div>
    </div>
  );
}

/** 15 — Paris: Elegant with rose accent */
export function LayoutParis() {
  return (
    <div className="px-[6px] py-[4px] h-full flex flex-col overflow-hidden">
      <header className="mb-[10px] shrink-0">
        <h1 className="text-[21px] font-normal text-black leading-none tracking-[-0.02em]">
          {SAMPLE.name}
        </h1>
        <p className="text-[8.5px] uppercase tracking-[0.3em] text-rose-600 mt-[6px]">{SAMPLE.title}</p>
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
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Education</p>
          <EducationBlock compact />
        </section>
      </div>
    </div>
  );
}

/** 16 — Milan: Creative with purple sidebar */
export function LayoutMilan() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[36%] bg-gradient-to-b from-purple-600 to-purple-800 text-white px-[6px] py-[5px] flex flex-col">
        <h1 className="text-[14px] font-bold leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8.5px] text-purple-100 mt-[2px]">{SAMPLE.title}</p>
        <div className="mt-[8px] space-y-[6px] flex-1">
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-purple-200/90 mb-[2px]">Contact</p>
            <ContactLines inverted compact includeLinks={false} />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-purple-200/90 mb-[2px]">Portfolio</p>
            <PortfolioLinks inverted />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-purple-200/90 mb-[2px]">Skills</p>
            <HardSkillsLine />
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
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="accent" dense>
          <EducationBlock compact />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 17 — Tokyo: Modern Profile with pink accent */
export function LayoutTokyo() {
  return (
    <div className="h-full flex flex-col bg-pink-50 overflow-hidden">
      <header className="px-[7px] pt-[9px] pb-[7px] flex gap-[8px] items-center bg-white border-b-2 border-pink-300 shrink-0">
        <ProfileAvatar size="md" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
          <p className="text-[9px] text-pink-600 font-semibold mt-[1px]">{SAMPLE.title}</p>
          <p className="text-[7.5px] text-slate-500 mt-[2px]">{SAMPLE.contact}</p>
        </div>
      </header>
      <div className="flex-1 flex gap-[6px] px-[6px] py-[5px] min-h-0 overflow-hidden">
        <div className="flex-[3] min-w-0 bg-white rounded-sm px-[7px] py-[4px] border border-slate-100 overflow-hidden">
          <ResumeSection title="Experience" variant="accent" dense className="!mt-0">
            <ExperienceList compact showBullets bulletsPerJob={2} />
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
          <ResumeSection title="Languages" variant="accent" dense>
            <LanguagesLine />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

/** 18 — Singapore: Executive with blue */
export function LayoutSingapore() {
  return (
    <div className="h-full flex flex-col bg-[#fafaf9] overflow-hidden">
      <header className="bg-blue-900 text-white px-[6px] py-[4px] shrink-0">
        <h1 className="text-[16px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9px] text-blue-200 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-blue-300 mt-[3px]">
          {SAMPLE.contact} · {SAMPLE.phone}
        </p>
      </header>
      <div className="flex-1 px-[7px] py-[5px] min-h-0 overflow-hidden bg-white mx-[4px] mb-[4px] mt-[4px] rounded-sm border border-slate-200/60">
        <ResumeSection title="Summary" variant="caps" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="caps" dense>
          <ExperienceList showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="caps" dense>
          <EducationBlock compact />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 19 — Sydney: Tech with cyan */
export function LayoutSydney() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-[7px] py-[4px] border-b-2 border-cyan-500 shrink-0">
        <h1 className="text-[16px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold text-cyan-600 mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-600 mt-[3px]">{SAMPLE.github}</p>
      </header>
      <div className="flex-1 px-[7px] py-[4px] min-h-0 overflow-hidden">
        <ResumeSection title="Skills" variant="accent" dense className="!mt-0">
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="accent" dense>
          <EducationBlock compact />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 20 — Toronto: Finance with amber */
export function LayoutToronto() {
  return (
    <div className="px-[6px] py-[5px] h-full overflow-hidden">
      <header className="text-center border-b-2 border-amber-700 pb-[6px] mb-[6px]">
        <h1 className="text-[17px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] text-amber-900 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-500 mt-[3px]">{SAMPLE.location} · {SAMPLE.phone}</p>
      </header>
      <ResumeSection title="Professional Summary" variant="serif" dense className="!mt-0">
        <SummaryParagraph lines={2} />
      </ResumeSection>
      <ResumeSection title="Professional Experience" variant="serif" dense>
        <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
      </ResumeSection>
      <ResumeSection title="Education" variant="serif" dense>
        <EducationBlock />
      </ResumeSection>
      <ResumeSection title="Certifications" variant="serif" dense>
        <CertificationsList />
      </ResumeSection>
    </div>
  );
}

/** 21 — Seattle: Minimal Sidebar with blue-green */
export function LayoutSeattle() {
  return (
    <div className="flex h-full bg-white text-[8.5px]">
      <aside className="w-[30%] bg-sky-50 px-[6px] py-[4px] border-r-2 border-sky-500">
        <h1 className="text-[12px] font-semibold text-slate-900 leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8px] text-sky-700 font-semibold mt-[2px]">{SAMPLE.title}</p>
        <ResumeSection title="Contact" variant="minimal" dense>
          <ContactLines compact includeLinks={false} />
        </ResumeSection>
        <ResumeSection title="Skills" variant="minimal" dense>
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Tools" variant="minimal" dense>
          <ToolsList limit={5} />
        </ResumeSection>
      </aside>
      <main className="flex-1 px-[6px] py-[4px] min-w-0 overflow-hidden">
        <ResumeSection title="Summary" variant="minimal" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="minimal" dense>
          <ExperienceList compact showBullets bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="minimal" dense>
          <EducationBlock compact />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 22 — Austin: Dense ATS with warm gray */
export function LayoutAustin() {
  return (
    <div className="px-[7px] py-[4px] h-full flex flex-col text-black overflow-hidden">
      <header className="border-b-2 border-yellow-700 pb-[5px] shrink-0">
        <h1 className="text-[17px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] mt-[2px]">{SAMPLE.contact} | {SAMPLE.phone}</p>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden pt-[3px] space-y-[4px]">
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Summary</p>
          <SummaryParagraph className="!text-[8px] !text-black" lines={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Experience</p>
          <ExperienceList showBullets maxJobs={3} bulletsPerJob={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Education</p>
          <EducationBlock />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Skills</p>
          <HardSkillsLine />
        </section>
      </div>
    </div>
  );
}

/** 23 — Boston: Academic with brown accent */
export function LayoutBoston() {
  return (
    <div className="px-[6px] py-[5px] h-full text-center overflow-hidden">
      <header>
        <h1 className="text-[19px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[10px] italic text-amber-800 mt-[3px]">{SAMPLE.title}</p>
        <p className="text-[8px] text-slate-500 mt-[4px]">
          {SAMPLE.contact} · {SAMPLE.phone}
        </p>
      </header>
      <div className="border-b-2 border-amber-700 mb-[4px] pb-[4px]" />
      <div className="text-left text-[8px]">
        <ResumeSection title="Summary" variant="serif" dense>
          <SummaryParagraph />
        </ResumeSection>
        <ResumeSection title="Experience" variant="serif" dense>
          <ExperienceList compact showBullets maxJobs={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="serif" dense>
          <EducationBlock />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 24 — Chicago: Executive with red */
export function LayoutChicago() {
  return (
    <div className="h-full flex flex-col bg-[#fafaf9] overflow-hidden">
      <header className="bg-red-900 text-white px-[6px] py-[4px] shrink-0">
        <h1 className="text-[16px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9px] text-red-200 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-red-300 mt-[3px]">{SAMPLE.contact} · {SAMPLE.phone}</p>
      </header>
      <div className="flex-1 px-[7px] py-[5px] min-h-0 overflow-hidden bg-white mx-[4px] mb-[4px] mt-[4px] rounded-sm border border-slate-200/60">
        <ResumeSection title="Summary" variant="caps" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="caps" dense>
          <ExperienceList showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Achievements" variant="caps" dense>
          <AchievementsList limit={1} />
        </ResumeSection>
        <ResumeSection title="Education" variant="caps" dense>
          <EducationBlock compact />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 25 — Amsterdam: Creative with orange-red sidebar */
export function LayoutAmsterdam() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[36%] bg-gradient-to-b from-orange-500 to-orange-700 text-white px-[6px] py-[5px] flex flex-col">
        <h1 className="text-[14px] font-bold leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8.5px] text-orange-100 mt-[2px]">{SAMPLE.title}</p>
        <div className="mt-[8px] space-y-[6px] flex-1">
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-orange-200/90 mb-[2px]">Contact</p>
            <ContactLines inverted compact includeLinks={false} />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-orange-200/90 mb-[2px]">Skills</p>
            <SoftSkillsLine inverted />
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
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 26 — Copenhagen: Modern Profile with emerald */
export function LayoutCopenhagen() {
  return (
    <div className="h-full flex flex-col bg-emerald-50 overflow-hidden">
      <header className="px-[7px] pt-[9px] pb-[7px] flex gap-[8px] items-center bg-white border-b-2 border-emerald-400 shrink-0">
        <ProfileAvatar size="md" />
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
          <p className="text-[9px] text-emerald-600 font-semibold mt-[1px]">{SAMPLE.title}</p>
          <p className="text-[7.5px] text-slate-500 mt-[2px]">{SAMPLE.contact}</p>
        </div>
      </header>
      <div className="flex-1 flex gap-[6px] px-[6px] py-[5px] min-h-0 overflow-hidden">
        <div className="flex-[3] min-w-0 bg-white rounded-sm px-[7px] py-[4px] border border-slate-100 overflow-hidden">
          <ResumeSection title="Experience" variant="accent" dense className="!mt-0">
            <ExperienceList compact showBullets bulletsPerJob={2} />
          </ResumeSection>
        </div>
        <div className="flex-[2] min-w-0 bg-white rounded-sm px-[7px] py-[4px] border border-slate-100 overflow-hidden">
          <ResumeSection title="Education" variant="accent" dense className="!mt-0">
            <EducationBlock />
          </ResumeSection>
          <ResumeSection title="Skills" variant="accent" dense>
            <HardSkillsLine />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

/** 27 — Vienna: Elegant with burgundy */
export function LayoutVienna() {
  return (
    <div className="px-[6px] py-[4px] h-full flex flex-col overflow-hidden">
      <header className="mb-[10px] shrink-0">
        <h1 className="text-[21px] font-normal text-black leading-none tracking-[-0.02em]">
          {SAMPLE.name}
        </h1>
        <p className="text-[8.5px] uppercase tracking-[0.3em] text-red-800 mt-[6px]">{SAMPLE.title}</p>
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
          <p className="text-[7.5px] uppercase tracking-[0.22em] text-black mb-[3px]">Education</p>
          <EducationBlock compact />
        </section>
      </div>
    </div>
  );
}

/** 28 — Geneva: Finance with slate-blue */
export function LayoutGeneva() {
  return (
    <div className="px-[6px] py-[5px] h-full overflow-hidden">
      <header className="text-center border-b-2 border-slate-600 pb-[6px] mb-[6px]">
        <h1 className="text-[17px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] text-slate-700 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-500 mt-[3px]">{SAMPLE.contact}</p>
      </header>
      <ResumeSection title="Professional Summary" variant="serif" dense className="!mt-0">
        <SummaryParagraph lines={2} />
      </ResumeSection>
      <ResumeSection title="Experience" variant="serif" dense>
        <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
      </ResumeSection>
      <ResumeSection title="Education" variant="serif" dense>
        <EducationBlock />
      </ResumeSection>
    </div>
  );
}

/** 29 — Prague: Tech with indigo */
export function LayoutPrague() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-[7px] py-[4px] border-b-2 border-indigo-600 shrink-0">
        <h1 className="text-[16px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold text-indigo-700 mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-600 mt-[3px]">{SAMPLE.github}</p>
      </header>
      <div className="flex-1 px-[7px] py-[4px] min-h-0 overflow-hidden">
        <ResumeSection title="Skills" variant="accent" dense className="!mt-0">
          <HardSkillsLine />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
      </div>
    </div>
  );
}

/** 30 — Helsinki: Dense ATS with teal */
export function LayoutHelsinki() {
  return (
    <div className="px-[7px] py-[4px] h-full flex flex-col text-black overflow-hidden">
      <header className="border-b-2 border-teal-700 pb-[5px] shrink-0">
        <h1 className="text-[17px] font-bold leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] font-semibold mt-[1px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] mt-[2px]">{SAMPLE.contact} | {SAMPLE.phone}</p>
      </header>
      <div className="flex-1 min-h-0 overflow-hidden pt-[3px] space-y-[4px]">
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Summary</p>
          <SummaryParagraph className="!text-[8px] !text-black" lines={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Experience</p>
          <ExperienceList showBullets maxJobs={3} bulletsPerJob={2} />
        </section>
        <section>
          <p className="text-[8.5px] font-bold uppercase mb-[2px]">Education</p>
          <EducationBlock />
        </section>
      </div>
    </div>
  );
}

export function LayoutRightSidebar() {
  return (
    <div className="h-full flex overflow-hidden bg-white">
      <main className="flex-1 px-[7px] py-[5px] min-w-0 overflow-hidden">
        <div className="mb-[8px]">
          <h1 className="text-[18px] font-bold leading-none">{SAMPLE.name}</h1>
          <p className="text-[9.5px] text-slate-600 mt-[2px]">{SAMPLE.title}</p>
        </div>
        <ResumeSection title="Profile" variant="accent" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="accent" dense>
          <ExperienceList compact showBullets bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Education" variant="accent" dense>
          <EducationBlock compact />
        </ResumeSection>
      </main>
      <aside className="w-[33%] min-w-[150px] bg-slate-950 text-white px-[7px] py-[6px] flex flex-col gap-[8px]">
        <div>
          <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400 mb-[4px]">Contact</p>
          <ContactLines inverted compact includeLinks={false} />
        </div>
        <ResumeSection title="Skills" variant="inverted" dense className="!mt-0">
          <HardSkillsLine inverted />
        </ResumeSection>
        <ResumeSection title="Tools" variant="inverted" dense>
          <ToolsList />
        </ResumeSection>
        <ResumeSection title="Languages" variant="inverted" dense>
          <LanguagesLine />
        </ResumeSection>
      </aside>
    </div>
  );
}

export function LayoutSplitBanner() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <header className="bg-slate-900 text-white px-[8px] py-[9px] mb-[8px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div>
            <p className="text-[8px] uppercase tracking-[0.24em] text-slate-400 mb-[6px]">Profile</p>
            <h1 className="text-[22px] font-bold leading-tight">{SAMPLE.name}</h1>
            <p className="text-[9px] text-slate-300 mt-[3px]">{SAMPLE.title}</p>
          </div>
          <div className="text-[8px] space-y-[2px] text-slate-300">
            <p>{SAMPLE.location}</p>
            <p>{SAMPLE.contact}</p>
            <p>{SAMPLE.phone}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 px-[7px] pb-[5px] min-h-0 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr] gap-[8px] h-full">
          <div className="bg-slate-50 rounded-[10px] p-[10px]">
            <ResumeSection title="Career Summary" variant="accent" dense className="!mt-0">
              <SummaryParagraph lines={2} />
            </ResumeSection>
            <ResumeSection title="Projects" variant="accent" dense>
              <ProjectsList withLinks limit={2} />
            </ResumeSection>
          </div>
          <div className="flex flex-col gap-[8px]">
            <div className="bg-slate-50 rounded-[10px] p-[10px]">
              <ResumeSection title="Skills" variant="caps" dense className="!mt-0">
                <HardSkillsLine />
              </ResumeSection>
            </div>
            <div className="bg-slate-50 rounded-[10px] p-[10px]">
              <ResumeSection title="Education" variant="caps" dense className="!mt-0">
                <EducationBlock compact />
              </ResumeSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LayoutBoxedGrid() {
  return (
    <div className="h-full p-[7px] bg-slate-50 overflow-hidden">
      <div className="grid grid-cols-2 gap-[8px] h-full">
        <div className="space-y-[8px]">
          <div className="bg-white rounded-[10px] border border-slate-200 p-[10px]">
            <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500 mb-[4px]">Profile</p>
            <SummaryParagraph lines={1} />
          </div>
          <div className="bg-white rounded-[10px] border border-slate-200 p-[10px] flex-1">
            <ResumeSection title="Experience" variant="minimal" dense className="!mt-0">
              <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} />
            </ResumeSection>
          </div>
        </div>
        <div className="space-y-[8px]">
          <div className="bg-white rounded-[10px] border border-slate-200 p-[10px]">
            <ResumeSection title="Skills" variant="minimal" dense className="!mt-0">
              <HardSkillsLine />
            </ResumeSection>
          </div>
          <div className="bg-white rounded-[10px] border border-slate-200 p-[10px] flex-1">
            <ResumeSection title="Education" variant="minimal" dense className="!mt-0">
              <EducationBlock compact />
            </ResumeSection>
            <ResumeSection title="Tools" variant="minimal" dense>
              <ToolsList limit={5} />
            </ResumeSection>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 31 — Barcelona: Creative with lime-green sidebar */
export function LayoutBarcelonaCreative() {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[36%] bg-gradient-to-b from-lime-500 to-lime-700 text-white px-[6px] py-[5px] flex flex-col">
        <h1 className="text-[14px] font-bold leading-tight">{SAMPLE.name}</h1>
        <p className="text-[8.5px] text-lime-100 mt-[2px]">{SAMPLE.title}</p>
        <div className="mt-[8px] space-y-[6px] flex-1">
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-lime-200/90 mb-[2px]">Portfolio</p>
            <PortfolioLinks inverted />
          </div>
          <div>
            <p className="text-[7.5px] font-bold uppercase tracking-widest text-lime-200/90 mb-[2px]">Skills</p>
            <HardSkillsLine />
          </div>
        </div>
      </div>
      <main className="flex-1 bg-white px-[7px] py-[4px] min-w-0 overflow-hidden">
        <ResumeSection title="Profile" variant="accent" dense className="!mt-0">
          <SummaryParagraph lines={1} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="accent" dense>
          <ProjectsList withLinks limit={2} />
        </ResumeSection>
        <ResumeSection title="Awards" variant="accent" dense>
          <AwardsList />
        </ResumeSection>
      </main>
    </div>
  );
}

/** 32 — Hong Kong: Finance with gold accents */
export function LayoutHongKongFinance() {
  return (
    <div className="px-[6px] py-[5px] h-full overflow-hidden">
      <header className="text-center border-b-2 border-yellow-600 pb-[6px] mb-[6px]">
        <h1 className="text-[17px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
        <p className="text-[9.5px] text-yellow-800 mt-[2px]">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-500 mt-[3px]">{SAMPLE.location} · {SAMPLE.phone}</p>
      </header>
      <ResumeSection title="Executive Profile" variant="serif" dense className="!mt-0">
        <SummaryParagraph lines={2} />
      </ResumeSection>
      <ResumeSection title="Professional Experience" variant="serif" dense>
        <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
      </ResumeSection>
      <ResumeSection title="Education" variant="serif" dense>
        <EducationBlock />
      </ResumeSection>
      <ResumeSection title="Credentials" variant="serif" dense>
        <CertificationsList />
      </ResumeSection>
    </div>
  );
}

// --- Added layouts: Orbit, Comet, Astralis, Nebula, Eclipse ---
export function LayoutOrbit() {
  return (
    <div className="flex h-full bg-white overflow-hidden text-[8.5px]">
      <aside className="w-[22%] border-r border-slate-200 px-[5px] py-[6px] flex flex-col gap-[10px]">
        <div>
          <p className="text-[7px] uppercase tracking-widest text-slate-400 mb-[4px]">Contact</p>
          <ContactLines compact includeLinks={false} />
        </div>
        <div>
          <p className="text-[7px] uppercase tracking-widest text-slate-400 mb-[3px]">Skills</p>
          {SAMPLE.skills.hard.slice(0,4).map(s => (
            <p key={s} className="text-[7.5px] text-slate-700 leading-[1.6]">{s}</p>
          ))}
        </div>
        <div>
          <p className="text-[7px] uppercase tracking-widest text-slate-400 mb-[3px]">Education</p>
          <EducationBlock compact />
        </div>
      </aside>
      <main className="flex-1 px-[8px] py-[6px]">
        <div className="border-b border-slate-900 pb-[5px] mb-[6px]">
          <p className="text-[7px] uppercase tracking-[0.18em] text-slate-400">{SAMPLE.title}</p>
          <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight">
            {SAMPLE.name.toUpperCase()}
          </h1>
        </div>
        <ResumeSection title="Summary" variant="minimal" dense className="!mt-0">
          <SummaryParagraph lines={2} />
        </ResumeSection>
        <ResumeSection title="Experience" variant="minimal" dense>
          <ExperienceList compact showBullets bulletsPerJob={2} />
        </ResumeSection>
        <ResumeSection title="Projects" variant="minimal" dense>
          <ProjectsList limit={2} />
        </ResumeSection>
      </main>
    </div>
  );
}

export function LayoutComet() {
  const accentColor = "bg-yellow-400";
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <header className={`${accentColor} px-[8px] py-[6px] flex items-center gap-[8px]`}>
        <ProfileAvatar size="md" />
        <div>
          <p className="text-[8px] uppercase tracking-[0.2em] text-slate-700">{SAMPLE.title}</p>
          <h1 className="text-[18px] font-black text-slate-900 leading-tight uppercase">
            {SAMPLE.name}
          </h1>
        </div>
      </header>
      <div className="flex gap-[10px] px-[8px] py-[3px] text-[7.5px] text-slate-600 border-b border-slate-200">
        <span>{SAMPLE.contact}</span>
        <span>·</span>
        <span>{SAMPLE.phone}</span>
        <span>·</span>
        <span>{SAMPLE.location}</span>
      </div>
      <div className="flex-1 px-[8px] py-[4px] overflow-hidden">
        {[
          { title: "SUMMARY", content: <SummaryParagraph lines={2} /> },
          { title: "EXPERIENCE", content: <ExperienceList compact showBullets maxJobs={2} bulletsPerJob={2} /> },
          { title: "EDUCATION", content: <EducationBlock compact /> },
          { title: "SKILLS", content: <HardSkillsLine /> },
        ].map(({ title, content }) => (
          <div key={title} className="mb-[6px]">
            <div className="bg-slate-800 text-white px-[5px] py-[1.5px] inline-block mb-[3px]">
              <p className="text-[7px] font-bold tracking-[0.15em]">{title}</p>
            </div>
            {content}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LayoutAstralis() {
  const frameColor = "border-emerald-600";
  const pillColor = "bg-emerald-600 text-white";
  return (
    <div className={`h-full m-[4px] border-[3px] ${frameColor} rounded-sm overflow-hidden bg-white`}>
      <header className="flex items-center gap-[8px] px-[8px] pt-[8px] pb-[5px] border-b border-slate-100">
        <ProfileAvatar size="lg" />
        <div>
          <h1 className="text-[15px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
          <p className="text-[8.5px] text-emerald-700 font-semibold mt-[2px]">{SAMPLE.title}</p>
          <p className="text-[7.5px] text-slate-500 mt-[2px]">{SAMPLE.contact} · {SAMPLE.location}</p>
        </div>
      </header>
      <div className="flex gap-[6px] px-[7px] py-[5px] h-[calc(100%-60px)] overflow-hidden">
        <div className="flex-[3] min-w-0 overflow-hidden">
          <ResumeSection title="Summary" variant="accent" dense className="!mt-0">
            <SummaryParagraph lines={2} />
          </ResumeSection>
          <ResumeSection title="Experience" variant="accent" dense>
            <ExperienceList compact showBullets bulletsPerJob={2} />
          </ResumeSection>
        </div>
        <div className="flex-[2] min-w-0 overflow-hidden">
          <p className="text-[7px] uppercase tracking-widest text-slate-400 mb-[4px]">Skills</p>
          <div className="flex flex-wrap gap-[3px] mb-[6px]">
            {SAMPLE.skills.hard.slice(0,6).map(s => (
              <span key={s} className={`${pillColor} text-[6.5px] px-[4px] py-[1px] rounded-full font-medium`}>
                {s}
              </span>
            ))}
          </div>
          <ResumeSection title="Education" variant="accent" dense>
            <EducationBlock compact />
          </ResumeSection>
          <ResumeSection title="Certifications" variant="accent" dense>
            <CertificationsList limit={2} />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

export function LayoutNebula() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <header className="flex justify-between items-end px-[8px] pt-[8px] pb-[5px] border-b-2 border-slate-700">
        <div>
          <h1 className="text-[20px] font-bold text-slate-900 leading-none">{SAMPLE.name}</h1>
          <p className="text-[9px] text-slate-500 mt-[2px]">{SAMPLE.title}</p>
        </div>
        <div className="text-right text-[7.5px] text-slate-500 space-y-[1px]">
          <p>{SAMPLE.contact}</p>
          <p>{SAMPLE.phone}</p>
          <p>{SAMPLE.location}</p>
        </div>
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden px-[6px] py-[5px] gap-[10px]">
        <div className="w-[55%] overflow-hidden">
          <ResumeSection title="Summary" variant="minimal" dense className="!mt-0">
            <SummaryParagraph lines={2} />
          </ResumeSection>
          <ResumeSection title="Experience" variant="minimal" dense>
            <ExperienceList compact showBullets bulletsPerJob={2} />
          </ResumeSection>
        </div>
        <div className="w-[45%] overflow-hidden border-l border-slate-100 pl-[8px]">
          <ResumeSection title="Education" variant="minimal" dense className="!mt-0">
            <EducationBlock compact />
          </ResumeSection>
          <ResumeSection title="Skills" variant="minimal" dense>
            <HardSkillsLine />
          </ResumeSection>
          <ResumeSection title="Projects" variant="minimal" dense>
            <ProjectsList limit={2} />
          </ResumeSection>
          <ResumeSection title="Languages" variant="minimal" dense>
            <LanguagesLine />
          </ResumeSection>
        </div>
      </div>
    </div>
  );
}

export function LayoutEclipse() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-white px-[8px] py-[6px]">
      <header className="mb-[8px]">
        <h1 className="text-[20px] font-light text-slate-900 leading-none tracking-[-0.01em]">
          {SAMPLE.name}
        </h1>
        <div className="flex items-center gap-[6px] mt-[2px]">
          <div className="h-[1.5px] w-[20px] bg-slate-400" />
          <p className="text-[8.5px] text-slate-500">{SAMPLE.title}</p>
        </div>
        <p className="text-[7.5px] text-slate-400 mt-[3px]">{SAMPLE.contact} · {SAMPLE.location}</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <p className="text-[7px] uppercase tracking-[0.2em] text-slate-400 mb-[5px]">Experience</p>
        <div className="relative pl-[12px] border-l-2 border-slate-200 space-y-[6px] mb-[8px]">
          <div className="absolute left-[-5px] top-[2px] w-[8px] h-[8px] rounded-full bg-slate-900" />
          <ExperienceList compact showBullets bulletsPerJob={2} maxJobs={2} />
        </div>
        <div className="grid grid-cols-2 gap-[8px] mt-[6px]">
          <div>
            <p className="text-[7px] uppercase tracking-[0.2em] text-slate-400 mb-[3px]">Education</p>
            <EducationBlock compact />
          </div>
          <div>
            <p className="text-[7px] uppercase tracking-[0.2em] text-slate-400 mb-[3px]">Skills</p>
            <HardSkillsLine />
            <p className="text-[7px] uppercase tracking-[0.2em] text-slate-400 mt-[4px] mb-[3px]">Languages</p>
            <LanguagesLine />
          </div>
        </div>
      </div>
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
  london: LayoutLondon,
  zurich: LayoutZurich,
  oslo: LayoutOslo,
  berlin: LayoutBerlin,
  stockholm: LayoutStockholm,
  paris: LayoutParis,
  milan: LayoutMilan,
  tokyo: LayoutTokyo,
  singapore: LayoutSingapore,
  sydney: LayoutSydney,
  toronto: LayoutToronto,
  seattle: LayoutSeattle,
  austin: LayoutAustin,
  boston: LayoutBoston,
  chicago: LayoutChicago,
  amsterdam: LayoutAmsterdam,
  copenhagen: LayoutCopenhagen,
  vienna: LayoutVienna,
  geneva: LayoutGeneva,
  prague: LayoutPrague,
  helsinki: LayoutHelsinki,
  orbit: LayoutOrbit,
  comet: LayoutComet,
  astralis: LayoutAstralis,
  nebula: LayoutNebula,
  eclipse: LayoutEclipse,
  "right-sidebar": LayoutRightSidebar,
  "split-banner": LayoutSplitBanner,
  "boxed-grid": LayoutBoxedGrid,
  "barcelona-creative": LayoutBarcelonaCreative,
  "hong-kong-finance": LayoutHongKongFinance,
};
