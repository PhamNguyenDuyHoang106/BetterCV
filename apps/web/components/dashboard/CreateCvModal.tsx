"use client";

import type { UseFormRegister, FieldErrors, UseFormHandleSubmit } from "react-hook-form";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl glass-overlay p-6 shadow-2xl border border-white/50">
        <div className="flex items-center justify-between border-b border-glass-border/40 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">post_add</span>
            <h3 className="text-lg font-bold text-text-primary">Tạo CV mới</h3>
          </div>
          <button
            type="button"
            className="p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-slate-100"
            onClick={onClose}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {selectedTemplateName && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-primary font-medium">
            <span className="material-symbols-outlined text-base">palette</span>
            Mẫu: {selectedTemplateName}
          </div>
        )}

        <form onSubmit={onSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Tiêu đề CV
            </label>
            <input
              type="text"
              placeholder="VD: CV Frontend Developer 2026"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("title", { required: "Vui lòng nhập tiêu đề CV." })}
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Ngôn ngữ</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("locale")}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">Mẫu CV</label>
            <select
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("templateId")}
              value={selectedTemplateId}
              onChange={(e) => onTemplateChange(e.target.value)}
            >
              <option value="">Trống (không chọn mẫu)</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.category?.name ? ` — ${t.category.name}` : ""}
                </option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              {errorMsg}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-text-secondary hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo CV"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

