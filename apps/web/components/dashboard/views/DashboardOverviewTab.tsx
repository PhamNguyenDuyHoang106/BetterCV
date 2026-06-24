"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useLanguageStore } from "../../../lib/store/language";
import { translations } from "../../../lib/translations";
import { DashPanel, DashStatCard } from "../dashboard-ui";

type Cv = {
  id: string;
  title: string;
  updatedAt?: string;
  createdAt?: string;
  completenessScore?: number | null;
  atsScore?: number | null;
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
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  const avgCompleteness = useMemo(() => {
    if (!cvs.length) return 0;
    const total = cvs.reduce((acc, cv) => acc + (cv.completenessScore ?? cv.atsScore ?? 0), 0);
    return Math.round(total / cvs.length);
  }, [cvs]);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DashStatCard
          icon="description"
          accent="blue"
          badge={
            <span className="dash-badge dash-badge-blue">
              {t.overview.activeResumes.replace("{count}", String(cvs.length))}
            </span>
          }
          label={t.overview.totalResumes}
          value={cvs.length}
        />
        <DashStatCard
          icon="fact_check"
          accent="emerald"
          badge={<span className="dash-badge dash-badge-emerald">{t.overview.realtimeCheck}</span>}
          label={t.overview.avgCompleteness}
          value={`${avgCompleteness}%`}
        />
        <DashStatCard
          icon="auto_awesome"
          accent="violet"
          label={t.overview.aiCredits}
          value={t.overview.creditsLeft.replace("{count}", "150")}
          footer={
            <button type="button" onClick={onGoUpgrade} className="dash-btn-ghost w-full mt-4 text-xs">
              {t.overview.topUpBtn}
            </button>
          }
        />
      </section>

      <DashPanel title={t.overview.recentDrafts} icon="schedule" iconAccent="blue">
        {cvs.length === 0 ? (
          <p className="text-sm text-slate-500 py-10 text-center">
            {t.overview.noCvMsg}
          </p>
        ) : (
          <div className="space-y-3">
            {cvs.slice(0, 3).map((cv) => (
              <div key={cv.id} className="dash-list-item">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{cv.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeLang === "vi" ? "Cập nhật" : "Updated"}: {formatDate(cv.updatedAt || cv.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/cv/${cv.id}`} className="dash-btn-primary !py-2 !px-4 !text-xs">
                    {t.overview.editBtn}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => onDuplicate(cv.id, e)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                    title={t.overview.duplicateBtn}
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
            {t.overview.viewAllBtn.replace("{count}", String(cvs.length))}
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </DashPanel>
    </div>
  );
}
