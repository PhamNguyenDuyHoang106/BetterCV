import React from "react";

type Props = {
  failedTitle: string;
  failureReason?: string | null;
  failedAt?: string | null;
  retryBtn: string;
  onRetry?: () => void;
};

export function CareerFailedState({
  failedTitle,
  failureReason,
  failedAt,
  retryBtn,
  onRetry,
}: Props) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-5 animate-in fade-in duration-300">
      {/* Error icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center">
          <span className="material-symbols-outlined text-[36px] text-rose-500">error</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
          <span className="material-symbols-outlined text-[14px] text-white">close</span>
        </div>
      </div>

      {/* Title & message */}
      <div className="space-y-2 max-w-sm">
        <h3 className="font-bold text-slate-800 text-base">{failedTitle}</h3>
        {failureReason && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-left">
            <p className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider mb-1">
              Reason
            </p>
            <p className="text-xs text-rose-700 leading-relaxed font-mono break-words">
              {failureReason}
            </p>
          </div>
        )}
        {failedAt && (
          <p className="text-[10px] text-slate-400">
            Failed at:{" "}
            {new Date(failedAt).toLocaleString("vi-VN", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </p>
        )}
      </div>

      {/* Retry button */}
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all border-none"
      >
        <span className="material-symbols-outlined text-base">refresh</span>
        {retryBtn}
      </button>
    </div>
  );
}
