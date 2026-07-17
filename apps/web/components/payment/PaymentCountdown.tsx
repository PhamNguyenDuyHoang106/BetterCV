import React from "react";

interface PaymentCountdownProps {
  secondsLeft: number | null;
  timeLeftLabel: string; // e.g. "Còn {mm}:{ss}" or "{mm}:{ss} remaining"
}

export function PaymentCountdown({ secondsLeft, timeLeftLabel }: PaymentCountdownProps) {
  if (secondsLeft === null) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  const displayText = timeLeftLabel
    .replace("{mm}", formattedMinutes)
    .replace("{ss}", formattedSeconds);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-500">
      <span className="material-symbols-outlined text-sm animate-pulse">
        schedule
      </span>
      <span>{displayText}</span>
    </div>
  );
}
