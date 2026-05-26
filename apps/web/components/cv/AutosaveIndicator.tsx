import React from "react";
import { useCvStore } from "../../lib/store/cv";

export default function AutosaveIndicator() {
  const saveStatus = useCvStore((state) => state.saveStatus);

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-all duration-300">
      {saveStatus === "saving" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
          </span>
          <span className="animate-pulse">Đang đồng bộ...</span>
        </>
      )}
      {saveStatus === "saved" && (
        <>
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Đã lưu vào đám mây</span>
        </>
      )}
      {saveStatus === "error" && (
        <>
          <span className="h-2 w-2 rounded-full bg-rose-500"></span>
          <span className="text-rose-600">Lỗi kết nối</span>
        </>
      )}
      {saveStatus === "conflict" && (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
          <span className="text-amber-600">Phát hiện xung đột</span>
        </>
      )}
    </div>
  );
}
