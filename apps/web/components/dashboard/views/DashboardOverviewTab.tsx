"use client";

import Link from "next/link";
import { DashPanel, DashStatCard } from "../dashboard-ui";

type Cv = {
  id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
};

type Props = {
  cvs: Cv[];
  onGoResumes: () => void;
  onGoTemplates: () => void;
  onGoUpgrade: () => void;
  onDuplicate: (id: string, e: React.MouseEvent) => void;
  formatDate: (d?: string) => string;
};

export function DashboardOverviewTab({
  cvs,
  onGoResumes,
  onGoTemplates,
  onGoUpgrade,
  onDuplicate,
  formatDate,
}: Props) {
  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DashStatCard
          icon="description"
          accent="blue"
          badge={
            <span className="dash-badge dash-badge-blue">
              {cvs.length} Active Resumes
            </span>
          }
          label="Total Resumes"
          value={cvs.length}
        />
        <DashStatCard
          icon="fact_check"
          accent="emerald"
          badge={<span className="dash-badge dash-badge-emerald">ATS Calibrated</span>}
          label="Average ATS Score"
          value="88%"
        />
        <DashStatCard
          icon="auto_awesome"
          accent="violet"
          label="AI Credits"
          value="150 left"
          footer={
            <button type="button" onClick={onGoUpgrade} className="dash-btn-ghost w-full mt-4 text-xs">
              Top Up Credits
            </button>
          }
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <DashPanel title="Most Recent Drafts" icon="schedule" iconAccent="blue">
          {cvs.length === 0 ? (
            <p className="text-sm text-slate-500 py-10 text-center">
              You haven&apos;t created any resumes yet. Start creating now!
            </p>
          ) : (
            <div className="space-y-3">
              {cvs.slice(0, 3).map((cv) => (
                <div key={cv.id} className="dash-list-item">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{cv.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Updated: {formatDate(cv.updatedAt || cv.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/cv/${cv.id}`} className="dash-btn-primary !py-2 !px-4 !text-xs">
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => onDuplicate(cv.id, e)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                      title="Duplicate"
                    >
                      <span className="material-symbols-outlined text-lg">content_copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cvs.length > 0 && (
            <button
              type="button"
              onClick={onGoResumes}
              className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View all resumes ({cvs.length})
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </DashPanel>

        <DashPanel title="Recruiter Standard" icon="verified" iconAccent="teal">
          <p className="text-sm text-slate-600 leading-relaxed">
            Our <strong className="text-slate-900">Standard ATS</strong> template is audited to maximize
            structural match-rates on Enterprise Applicant Tracking Software.
          </p>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-slate-50 to-sky-50 border border-slate-200/80 p-4 space-y-2">
            <div className="h-3 w-1/3 bg-slate-300 rounded" />
            <div className="h-2 w-full bg-slate-200 rounded" />
            <div className="h-2 w-4/5 bg-slate-200 rounded" />
          </div>
          <button type="button" onClick={onGoTemplates} className="dash-btn-primary w-full mt-5">
            Xem mẫu CV
          </button>
        </DashPanel>
      </div>
    </div>
  );
}
