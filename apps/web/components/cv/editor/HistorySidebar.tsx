import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { useTranslation } from "../../../hooks/useTranslation";

type Version = {
  id: string;
  cvId: string;
  title?: string;
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
  versionUpdateTrigger?: number;
};

export function HistorySidebar({
  showHistory,
  setShowHistory,
  cvId,
  cvVersionNum,
  cvLocale,
  loadCv,
  versionUpdateTrigger,
}: HistorySidebarProps) {
  const { t, language } = useTranslation();
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
  }, [showHistory, versionUpdateTrigger]);

  const handleRenameVersion = async (versionId: string, newTitle: string) => {
    try {
      await apiFetch(`/cvs/${cvId}/versions/${versionId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle }),
      });
      setVersions((prev) =>
        prev.map((v) => (v.id === versionId ? { ...v, title: newTitle } : v))
      );
      setEditingVersionId(null);
    } catch (err) {
      console.error("Failed to rename version:", err);
      const { handleFeatureError } = await import("../../../lib/errors");
      if (handleFeatureError(err)) return;
      // Non-entitlement rename errors: silently revert editing state
      setEditingVersionId(null);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    try {
      await apiFetch(`/cvs/${cvId}/versions/${versionId}`, { method: "DELETE" });
      setVersions((prev) => prev.filter((v) => v.id !== versionId));
    } catch (err) {
      console.error("Failed to delete version:", err);
      const { handleFeatureError } = await import("../../../lib/errors");
      if (handleFeatureError(err)) return;
      // Non-entitlement delete errors: silently restore deleted item in UI
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await apiFetch(`/cvs/${cvId}/versions/${versionId}/restore`, { method: "POST" });
      await loadCv(cvId);
      setShowHistory(false);
      // Reload page to refresh all local form hooks
      window.location.reload();
    } catch (err) {
      const { handleFeatureError } = await import("../../../lib/errors");
      if (handleFeatureError(err)) return;
      console.error("Failed to restore version:", err);
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
                    {editingVersionId === ver.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleRenameVersion(ver.id, editingTitle)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameVersion(ver.id, editingTitle);
                          } else if (e.key === "Escape") {
                            setEditingVersionId(null);
                          }
                        }}
                        className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 group/title">
                        <span
                          className="text-xs font-semibold text-slate-300 cursor-pointer hover:text-indigo-400 transition-colors"
                          onDoubleClick={() => {
                            setEditingVersionId(ver.id);
                            setEditingTitle(ver.title || t.editor.history.versionLabel.replace("{version}", String(versions.length - index)));
                          }}
                          title={language === "vi" ? "Click đúp để đổi tên" : "Double click to rename"}
                        >
                          {ver.title || t.editor.history.versionLabel.replace("{version}", String(versions.length - index))}
                        </span>
                        <button
                          onClick={() => {
                            setEditingVersionId(ver.id);
                            setEditingTitle(ver.title || t.editor.history.versionLabel.replace("{version}", String(versions.length - index)));
                          }}
                          className="opacity-40 group-hover/title:opacity-100 text-slate-500 hover:text-slate-300 transition-all"
                          title={language === "vi" ? "Đổi tên" : "Rename"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {date.toLocaleDateString(localeStr)} {date.toLocaleTimeString(localeStr)}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmId(ver.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title={language === "vi" ? "Xóa phiên bản" : "Delete version"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
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

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {language === "vi" ? "Xóa phiên bản" : "Delete Version"}
              </h4>
              <p className="text-xs text-slate-400">
                {language === "vi"
                  ? "Bạn có chắc chắn muốn xóa phiên bản này? Hành động này không thể hoàn tác."
                  : "Are you sure you want to delete this version? This action cannot be undone."}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-700 bg-transparent text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
              >
                {language === "vi" ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                onClick={async () => {
                  const targetId = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await handleDeleteVersion(targetId);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-all shadow-lg shadow-red-500/10 border border-red-500/30"
              >
                {language === "vi" ? "Xóa" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
