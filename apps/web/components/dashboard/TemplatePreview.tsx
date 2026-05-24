import type { TemplatePreviewVariant } from "../../lib/dashboard-templates";

type Props = {
  variant: TemplatePreviewVariant;
  className?: string;
};

export function TemplatePreview({ variant, className = "" }: Props) {
  const base = `w-full h-full bg-white shadow-sm border border-slate-200/80 rounded-lg overflow-hidden flex ${className}`;

  if (variant === "sidebar") {
    return (
      <div className={base}>
        <div className="w-[28%] bg-primary/15 p-2 flex flex-col gap-1.5">
          <div className="h-3 w-3/4 rounded bg-primary/40" />
          <div className="h-1.5 w-full rounded bg-primary/25" />
          <div className="h-1.5 w-4/5 rounded bg-primary/25" />
          <div className="mt-auto h-1.5 w-2/3 rounded bg-primary/20" />
        </div>
        <div className="flex-1 p-2.5 flex flex-col gap-1.5">
          <div className="h-2.5 w-1/2 rounded bg-slate-300" />
          <div className="h-1.5 w-full rounded bg-slate-200" />
          <div className="h-1.5 w-11/12 rounded bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded bg-slate-200" />
        </div>
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className={`${base} flex-col p-3 gap-2`}>
        <div className="h-2 w-1/3 rounded bg-slate-800 mx-auto" />
        <div className="h-px w-full bg-slate-200" />
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-10/12 rounded bg-slate-200 mx-auto" />
        <div className="h-1.5 w-full rounded bg-slate-200" />
      </div>
    );
  }

  if (variant === "creative") {
    return (
      <div className={`${base} flex-col`}>
        <div className="h-[30%] bg-gradient-to-r from-primary/30 to-violet-200/50 p-2">
          <div className="h-3 w-1/2 rounded bg-white/80" />
        </div>
        <div className="flex-1 p-2.5 flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded bg-slate-200" />
          <div className="h-1.5 w-5/6 rounded bg-slate-200" />
          <div className="h-8 w-full rounded bg-slate-100 border border-dashed border-slate-200" />
        </div>
      </div>
    );
  }

  if (variant === "ats") {
    return (
      <div className={`${base} flex-col p-2.5 gap-1 font-mono text-[6px] text-slate-500`}>
        <div className="h-2.5 w-2/5 rounded bg-slate-800" />
        <div className="text-[7px] font-bold text-slate-700 uppercase tracking-wide">
          Professional Summary
        </div>
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="h-1 w-full rounded bg-slate-200" />
        <div className="text-[7px] font-bold text-slate-700 uppercase tracking-wide mt-1">
          Experience
        </div>
        <div className="h-1 w-11/12 rounded bg-slate-200" />
        <div className="h-1 w-10/12 rounded bg-slate-200" />
      </div>
    );
  }

  if (variant === "modern") {
    return (
      <div className={`${base} flex-col p-2.5 gap-1.5`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/30 shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 w-2/3 rounded bg-slate-700" />
            <div className="h-1.5 w-1/2 rounded bg-primary/40" />
          </div>
        </div>
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-4/5 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className={`${base} flex-col p-2.5 gap-1.5`}>
      <div className="h-3 w-2/5 rounded bg-slate-700" />
      <div className="h-1.5 w-full rounded bg-slate-200" />
      <div className="h-1.5 w-11/12 rounded bg-slate-200" />
      <div className="h-1.5 w-4/5 rounded bg-slate-200" />
    </div>
  );
}
