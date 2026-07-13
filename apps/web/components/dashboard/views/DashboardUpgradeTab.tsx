"use client";

import { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store/auth";
import { useLanguageStore } from "../../../lib/store/language";
import { translations } from "../../../lib/translations";
import { syncSessionWithRetry } from "../../../lib/auth-session";

export function DashboardUpgradeTab() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState<"PRO" | "PREMIUM" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutQr, setCheckoutQr] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        console.log("Payment success received from child tab!");
        try {
          await syncSessionWithRetry(5, 2000);
          alert(activeLang === "vi" ? "Nâng cấp tài khoản thành công!" : "Account upgraded successfully!");
        } catch (e) {
          console.error("Failed to sync session on payment success:", e);
        } finally {
          setCheckoutUrl(null);
          setCheckoutQr(null);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [activeLang]);

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
      if (!url) throw new Error(t.upgrade.errPay);
      setCheckoutUrl(url);
      if (payload?.qrCode) setCheckoutQr(payload.qrCode);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : t.upgrade.errGeneric);
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
            <h3 className="text-lg font-bold text-slate-900">{t.upgrade.freePlan}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.upgrade.freeSub}</p>
          </div>
          <p className="dash-pricing-price mt-6">
            {t.upgrade.priceFree} <span className="text-sm font-semibold text-slate-500"></span>
          </p>
          <ul className="dash-feature-list mt-8">
            {t.upgrade.freeFeatures.map((f) => (
              <li key={f}>
                <span className="material-symbols-outlined text-emerald-500 text-lg">
                  check_circle
                </span>
                {f}
              </li>
            ))}
          </ul>
          <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
            {t.upgrade.activePlan}
          </button>
        </div>

        <div className="dash-pricing-card dash-pricing-card-pro">
          <span className="dash-pricing-ribbon">{t.upgrade.recommended}</span>
          <div className="dash-pricing-header">
            <span
              className="material-symbols-outlined text-amber-500"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
            <h3 className="text-lg font-bold text-slate-900">{t.upgrade.proPlan}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {t.upgrade.proSub}
            </p>
          </div>
          <p className="dash-pricing-price mt-6">
            {t.upgrade.pricePro} <span className="text-sm font-semibold text-slate-500">{t.upgrade.periodMonth}</span>
          </p>
          <ul className="dash-feature-list mt-8">
            {t.upgrade.proFeatures.map((f) => (
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
              {t.upgrade.currentPro}
            </button>
          ) : user?.role === "PREMIUM" ? (
            <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
              {t.upgrade.currentPremium}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout("PRO", "subscription")}
              className="dash-btn-primary w-full mt-8"
              disabled={loading !== null}
            >
              {loading === "PRO" ? t.upgrade.upgrading : t.upgrade.upgradeBtnPro}
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
            <h3 className="text-lg font-bold text-slate-900">{t.upgrade.annualPlan}</h3>
            <p className="text-xs text-slate-500 mt-1">{t.upgrade.annualSub}</p>
          </div>
          <p className="dash-pricing-price mt-6">
            {t.upgrade.priceAnnual} <span className="text-sm font-semibold text-slate-500">{t.upgrade.periodOnce}</span>
          </p>
          <ul className="dash-feature-list mt-8">
            {t.upgrade.annualFeatures.map((f) => (
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
          {user?.role === "PREMIUM" ? (
            <button type="button" className="dash-btn-ghost w-full mt-8" disabled>
              {t.upgrade.currentAnnual}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => startCheckout("PREMIUM", "payment")}
              className="dash-btn-primary w-full mt-8"
              disabled={loading !== null}
            >
              {loading === "PREMIUM" ? t.upgrade.upgrading : t.upgrade.upgradeBtnAnnual}
            </button>
          )}
        </div>
      </div>

      {checkoutUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            aria-label={t.nav.close}
            onClick={() => {
              setCheckoutUrl(null);
              setCheckoutQr(null);
            }}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200/70 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{t.upgrade.qrTitle}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {t.upgrade.qrSub}
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
                rel="opener"
                className="dash-btn-primary w-full"
              >
                {t.upgrade.openPayBtn}
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
                {t.upgrade.copyLinkBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
