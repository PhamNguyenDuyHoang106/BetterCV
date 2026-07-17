import React from "react";

interface PaymentLoadingProps {
  message: string;
}

export function PaymentLoading({ message }: PaymentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <span className="absolute text-indigo-600 material-symbols-outlined text-xl">
          credit_card
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">
        {message}
      </p>
    </div>
  );
}
