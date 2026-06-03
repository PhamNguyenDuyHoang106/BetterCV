"use client";

import { useMemo, useState } from "react";
import { DashPageHero } from "../dashboard-ui";
import { apiFetch } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store/auth";

const FREE_FEATURES = [
  "Tạo CV không giới hạn",
  "Template cơ bản + ATS scan",
  "Xuất PDF chuẩn ATS",
];

const PRO_FEATURES = [
  "AI rewrite không giới hạn",
  "Template Premium + tối ưu nội dung",
  "Xuất PDF không giới hạn",
  "Ưu tiên hàng đợi xử lý",
];

export function DashboardUpgradeTab() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<"PRO" | "PREMIUM" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutQr, setCheckoutQr] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const successUrl = useMemo(() => `${origin}/dashboard?paid=1`, [origin]);
  const cancelUrl = useMemo(() => `${origin}/dashboard?paid=0`, [origin]);

  const startCheckout = async (
    tier: "PRO" | "PREMIUM",
    mode: "subscription" | "payment",
  ) => {
    setLoading(tier);
    setError(null);
    setCheckoutUrl(null);
    setCheckoutQr(null);
    try {
      const res = await apiFetch<any>("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          tier,
          mode,
          successUrl,
          cancelUrl,
        }),
      });

      const payload = res?.data ?? res;
      const url = payload?.checkoutUrl ?? payload?.url;
      if (!url) throw new Error("Không tạo được link thanh toán PayOS.");
      setCheckoutUrl(url);
      if (payload?.qrCode) setCheckoutQr(payload.qrCode);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Thanh toán thất bại");
    } finally {
      setLoading(null);
    }
  };

  const qrSrc = checkoutQr
    ? checkoutQr.startsWith("data:") || checkoutQr.startsWith("http")
      ? checkoutQr
      : `data:image/png;base64,${checkoutQr}`
    : checkoutUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`
      : null;

  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <DashPageHero
        title="Gói phù hợp nhất để cạnh tranh"
        subtitle="Giá cực rẻ để bạn tập trung đi phỏng vấn: Free 0đ, Pro 50.000đ/tháng, Annual 120.000đ trả 1 lần."
        accent="amber"
      />

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dash-pricing-card">
          <div className="dash-pricing-header">
            <span className="material-symbols-outlined text-slate-500">
              layers
            </span>
            <h3 className="text-lg font-bold text-slate-900">Free Canvas</h3>
            <p className="text-xs text-slate-500 mt-1">Miễn phí trọn đời.</p>
          </div>
          <p className="dash-pricing-price mt-6">
            0đ <span className="text-sm font-semibold text-slate-500"></span>
          </p>
          <ul className="dash-feature-list mt-8">
            {FREE_FEATURES.map((f) => (
              <li key={f}>
                <span className="material-symbols-outlined text-emerald-500 text-lg">
                  check_circle
                </span>
                {f}
              </li>
            ))}
          </ul>
          <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
            Active Plan
          </button>
        </div>

        <div className="dash-pricing-card dash-pricing-card-pro">
          <span className="dash-pricing-ribbon">Recommended</span>
          <div className="dash-pricing-header">
            <span
              className="material-symbols-outlined text-amber-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            <h3 className="text-lg font-bold text-slate-900">Pro Builder</h3>
            <p className="text-xs text-slate-500 mt-1">
              Rẻ nhất để dùng AI + template premium.
            </p>
          </div>
          <p className="dash-pricing-price mt-6">
            50.000đ <span className="text-sm font-semibold text-slate-500">/ tháng</span>
          </p>
          <ul className="dash-feature-list mt-8">
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                <span
                  className="material-symbols-outlined text-primary text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                {f}
              </li>
            ))}
          </ul>
          {user?.role === "PRO" ? (
            <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
              Gói hiện tại (Pro)
            </button>
          ) : user?.role === "PREMIUM" ? (
            <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
              Không khả dụng (Đã là Premium)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout("PRO", "subscription")}
              className="dash-btn-primary w-full mt-8"
              disabled={loading !== null}
            >
              {loading === "PRO" ? "Đang tạo thanh toán..." : "Nâng cấp Pro"}
            </button>
          )}
        </div>

        <div className="dash-pricing-card">
          <div className="dash-pricing-header">
            <span
              className="material-symbols-outlined text-slate-700"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
            <h3 className="text-lg font-bold text-slate-900">Annual</h3>
            <p className="text-xs text-slate-500 mt-1">Trả 1 lần (không subscription).</p>
          </div>
          <p className="dash-pricing-price mt-6">
            120.000đ <span className="text-sm font-semibold text-slate-500">/ lần</span>
          </p>
          <ul className="dash-feature-list mt-8">
            <li>
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              Mở khóa Premium (1 lần)
            </li>
            <li>
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              AI + export như Pro
            </li>
            <li>
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              Không cần quản lý hủy gia hạn
            </li>
          </ul>
          {user?.role === "PREMIUM" ? (
            <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
              Gói hiện tại (Premium)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout("PREMIUM", "payment")}
              className="dash-btn-primary w-full mt-8"
              disabled={loading !== null}
            >
              {loading === "PREMIUM" ? "Đang tạo thanh toán..." : "Thanh toán 1 lần"}
            </button>
          )}
        </div>
      </div>

      {checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label="Đóng"
            onClick={() => {
              setCheckoutUrl(null);
              setCheckoutQr(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">Quét QR để thanh toán</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hoặc đã mở tab mới. Nếu bị chặn popup, bấm “Mở trang thanh toán”.
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-50 text-slate-500"
                onClick={() => {
                  setCheckoutUrl(null);
                  setCheckoutQr(null);
                }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {qrSrc && (
              <div className="mt-5 flex items-center justify-center">
                <img
                  src={qrSrc}
                  alt="Checkout QR"
                  className="w-[220px] h-[220px] rounded-2xl ring-1 ring-slate-200"
                />
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="dash-btn-primary w-full"
              >
                Mở trang thanh toán
              </a>
              <button
                type="button"
                className="dash-btn-ghost w-full"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(checkoutUrl);
                  } catch { }
                }}
              >
                Copy link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
