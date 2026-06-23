import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";
import {
  CertificationsList,
  ContactLines,
  EducationBlock,
  ExperienceList,
  HardSkillsLine,
  LanguagesLine,
  LeadershipList,
  ProjectsList,
  SAMPLE,
  SkillsTags,
  ToolsList,
} from "./resume-preview-parts";

// 1. Ironclad ATS - Strict single-column ATS layout with square left avatar
export function LayoutIroncladAts() {
  return (
    <div className="px-6 py-5 h-full bg-white text-black overflow-hidden font-serif select-none text-[8.5px] leading-relaxed">
      <header className="flex gap-4 items-center border-b border-black pb-2 mb-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-300">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-black">{SAMPLE.name}</h1>
          <p className="text-[9.5px] italic text-slate-800 font-medium">{SAMPLE.title}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px] text-slate-700 mt-1 font-sans">
            <span>{SAMPLE.contact}</span>
            <span>·</span>
            <span>{SAMPLE.phone}</span>
            <span>·</span>
            <span>{SAMPLE.location}</span>
          </div>
        </div>
      </header>
      <div className="space-y-3 font-sans">
        <section>
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 font-serif">Professional Summary</h2>
          <p className="text-[8.5px] text-slate-800 leading-normal">{SAMPLE.summary}</p>
        </section>
        <section>
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 font-serif">Work Experience</h2>
          <ExperienceList showBullets compact maxJobs={3} bulletsPerJob={2} />
        </section>
        <section>
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 font-serif">Education</h2>
          <EducationBlock compact />
        </section>
        <section>
          <h2 className="text-[9.5px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1 font-serif">Technical Skills</h2>
          <HardSkillsLine />
        </section>
      </div>
    </div>
  );
}

// 2. Synergy Pro - Elegant asymmetric left-sidebar layout with red accents
export function LayoutSynergyPro() {
  return (
    <div className="flex h-full bg-white text-[8.5px] overflow-hidden font-sans">
      <aside className="w-[32%] bg-[#faf9f6] px-4 py-5 border-r border-stone-200 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full ring-2 ring-red-600/20 overflow-hidden bg-slate-100 shadow-sm mb-3">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">{SAMPLE.name}</h1>
            <p className="text-[7.5px] font-semibold text-red-700 mt-1 uppercase tracking-wider">{SAMPLE.title}</p>
          </div>
          
          <div className="h-px bg-red-200/50" />

          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-red-700 mb-1.5">Contact</h4>
            <ContactLines compact includeLinks={false} />
          </div>
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-red-700 mb-1.5">Core Skills</h4>
            <SkillsTags limit={6} />
          </div>
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-red-700 mb-1.5">Languages</h4>
            <LanguagesLine />
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-red-700 mb-1">Education</h4>
          <EducationBlock compact />
        </div>
      </aside>
      <main className="flex-1 px-5 py-5 overflow-hidden flex flex-col justify-between">
        <div className="space-y-3.5">
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800 border-b-2 border-red-600/80 pb-[3px] mb-2">
              Executive Summary
            </h4>
            <p className="text-[8.5px] text-slate-600 leading-relaxed">{SAMPLE.summary}</p>
          </section>
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800 border-b-2 border-red-600/80 pb-[3px] mb-2">
              Professional Experience
            </h4>
            <ExperienceList showBullets dateRight maxJobs={3} bulletsPerJob={2} />
          </section>
          <section>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-800 border-b-2 border-red-600/80 pb-[3px] mb-2">
              Featured Projects
            </h4>
            <ProjectsList withLinks limit={2} />
          </section>
        </div>
      </main>
    </div>
  );
}

// 3. Pinnacle Executive - Impressive 35% solid dark brown left-sidebar with white-bordered circular photo
export function LayoutPinnacleExecutive() {
  return (
    <div className="flex h-full bg-white text-[8.5px] overflow-hidden font-sans">
      <aside className="w-[35%] bg-[#3e2723] text-stone-100 px-4 py-5 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-slate-100 shadow-md mb-3">
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-[15px] font-serif font-bold text-white tracking-wide leading-tight">{SAMPLE.name}</h1>
            <p className="text-[8px] font-semibold text-amber-300 mt-1 uppercase tracking-widest">{SAMPLE.title}</p>
          </div>
          
          <div className="h-px bg-white/20" />

          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-300 mb-1.5 font-serif">Contact</h4>
            <div className="text-[8px] leading-snug space-y-[2px] text-stone-300">
              <p>{SAMPLE.contact}</p>
              <p>{SAMPLE.phone}</p>
              <p>{SAMPLE.location}</p>
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-300 mb-1.5 font-serif">Core Competencies</h4>
            <div className="flex flex-wrap gap-[3px]">
              {SAMPLE.skills.hard.slice(0, 5).map((s) => (
                <span key={s} className="bg-white/10 text-white text-[7px] font-medium px-[4px] py-[1px] rounded-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-amber-300 mb-1 font-serif">Education</h4>
          <div className="text-stone-300 text-[8px]">
            <p className="font-semibold text-white">{SAMPLE.education.degree}</p>
            <p>{SAMPLE.education.school}</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 px-5 py-5 overflow-hidden flex flex-col justify-between bg-stone-50 text-stone-900 font-serif">
        <div className="space-y-4">
          <section>
            <h4 className="text-[11px] font-bold text-stone-950 border-b border-stone-300 pb-[3px] mb-2 uppercase tracking-wide">
              Executive Profile
            </h4>
            <p className="text-[8.5px] text-stone-700 leading-relaxed font-sans">{SAMPLE.summary}</p>
          </section>
          <section>
            <h4 className="text-[11px] font-bold text-stone-950 border-b border-stone-300 pb-[3px] mb-2 uppercase tracking-wide">
              Leadership Experience
            </h4>
            <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
          </section>
          <section>
            <h4 className="text-[11px] font-bold text-stone-950 border-b border-stone-300 pb-[3px] mb-2 uppercase tracking-wide">
              Board & Achievements
            </h4>
            <LeadershipList limit={2} />
          </section>
        </div>
      </main>
    </div>
  );
}

// 4. Chronos Modern - Modern layout with split banner header and rose ringed avatar
export function LayoutChronosModern() {
  return (
    <div className="px-6 py-5 h-full bg-[#fcf8f8] text-slate-900 overflow-hidden font-sans text-[8.5px] leading-relaxed">
      <header className="relative flex items-center justify-between border-b border-pink-200 pb-3 mb-3 bg-gradient-to-r from-pink-500/10 via-orange-500/5 to-transparent p-3 rounded-xl">
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">{SAMPLE.name}</h1>
          <p className="text-[9px] font-bold text-pink-600 uppercase tracking-widest mt-1.5">{SAMPLE.title}</p>
          <div className="flex gap-2 text-[7.5px] text-slate-500 mt-2 font-medium">
            <span>{SAMPLE.contact}</span>
            <span>·</span>
            <span>{SAMPLE.phone}</span>
            <span>·</span>
            <span>{SAMPLE.location}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-full ring-4 ring-pink-500 overflow-hidden bg-slate-100 shrink-0 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </header>
      <div className="space-y-3">
        <section>
          <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-pink-600 mb-1">About Me</h4>
          <p className="text-slate-700">{SAMPLE.summary}</p>
        </section>
        <section>
          <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-pink-600 mb-1.5">Core Competencies</h4>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE.skills.hard.map((s, idx) => {
              const gradients = [
                "from-pink-500/10 to-pink-500/20 text-pink-700 border-pink-200/50",
                "from-orange-500/10 to-orange-500/20 text-orange-700 border-orange-200/50",
                "from-indigo-500/10 to-indigo-500/20 text-indigo-700 border-indigo-200/50",
                "from-teal-500/10 to-teal-500/20 text-teal-700 border-teal-200/50",
              ];
              const grad = gradients[idx % gradients.length];
              return (
                <span key={s} className={`bg-gradient-to-r ${grad} border text-[7.5px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm`}>
                  {s}
                </span>
              );
            })}
          </div>
        </section>
        <section>
          <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-pink-600 mb-1.5">Professional Experience</h4>
          <ExperienceList showBullets dateRight maxJobs={2} bulletsPerJob={2} />
        </section>
        <div className="grid grid-cols-2 gap-4">
          <section>
            <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-pink-600 mb-1">Education</h4>
            <EducationBlock compact />
          </section>
          <section>
            <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-pink-600 mb-1">Featured Project</h4>
            <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
              <p className="font-bold text-slate-800 text-[8px]">{SAMPLE.projects[0].name}</p>
              <p className="text-[7.5px] text-slate-500 leading-normal">{SAMPLE.projects[0].detail}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// 5. Strategy Pro - Vertical timeline layout with dotted rails
export function LayoutStrategyPro() {
  return (
    <div className="px-6 py-5 h-full bg-[#f8fafc] text-slate-900 overflow-hidden font-serif text-[8.5px] leading-relaxed">
      <header className="flex justify-between items-center border-b border-indigo-950 pb-2.5 mb-3.5">
        <div>
          <h1 className="text-lg font-bold tracking-tight uppercase text-indigo-950 leading-none">{SAMPLE.name}</h1>
          <p className="text-[7px] text-indigo-700 uppercase tracking-[0.2em] mt-1 font-sans font-semibold">{SAMPLE.title}</p>
        </div>
        <div className="text-right text-[7.5px] font-sans text-slate-500">
          <p>{SAMPLE.contact} | {SAMPLE.phone}</p>
          <p>{SAMPLE.location}</p>
        </div>
      </header>
      
      <div className="space-y-4">
        <section>
          <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1.5 font-sans">Summary</h4>
          <p className="text-[8.5px] text-slate-700 leading-normal font-sans">{SAMPLE.summary}</p>
        </section>

        <section>
          <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-950 mb-3 font-sans">Career Timeline</h4>
          <div className="relative border-l-2 border-dashed border-indigo-400 pl-4 ml-2 space-y-4 font-sans">
            {SAMPLE.experience.slice(0, 3).map((job) => (
              <div key={job.company} className="relative">
                <span className="absolute left-[-21.5px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow" />
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-bold text-slate-950">
                    {job.role} <span className="font-semibold text-indigo-700">· {job.company}</span>
                  </span>
                  <span className="text-[8px] font-semibold text-indigo-900 tabular-nums">{job.period}</span>
                </div>
                <ul className="mt-1 space-y-0.5 pl-3 list-disc text-slate-600 text-[8px]">
                  {job.bullets.slice(0, 2).map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 font-sans mt-2">
          <section>
            <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1.5">Education</h4>
            <EducationBlock compact />
          </section>
          <section>
            <h4 className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1.5">Core Skills</h4>
            <HardSkillsLine />
          </section>
        </div>
      </div>
    </div>
  );
}

// 6. Block Minimalist - Notion style blocks with clean gray callout highlights
export function LayoutBlockMinimalist() {
  return (
    <div className="px-6 py-5 h-full bg-white text-slate-900 overflow-hidden font-sans text-[8.5px] leading-relaxed">
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-black flex items-center gap-1.5">
          <span>🚀</span> {SAMPLE.name}
        </h1>
        <p className="text-[9px] text-slate-500 font-mono mt-0.5">{SAMPLE.title}</p>
        <p className="text-[7.5px] text-slate-400 font-mono mt-1">
          {SAMPLE.contact} · {SAMPLE.phone} · {SAMPLE.location}
        </p>
      </header>
      
      <div className="space-y-3 font-sans">
        <div className="bg-[#f3f4f6]/80 p-2.5 rounded-lg border border-slate-200/50 flex gap-2.5">
          <span className="text-xs shrink-0 select-none">💡</span>
          <div>
            <p className="text-[7.5px] font-mono uppercase tracking-wider text-slate-500 mb-0.5">Profile Summary</p>
            <p className="text-slate-800 leading-normal text-[8px]">{SAMPLE.summary}</p>
          </div>
        </div>

        <section>
          <h4 className="text-[9px] font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 font-mono">/ education</h4>
          <div className="bg-[#f9fafb] p-2.5 rounded-lg border border-slate-200/40">
            <EducationBlock compact />
          </div>
        </section>

        <section>
          <h4 className="text-[9px] font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 font-mono">/ experience</h4>
          <div className="space-y-2">
            {SAMPLE.experience.slice(0, 2).map((job) => (
              <div key={job.company} className="bg-slate-50 p-2 rounded-lg border border-slate-200/20">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-slate-900 text-[8.5px]">{job.role} <span className="font-normal text-slate-500">at {job.company}</span></span>
                  <span className="text-[7.5px] text-slate-400 font-mono">{job.period}</span>
                </div>
                <p className="text-[7.5px] text-slate-600 mt-1 pl-2 border-l border-slate-300">{job.bullets[0]}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-[9px] font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2 font-mono">/ skills</h4>
          <div className="flex flex-wrap gap-1">
            {SAMPLE.skills.hard.map((s) => (
              <span key={s} className="bg-slate-100 text-slate-700 text-[7px] font-mono px-2 py-0.5 rounded border border-slate-200/50">
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// 7. Linear Tech - Monospace dark mode engineering spec sheet
export function LayoutLinearTech() {
  return (
    <div className="px-6 py-5 h-full bg-[#09090b] text-[#a1a1aa] overflow-hidden text-[8px] leading-relaxed font-mono select-none">
      <header className="border-b border-zinc-800 pb-3 mb-3 flex justify-between items-start">
        <div>
          <h1 className="text-base font-extrabold text-white tracking-tight leading-none">{SAMPLE.name}</h1>
          <p className="text-[8.5px] text-blue-500 mt-1.5">const title = &quot;{SAMPLE.title}&quot;;</p>
        </div>
        <div className="text-right text-[7px] text-zinc-500 space-y-0.5">
          <p>{SAMPLE.contact}</p>
          <p>{SAMPLE.phone}</p>
          <p>{SAMPLE.github}</p>
        </div>
      </header>
      
      <div className="space-y-4">
        <section className="border-b border-zinc-800 pb-3">
          <h4 className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">Stack Trace</h4>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE.skills.hard.map((s) => (
              <span key={s} className="bg-[#18181b] text-blue-400 border border-zinc-800 text-[7px] px-2 py-0.5 rounded shadow-sm">
                {s}
              </span>
            ))}
          </div>
        </section>

        <section className="border-b border-zinc-800 pb-3">
          <h4 className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">Capabilities / Work History</h4>
          <div className="space-y-2.5">
            {SAMPLE.experience.slice(0, 2).map((job) => (
              <div key={job.company}>
                <div className="flex justify-between items-baseline">
                  <span className="text-[8.5px] font-bold text-white">
                    {job.role} <span className="font-normal text-zinc-500">@{job.company}</span>
                  </span>
                  <span className="text-[7px] text-zinc-500">{job.period}</span>
                </div>
                <p className="text-[7.5px] text-zinc-400 mt-1 pl-2 border-l border-zinc-700">{job.bullets[0]}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section>
            <h4 className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Education</h4>
            <div className="text-zinc-400">
              <p className="font-bold text-white">{SAMPLE.education.degree}</p>
              <p className="text-zinc-500">{SAMPLE.education.school} / {SAMPLE.education.year}</p>
            </div>
          </section>
          <section>
            <h4 className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Open Source</h4>
            <ProjectsList limit={2} />
          </section>
        </div>
      </div>
    </div>
  );
}

// 8. AI Builder - Right-hand AI/LLM developer sidebar
export function LayoutAiBuilder() {
  return (
    <div className="flex h-full bg-[#030712] text-[8.5px] overflow-hidden text-slate-300 font-mono">
      <main className="flex-1 px-5 py-5 overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full ring-2 ring-emerald-500 overflow-hidden bg-slate-100 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">{SAMPLE.name}</h1>
              <p className="text-[8.5px] text-emerald-500 mt-1 uppercase tracking-widest">AI / LLM Engineer</p>
            </div>
          </div>
          <div className="h-px bg-slate-800 my-3.5" />
          
          <div className="space-y-4">
            <section>
              <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">AI Engineering Profile</h4>
              <p className="text-slate-400 leading-relaxed font-sans">{SAMPLE.summary}</p>
            </section>
            <section>
              <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1.5">Engineering Track</h4>
              <ExperienceList showBullets compact maxJobs={2} bulletsPerJob={2} />
            </section>
            <section>
              <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">AI Projects Shipped</h4>
              <ProjectsList withLinks limit={2} />
            </section>
          </div>
        </div>
      </main>
      <aside className="w-[32%] bg-[#090d16] px-3.5 py-5 border-l border-slate-800 flex flex-col justify-between shrink-0 font-mono">
        <div className="space-y-4">
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1.5">LLM & ML Stack</h4>
            <div className="flex flex-wrap gap-1">
              {["PyTorch", "LangChain", "OpenAI API", "VectorDB", "LlamaIndex", "HuggingFace"].map((tech) => (
                <span key={tech} className="bg-slate-900 border border-slate-800 text-[6.5px] px-1.5 py-0.5 text-slate-300 rounded">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">Automation Tools</h4>
            <ToolsList limit={4} />
          </div>
          <div>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">Contact</h4>
            <div className="text-[7.5px] leading-snug space-y-[2px] text-slate-400">
              <p>{SAMPLE.contact}</p>
              <p>{SAMPLE.phone}</p>
              <p>{SAMPLE.location}</p>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mb-1">Credentials</h4>
          <EducationBlock compact />
        </div>
      </aside>
    </div>
  );
}

// 9. Neo Gradient - Framer magazine style with violet-to-pink gradient accents
export function LayoutNeoGradient() {
  return (
    <div className="px-6 py-5 h-full bg-[#08070a] text-slate-300 overflow-hidden font-sans text-[8.5px] leading-relaxed select-none">
      <header className="relative mb-3 flex justify-between items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            {SAMPLE.name}
          </h1>
          <p className="text-[9px] text-slate-400 font-bold tracking-[0.2em] mt-1.5 uppercase">{SAMPLE.title}</p>
          <div className="flex gap-2.5 text-[7.5px] text-slate-500 mt-2">
            <span>{SAMPLE.contact}</span>
            <span>·</span>
            <span>{SAMPLE.phone}</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-purple-500 shrink-0 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80"
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </header>
      
      <div className="h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-transparent mb-3.5 rounded-full" />
      
      <div className="space-y-4">
        <section>
          <p className="text-[8.5px] text-slate-200 font-medium leading-relaxed">{SAMPLE.summary}</p>
        </section>

        <section>
          <h4 className="text-[8px] font-bold tracking-[0.2em] uppercase text-purple-400">Featured Builds</h4>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {SAMPLE.projects.slice(0, 2).map((p) => (
              <div key={p.name} className="border border-purple-900/35 bg-[#120f18] p-2.5 rounded-lg shadow-sm">
                <span className="text-[8px] font-bold text-white block">{p.name}</span>
                <span className="text-[7.5px] text-slate-400 mt-1 block leading-normal">{p.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-[8px] font-bold tracking-[0.2em] uppercase text-purple-400 mb-1.5">Professional Tracks</h4>
          <ExperienceList showBullets compact maxJobs={2} bulletsPerJob={2} />
        </section>

        <div className="grid grid-cols-2 gap-4">
          <section>
            <h4 className="text-[8px] font-bold tracking-[0.2em] uppercase text-purple-400 mb-1.5">Technologies</h4>
            <div className="flex flex-wrap gap-1">
              {SAMPLE.skills.hard.slice(0, 5).map((s) => (
                <span key={s} className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-slate-200 text-[6.5px] font-semibold px-2 py-0.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h4 className="text-[8px] font-bold tracking-[0.2em] uppercase text-purple-400 mb-1">Academics</h4>
            <EducationBlock compact />
          </section>
        </div>
      </div>
    </div>
  );
}

// 10. Glass Resume - visionOS translucent card interface
export function LayoutGlassResume() {
  return (
    <div className="p-4 h-full bg-gradient-to-br from-[#0c1020] via-[#1a1738] to-[#0c1020] text-white overflow-hidden text-[8px] leading-relaxed flex flex-col gap-3 font-sans select-none">
      <header className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-sky-400/40 overflow-hidden shrink-0 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-[13px] font-extrabold text-white leading-none">{SAMPLE.name}</h1>
            <p className="text-[8px] text-sky-400 font-semibold mt-1 uppercase tracking-wider">{SAMPLE.title}</p>
          </div>
        </div>
        <div className="text-right text-[7px] text-slate-300">
          <p>{SAMPLE.contact}</p>
          <p>{SAMPLE.phone}</p>
        </div>
      </header>
      
      <div className="grid grid-cols-[3fr_2fr] gap-3 flex-1 min-h-0">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg overflow-hidden flex flex-col justify-between">
          <div>
            <h4 className="text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-1.5">Profile</h4>
            <p className="text-slate-200 mt-1 leading-normal text-[8px]">{SAMPLE.summary}</p>
          </div>
          <div className="mt-3">
            <h4 className="text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-1.5">Experience</h4>
            <ExperienceList showBullets compact maxJobs={2} bulletsPerJob={2} />
          </div>
        </div>
        <div className="space-y-3 overflow-hidden flex flex-col justify-between">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg flex-1">
            <h4 className="text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-1">Technologies</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {SAMPLE.skills.hard.slice(0, 5).map((s) => (
                <span key={s} className="bg-white/10 border border-white/10 text-[6.5px] px-1.5 py-0.5 text-slate-200 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-lg flex-1">
            <h4 className="text-[9px] font-bold text-sky-300 uppercase tracking-widest mb-1">Academic</h4>
            <EducationBlock compact />
          </div>
        </div>
      </div>
    </div>
  );
}

// 11. Card Stack - Dashboard Bento grid layout
export function LayoutCardStack() {
  return (
    <div className="p-3.5 h-full bg-[#f4f4f7] text-slate-900 overflow-hidden text-[8px] leading-relaxed flex flex-col gap-2.5 font-sans">
      <div className="grid grid-cols-[1fr_2fr] gap-2.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-[12px] font-extrabold text-slate-950 leading-none">{SAMPLE.name}</h1>
            <p className="text-[7.5px] text-indigo-600 font-semibold mt-1 uppercase tracking-wider">{SAMPLE.title}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div className="text-[7.5px] text-slate-500 space-y-0.5">
            <p>📧 {SAMPLE.contact}</p>
            <p>📞 {SAMPLE.phone}</p>
          </div>
          <div className="text-right text-[7.5px] text-slate-500">
            <p>📍 {SAMPLE.location}</p>
            <p>🔗 {SAMPLE.website}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-[3fr_2fr] gap-2.5 flex-1 min-h-0">
        <div className="space-y-2.5 flex flex-col">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex-1 overflow-hidden">
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1 border-b pb-0.5">Summary</h4>
            <p className="text-slate-600 text-[8px] leading-normal">{SAMPLE.summary}</p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex-[2] overflow-hidden">
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1 border-b pb-0.5">Experience</h4>
            <ExperienceList showBullets compact maxJobs={2} bulletsPerJob={2} />
          </div>
        </div>
        
        <div className="space-y-2.5 flex flex-col">
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex-1 overflow-hidden">
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1.5 border-b pb-0.5">Skills Stack</h4>
            <div className="flex flex-wrap gap-1">
              {SAMPLE.skills.hard.slice(0, 6).map((s) => (
                <span key={s} className="bg-indigo-50 border border-indigo-100 text-[6.5px] font-semibold text-indigo-800 px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-sm flex-1 overflow-hidden">
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-indigo-950 mb-1 border-b pb-0.5">Education</h4>
            <EducationBlock compact />
          </div>
        </div>
      </div>
    </div>
  );
}

// 12. Startup Operator - High-density growth experiment focus with YC Orange elements
export function LayoutStartupOperator() {
  return (
    <div className="flex h-full bg-white text-[8.5px] overflow-hidden text-slate-800 leading-relaxed select-none font-sans">
      <main className="flex-1 px-5 py-5 overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full ring-2 ring-[#ff6600] overflow-hidden bg-slate-100 shrink-0">
              <img
                src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=120&h=120&q=80"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">{SAMPLE.name}</h1>
              <p className="text-[9px] font-bold text-[#ff6600] mt-1 uppercase tracking-widest">{SAMPLE.title}</p>
              <p className="text-[7.5px] text-slate-400 mt-1">{SAMPLE.contact} · {SAMPLE.phone}</p>
            </div>
          </div>
          <div className="h-px bg-slate-100 my-3" />
          
          <div className="space-y-3.5">
            <section>
              <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6600] mb-1.5">Growth Narrative</h4>
              <p className="text-slate-600 mt-1 leading-normal text-[8px]">{SAMPLE.summary}</p>
            </section>
            <section>
              <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6600] mb-1.5">Growth & Experiments</h4>
              <div className="space-y-3">
                {SAMPLE.experience.slice(0, 2).map((job) => (
                  <div key={job.company}>
                    <p className="text-[9px] font-bold text-slate-900 leading-tight">
                      {job.role} <span className="font-semibold text-[#ff6600]">· {job.company}</span>
                    </p>
                    <span className="text-[7.5px] text-slate-400">{job.period}</span>
                    <div className="mt-1 space-y-0.5 pl-2 border-l border-orange-200 text-[8px]">
                      <p className="text-slate-700">
                        <span className="font-bold text-[#ff6600]">Experiment:</span> {job.bullets[0]}
                      </p>
                      {job.bullets[1] && (
                        <p className="text-slate-700">
                          <span className="font-bold text-[#ff6600]">Outcome:</span> {job.bullets[1]}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <aside className="w-[30%] bg-[#fff8f5] px-4 py-5 border-l border-slate-150 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <section>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6600] mb-1.5">Competencies</h4>
            <SkillsTags limit={8} />
          </section>
          <section>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6600] mb-1.5">Tools Stack</h4>
            <ToolsList limit={6} />
          </section>
          <section>
            <h4 className="text-[9px] font-extrabold uppercase tracking-wider text-[#ff6600] mb-1">Academics</h4>
            <EducationBlock compact />
          </section>
        </div>
      </aside>
    </div>
  );
}

export const PREVIEW_LAYOUTS: Record<TemplatePreviewVariant, () => JSX.Element> = {
  "ironclad-ats": LayoutIroncladAts,
  "synergy-pro": LayoutSynergyPro,
  "pinnacle-executive": LayoutPinnacleExecutive,
  "chronos-modern": LayoutChronosModern,
  "strategy-pro": LayoutStrategyPro,
  "block-minimalist": LayoutBlockMinimalist,
  "linear-tech": LayoutLinearTech,
  "ai-builder": LayoutAiBuilder,
  "neo-gradient": LayoutNeoGradient,
  "glass-resume": LayoutGlassResume,
  "card-stack": LayoutCardStack,
  "startup-operator": LayoutStartupOperator,
};
