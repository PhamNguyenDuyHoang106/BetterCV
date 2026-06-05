import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { useTranslation } from "../../../hooks/useTranslation";

type Version = {
  id: string;
  cvId: string;
  snapshot: any;
  createdAt: string;
};

type HistorySidebarProps = {
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  cvId: string;
  cvVersionNum: number;
  cvLocale: string;
  loadCv: (id: string) => Promise<any>;
};

export function HistorySidebar({
  showHistory,
  setShowHistory,
  cvId,
  cvVersionNum,
  cvLocale,
  loadCv,
}: HistorySidebarProps) {
  const { t, language } = useTranslation();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const res = await apiFetch<any>(`/cvs/${cvId}/versions`);
      const data = Array.isArray(res) ? res : res?.data || [];
      setVersions(data);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm(t.editor.history.restoreConfirm)) {
      return;
    }
    try {
      await apiFetch(`/cvs/${cvId}/versions/${versionId}/restore`, { method: "POST" });
      await loadCv(cvId);
      setShowHistory(false);
      alert(t.editor.history.restoredAlert);
      // Reload page to refresh all local form hooks
      window.location.reload();
    } catch (err) {
      alert(
        language === "vi"
          ? "Không thể phục hồi phiên bản. Vui lòng thử lại."
          : "Failed to restore version. Please try again."
      );
    }
  };

  if (!showHistory) return null;

  const localeStr = language === "vi" ? "vi-VN" : "en-US";

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 sticky top-0">
        <div>
          <h3 className="text-sm font-semibold text-indigo-400">{t.editor.history.title}</h3>
          <p className="text-xs text-slate-500">
            {language === "vi"
              ? "20 phiên bản tự động sao lưu gần đây"
              : "20 recent autosaved snapshots on cloud"}
          </p>
        </div>
        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoadingVersions ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
            <span className="text-xs text-slate-500">
              {language === "vi" ? "Đang tải lịch sử..." : "Loading version history..."}
            </span>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center text-xs text-slate-600 py-10">
            {t.editor.history.noHistory}
          </div>
        ) : (
          versions.map((ver, index) => {
            const date = new Date(ver.createdAt);
            return (
              <div
                key={ver.id}
                className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 hover:bg-slate-900/80 transition-all flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">
                      {t.editor.history.versionLabel.replace("{version}", String(versions.length - index))}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {date.toLocaleDateString(localeStr)} {date.toLocaleTimeString(localeStr)}
                    </div>
                  </div>
                  <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400">
                    v{index === 0 ? cvVersionNum : ver.snapshot.version || index}
                  </span>
                </div>

                <div className="text-xs text-slate-400 truncate">
                  {language === "vi" ? "Mẫu:" : "Template:"}{" "}
                  <span className="font-semibold text-slate-300">
                    {ver.snapshot.templateId || "Standard"}
                  </span>
                </div>

                <button
                  onClick={() => handleRestoreVersion(ver.id)}
                  className="mt-1 w-full rounded bg-slate-800 hover:bg-indigo-950 py-1 text-[11px] font-semibold text-slate-300 hover:text-indigo-400 transition-colors border border-slate-700/60 hover:border-indigo-900/60"
                >
                  {t.editor.history.restoreBtn}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
