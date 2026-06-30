import React from "react";

type Course = {
  id: string;
  title: string;
  url: string;
  provider: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationWeeks: number;
};

type Props = {
  course: Course;
};

export function CourseCard({ course }: Props) {
  const isYouTube = course.url.includes("youtube.com") || course.url.includes("youtu.be");

  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex gap-3 items-start">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
          isYouTube ? "bg-red-50 text-red-500 group-hover:bg-red-100" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
        } transition-colors`}>
          <span className="material-symbols-outlined text-[20px]">
            {isYouTube ? "play_circle" : "school"}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {course.provider}
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {course.durationWeeks} {course.durationWeeks === 1 ? "week" : "weeks"}
            </span>
          </div>
          <h5 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
            {course.title}
          </h5>
          <div className="flex items-center gap-1.5 pt-1">
            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none ${
              course.difficulty === "ADVANCED"
                ? "bg-rose-50 text-rose-600"
                : course.difficulty === "INTERMEDIATE"
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }`}>
              {course.difficulty}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
