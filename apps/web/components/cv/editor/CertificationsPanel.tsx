import React from "react";
import { useTranslation } from "../../../hooks/useTranslation";

type CertificationsPanelProps = {
  certifications: any[];
  addCertificationItem: () => void;
  updateCertificationItem: (id: string, field: string, val: any) => void;
  removeCertificationItem: (id: string) => void;
  saveCertifications: (items?: any[]) => void;
};

export function CertificationsPanel({
  certifications,
  addCertificationItem,
  updateCertificationItem,
  removeCertificationItem,
  saveCertifications,
}: CertificationsPanelProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.certifications.title}
        </h3>
        <button
          onClick={addCertificationItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-none"
        >
          {t.editor.certifications.addBtn}
        </button>
      </div>

      {certifications.map((item) => (
        <div key={item.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <button
            onClick={() => removeCertificationItem(item.id)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60"
            title={language === "vi" ? "Xóa" : "Delete"}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.certifications.nameLabel}</label>
              <input
                type="text"
                value={item.name || ""}
                onChange={(e) => updateCertificationItem(item.id, "name", e.target.value)}
                onBlur={() => saveCertifications()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.certifications.issuerLabel}</label>
              <input
                type="text"
                value={item.issuer || ""}
                onChange={(e) => updateCertificationItem(item.id, "issuer", e.target.value)}
                onBlur={() => saveCertifications()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.certifications.dateLabel}</label>
              <input
                type="text"
                value={item.date || ""}
                onChange={(e) => updateCertificationItem(item.id, "date", e.target.value)}
                onBlur={() => saveCertifications()}
                placeholder={t.editor.certifications.datePlaceholder}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400">{t.editor.certifications.urlLabel}</label>
              <input
                type="text"
                value={item.url || ""}
                onChange={(e) => updateCertificationItem(item.id, "url", e.target.value)}
                onBlur={() => saveCertifications()}
                className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
