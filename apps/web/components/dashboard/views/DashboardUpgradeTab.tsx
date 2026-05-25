"use client";

import { DashPageHero } from "../dashboard-ui";

const FREE_FEATURES = [
  "Build up to 3 resumes",
  "Standard recruit templates",
  "Basic PDF export format",
];

const PRO_FEATURES = [
  "Unlimited resume drafts",
  "Premium Recruiter-audited designs",
  "Dynamic AI bullet point rephraser",
  "250 AI Credit tokens monthly",
  "Enterprise priority support",
];

export function DashboardUpgradeTab() {
  return (
    <div className="max-w-4xl mx-auto w-full py-4">
      <DashPageHero
        title="Upgrade to Unlock Professional AI Features"
        subtitle="Choose the plan that suits your career goals — stand out to recruiters with premium tools."
        accent="amber"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dash-pricing-card">
          <div className="dash-pricing-header">
            <span className="material-symbols-outlined text-slate-500">layers</span>
            <h3 className="text-lg font-bold text-slate-900">Free Canvas Plan</h3>
            <p className="text-xs text-slate-500 mt-1">Perfect for beginners and quick drafts.</p>
          </div>
          <p className="dash-pricing-price mt-6">
            $0 <span className="text-sm font-semibold text-slate-500">/ forever</span>
          </p>
          <ul className="dash-feature-list mt-8">
            {FREE_FEATURES.map((f) => (
              <li key={f}>
                <span className="material-symbols-outlined text-emerald-500 text-lg">check_circle</span>
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
            <span className="material-symbols-outlined text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
            <h3 className="text-lg font-bold text-slate-900">Pro Builder Plan</h3>
            <p className="text-xs text-slate-500 mt-1">Audited templates built to secure high response rates.</p>
          </div>
          <p className="dash-pricing-price mt-6">
            $15 <span className="text-sm font-semibold text-slate-500">/ month</span>
          </p>
          <ul className="dash-feature-list mt-8">
            {PRO_FEATURES.map((f) => (
              <li key={f}>
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => alert("Redirecting to Stripe checkout portal...")}
            className="dash-btn-primary w-full mt-8"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
