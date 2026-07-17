"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../../../lib/store/auth";
import { useLanguageStore } from "../../../lib/store/language";
import { translations } from "../../../lib/translations";
import { usePaymentModal } from "../../../hooks/usePaymentModal";
import { PaymentModal } from "../../payment/PaymentModal";

export function DashboardUpgradeTab() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const payment = usePaymentModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

  return (
    <div className="max-w-4xl mx-auto w-full py-4">

      {payment.errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-3 text-sm text-red-700">
          {payment.errorMessage}
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
              onClick={() => payment.open("PRO")}
              className="dash-btn-primary w-full mt-8"
              disabled={payment.status === "creating"}
            >
              {payment.status === "creating" && payment.session?.tier === "PRO" ? t.upgrade.upgrading : t.upgrade.upgradeBtnPro}
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
              onClick={() => payment.open("PREMIUM")}
              className="dash-btn-primary w-full mt-8"
              disabled={payment.status === "creating"}
            >
              {payment.status === "creating" && payment.session?.tier === "PREMIUM" ? t.upgrade.upgrading : t.upgrade.upgradeBtnAnnual}
            </button>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={payment.isOpen}
        status={payment.status}
        session={payment.session}
        errorMessage={payment.errorMessage}
        secondsLeft={payment.secondsLeft}
        onClose={payment.close}
        onRegenerate={payment.regenerate}
      />
    </div>
  );
}

