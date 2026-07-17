"use client";

import React, { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { PaymentSession, PaymentStatus as StatusType } from "../../hooks/usePaymentModal";
import { PaymentLoading } from "./PaymentLoading";
import { PaymentStatus } from "./PaymentStatus";
import { PaymentCountdown } from "./PaymentCountdown";

interface PaymentModalProps {
  isOpen: boolean;
  status: StatusType;
  session: PaymentSession | null;
  errorMessage: string | null;
  secondsLeft: number | null;
  onClose: () => void;
  onRegenerate: () => void;
}

export function PaymentModal({
  isOpen,
  status,
  session,
  errorMessage,
  secondsLeft,
  onClose,
  onRegenerate,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Determine modal header title
  const modalTitle =
    session?.tier === "PREMIUM"
      ? t.payment.titlePremium
      : session?.tier === "PRO"
      ? t.payment.titlePro
      : t.payment.title;

  // Construct QR image URL from VietQR string or checkout URL
  const qrSrc = session?.qrCode
    ? session.qrCode.startsWith("data:") || session.qrCode.startsWith("http")
      ? session.qrCode
      : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(session.qrCode)}`
    : session?.checkoutUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(session.checkoutUrl)}`
    : null;

  // Resolve bank name based on bank BIN number
  const getBankName = (bin?: string | null) => {
    if (!bin) return "Ngân hàng TMCP Quân đội (MB)";
    const map: Record<string, string> = {
      "970422": "Ngân hàng TMCP Quân đội (MB Bank)",
      "970415": "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)",
      "970436": "Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)",
      "970418": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
      "970405": "Ngân hàng TMCP Nông nghiệp & Phát triển Nông thôn (Agribank)",
      "970423": "Ngân hàng TMCP Tiên Phong (TPBank)",
      "970407": "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)",
    };
    return map[bin] || `Ngân hàng đối tác (${bin})`;
  };

  // Helper to handle clipboard copy with temporary state confirmation
  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Format currency nicely (e.g. 50,000)
  const formatCurrency = (val?: number | null) => {
    if (!val) return "0";
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop blur */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-default border-none outline-none"
        onClick={status === "success" ? undefined : onClose}
        disabled={status === "success"}
        aria-label={t.nav.close}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 text-slate-100 flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
              {modalTitle}
            </h3>
            {status !== "success" && status !== "expired" && status !== "error" && (
              <p className="text-xs text-slate-400">
                {t.payment.subtitle}
              </p>
            )}
          </div>
          {status !== "success" && (
            <button
              type="button"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[300px] flex flex-col justify-center">
          {/* Loading when generating payment request */}
          {status === "creating" && (
            <PaymentLoading message={t.payment.creating} />
          )}

          {/* Custom VietQR Checkout panel */}
          {(status === "pending" || status === "polling") && session && (
            <div className="w-full flex flex-col space-y-6 animate-in fade-in duration-300">
              {/* Countdown timer */}
              <div className="flex justify-center">
                <PaymentCountdown
                  secondsLeft={secondsLeft}
                  timeLeftLabel={t.payment.timeLeft}
                />
              </div>

              {/* Main Content Grid: QR Code (Left) & Transfer Info (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 border border-slate-800/80 p-6 rounded-2xl">
                {/* QR Code Container (Left Column) */}
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="bg-white p-3 rounded-2xl shadow-xl shadow-black/10 border border-slate-700/30 relative">
                    {qrSrc && (
                      <img
                        src={qrSrc}
                        alt="PayOS QR code"
                        className="w-[220px] h-[220px] object-contain rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">
                      VietQR Pro / Napas 247
                    </span>
                    <span className="text-[10px] text-slate-400 text-center">
                      Mở app ngân hàng để quét mã QR chuyển khoản
                    </span>
                  </div>
                </div>

                {/* Bank Transfer Details (Right Column) */}
                <div className="flex flex-col justify-between space-y-4">
                  {/* Bank Header Info */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner">
                      <span className="material-symbols-outlined text-xl">account_balance</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ngân hàng thụ hưởng
                      </p>
                      <p className="text-sm font-bold text-white leading-snug">
                        {getBankName(session.bin)}
                      </p>
                    </div>
                  </div>

                  {/* Transfer Parameters Stack */}
                  <div className="space-y-3.5">
                    {/* Owner Name */}
                    <div className="flex flex-col">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Chủ tài khoản
                      </span>
                      <span className="text-sm font-bold text-white mt-0.5">
                        {session.accountName || "PHAM NGUYEN DUY HOANG"}
                      </span>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          Số tài khoản
                        </span>
                        <span className="text-sm font-mono font-bold text-indigo-300 tracking-wider mt-0.5">
                          {session.accountNumber || "—"}
                        </span>
                      </div>
                      {session.accountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopy(session.accountNumber || "", "accountNumber")}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        >
                          {copiedField === "accountNumber" ? "Đã chép ✓" : "Sao chép"}
                        </button>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          Số tiền chuyển khoản
                        </span>
                        <span className="text-sm font-extrabold text-amber-400 tracking-wide mt-0.5">
                          {formatCurrency(session.amount)} VND
                        </span>
                      </div>
                      {session.amount && (
                        <button
                          type="button"
                          onClick={() => handleCopy(String(session.amount), "amount")}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        >
                          {copiedField === "amount" ? "Đã chép ✓" : "Sao chép"}
                        </button>
                      )}
                    </div>

                    {/* Description/Nội dung chuyển khoản */}
                    <div className="flex items-end justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                          Nội dung chuyển khoản
                        </span>
                        <span className="text-sm font-mono font-bold text-emerald-400 tracking-wide mt-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                          {session.description || "—"}
                        </span>
                      </div>
                      {session.description && (
                        <button
                          type="button"
                          onClick={() => handleCopy(session.description || "", "description")}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        >
                          {copiedField === "description" ? "Đã chép ✓" : "Sao chép"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Warning Footer info inside box */}
                  <div className="text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl leading-relaxed">
                    <span className="font-bold">Lưu ý:</span> Vui lòng nhập chính xác số tiền <span className="font-extrabold">{formatCurrency(session.amount)} VND</span> và nội dung chuyển khoản để hệ thống tự động kích hoạt tài khoản ngay lập tức.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Render specific payment states: waiting, success, expired, error */}
          <PaymentStatus
            status={status}
            t={t.payment}
            errorMessage={errorMessage}
            onRegenerate={onRegenerate}
          />
        </div>

        {/* Footer controls */}
        {status !== "success" && status !== "creating" && (
          <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
            <div className="text-[10px] text-slate-500">
              Cổng thanh toán tự động BCV-PayOS
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 hover:text-white transition-all border-none"
            >
              {t.payment.cancel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
