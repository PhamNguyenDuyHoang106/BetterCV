"use client";

import Link from "next/link";
import { DashEmptyState } from "../dashboard-ui";

type Cv = { id: string; title: string; updatedAt?: string; createdAt?: string };

type Props = {
  filteredCvs: Cv[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onGoTemplates: () => void;
  getAtsScore: (id: string) => number;
  formatDate: (d?: string) => string;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
};

function scoreBadgeClass(score: number) {
  if (score >= 88) return "dash-score-high";
  if (score >= 80) return "dash-score-mid";
  return "dash-score-low";
}

export function DashboardResumesTab({
  filteredCvs,
  searchQuery,
  onSearchChange,
  onGoTemplates,
  getAtsScore,
  formatDate,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined">folder_open</span>
          </span>
          <h2 className="text-xl font-bold text-slate-900">Danh sách CV</h2>
        </div>
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="dash-search-input"
            placeholder="Search resumes..."
            type="text"
          />
        </div>
      </div>

      {filteredCvs.length === 0 ? (
        <DashEmptyState
          icon="description"
          title="Chưa có CV nào"
          description={
            <>
              Tạo CV đầu tiên hoặc chọn mẫu có sẵn tại tab <strong>Mẫu CV</strong>.
            </>
          }
          action={
            <button type="button" onClick={onGoTemplates} className="dash-btn-primary">
              Chọn mẫu CV
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-2">
          {filteredCvs.map((cv) => {
            const score = getAtsScore(cv.id);
            return (
              <article key={cv.id} className="dash-resume-card group">
                <Link
                  href={`/cv/${cv.id}`}
                  className="block h-44 rounded-xl mb-4 relative overflow-hidden dash-resume-preview"
                >
                  <div className="absolute inset-0 flex items-center justify-center p-6">
                    <div className="w-[78%] h-[88%] bg-white rounded shadow-lg border border-slate-100 p-3 flex flex-col gap-1.5 transition-transform group-hover:scale-[1.04]">
                      <div className="h-3 w-2/5 bg-slate-800 rounded-sm" />
                      <div className="h-1.5 w-full bg-slate-200 rounded-sm mt-1" />
                      <div className="h-1.5 w-11/12 bg-slate-200 rounded-sm" />
                      <div className="h-1.5 w-4/5 bg-slate-100 rounded-sm" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/35 transition-colors flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                    <span className="dash-btn-primary !py-2 !px-5 !text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">edit</span>
                      Edit
                    </span>
                  </div>
                </Link>

                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate" title={cv.title}>
                      {cv.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      Updated: {formatDate(cv.updatedAt || cv.createdAt)}
                    </p>
                  </div>
                  <span className={`dash-ats-pill ${scoreBadgeClass(score)}`}>
                    {score} / 100
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-around">
                  <Link href={`/cv/${cv.id}`} className="dash-icon-action" title="Edit CV">
                    <span className="material-symbols-outlined">edit</span>
                  </Link>
                  <button type="button" onClick={(e) => onDuplicate(cv.id, e)} className="dash-icon-action" title="Duplicate">
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                  <button type="button" onClick={(e) => onDelete(cv.id, e)} className="dash-icon-action dash-icon-action-danger" title="Delete">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
