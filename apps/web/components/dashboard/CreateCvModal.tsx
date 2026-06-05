"use client";

import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form";
import { dashInputClass, dashSelectClass } from "./dashboard-ui";
import { useTranslation } from "../../hooks/useTranslation";

export type CreateForm = {
  title: string;
  locale: "en" | "vi";
  templateId?: string;
};

export type TemplateOption = {
  id: string;
  name: string;
  category?: { name: string };
};

type Props = {
  open: boolean;
  loading: boolean;
  errorMsg: string | null;
  templates: TemplateOption[];
  selectedTemplateId: string;
  selectedTemplateName?: string;
  register: UseFormRegister<CreateForm>;
  errors: FieldErrors<CreateForm>;
  onSubmit: UseFormHandleSubmit<CreateForm>;
  onCreate: (values: CreateForm) => void;
  onClose: () => void;
  onTemplateChange: (id: string) => void;
};

export function CreateCvModal({
  open,
  loading,
  errorMsg,
  templates,
  selectedTemplateId,
  selectedTemplateName,
  register,
  errors,
  onSubmit,
  onCreate,
  onClose,
  onTemplateChange,
}: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-md" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl dash-create-modal p-6 sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary shadow-md">
              <span className="material-symbols-outlined">post_add</span>
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {t.createCvModal.title}
            </h3>
          </div>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {selectedTemplateName && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20 px-3 py-2.5 text-xs text-primary font-semibold">
            <span className="material-symbols-outlined text-base">palette</span>
            {t.createCvModal.selectedTemplate.replace("{name}", selectedTemplateName)}
          </div>
        )}

        <form onSubmit={onSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t.createCvModal.cvTitleLabel}
            </label>
            <input
              type="text"
              placeholder={t.createCvModal.cvTitlePlaceholder}
              className={dashInputClass}
              {...register("title", {
                required: t.createCvModal.cvTitleRequired,
              })}
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t.createCvModal.languageLabel}
            </label>
            <select className={dashSelectClass} {...register("locale")}>
              <option value="vi">{t.createCvModal.langVietnamese}</option>
              <option value="en">{t.createCvModal.langEnglish}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t.createCvModal.templateLabel}
            </label>
            <select
              className={dashSelectClass}
              {...register("templateId")}
              value={selectedTemplateId}
              onChange={(e) => onTemplateChange(e.target.value)}
            >
              <option value="">
                {t.createCvModal.templateBlank}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.category?.name ? ` — ${t.category.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{errorMsg}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="dash-btn-ghost flex-1">
              {t.createCvModal.cancelBtn}
            </button>
            <button type="submit" disabled={loading} className="dash-btn-primary flex-1">
              {loading ? t.createCvModal.creatingBtn : t.createCvModal.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
