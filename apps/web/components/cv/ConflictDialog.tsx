import React from "react";
import { useCvStore } from "../../lib/store/cv";
import { useTranslation } from "../../hooks/useTranslation";

export default function ConflictDialog() {
  const saveStatus = useCvStore((state) => state.saveStatus);
  const conflictInfo = useCvStore((state) => state.conflictInfo);
  const resolveConflict = useCvStore((state) => state.resolveConflict);
  const { t } = useTranslation();

  if (saveStatus !== "conflict") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          {t.editor.conflict.title}
        </h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          {t.editor.conflict.desc}
        </p>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 border border-slate-100">
          <div className="font-semibold text-slate-800">
            {t.editor.conflict.serverInfoTitle}
          </div>
          <div className="mt-1">
            • {t.editor.conflict.deviceLabel}{" "}
            <span className="font-medium text-slate-700">
              {conflictInfo?.lastEditedDevice || t.editor.conflict.otherDevice}
            </span>
          </div>
          <div className="mt-0.5">
            • {t.editor.conflict.newVersionLabel}{" "}
            <span className="font-medium text-slate-700">v{conflictInfo?.latestVersion || 2}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => resolveConflict("reload")}
            className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            {t.editor.conflict.reloadBtn}
          </button>
          <button
            onClick={() => resolveConflict("overwrite")}
            className="w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t.editor.conflict.overwriteBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
