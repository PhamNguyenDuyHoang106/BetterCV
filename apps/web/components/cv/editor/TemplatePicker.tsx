import React from "react";
import { getTemplateStyles } from "@acv/template-engine";
import { getTemplateDisplayMeta } from "../../../lib/dashboard-templates";
import { useTranslation } from "../../../hooks/useTranslation";

type TemplatePickerProps = {
  cv: any;
  templates: any[];
  selectedTemplate: any;
  setSelectedTemplate: (val: any) => void;
  saveMetadata: (updates: any) => void;
  profileForm: any;
  setProfileForm: (val: any) => void;
  saveProfile: (val?: any) => void;
  loadCv: (id: string) => Promise<any>;
  userRole?: string;
};

export function TemplatePicker({
  cv,
  templates,
  selectedTemplate,
  setSelectedTemplate,
  saveMetadata,
  profileForm,
  setProfileForm,
  saveProfile,
  loadCv,
  userRole,
}: TemplatePickerProps) {
  const { t, language } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.templatePicker.title}
        </h3>
        <div>
          <label className="block text-xs font-medium text-slate-400">
            {t.editor.templatePicker.templatesHeader}
          </label>
          <select
            value={cv.templateId || ""}
            onChange={(e) => {
              const newTplId = e.target.value;
              const matched = templates.find((t) => t.id === newTplId);
              if (matched) {
                const meta = getTemplateDisplayMeta(newTplId);
                if (meta.tag === "Premium" && userRole === "FREE") {
                  alert(
                    t.dashboard.quickCreateAlertName
                      ? t.dashboard.quickCreateAlertName.replace("{name}", matched.name)
                      : `Mẫu "${matched.name}" là mẫu Premium. Vui lòng nâng cấp tài khoản của bạn để sử dụng!`
                  );
                  return;
                }
                setSelectedTemplate(matched);
                saveMetadata({ templateId: newTplId });
              }
            }}
            className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-850 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="" disabled>
              {language === "vi" ? "-- Chọn mẫu giao diện --" : "-- Select layout template --"}
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.category?.name || "General"})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {language === "vi" ? "Tùy biến dải màu CV" : "Customize CV Palette"}
        </h3>
        <p className="text-xs text-slate-500">
          {language === "vi"
            ? "Tự do tinh chỉnh màu sắc chủ đạo và điểm nhấn để phù hợp với thương hiệu cá nhân của bạn."
            : "Freely adjust primary and accent colors to match your personal brand."}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">
              {language === "vi" ? "Màu chủ đạo (Primary Color)" : "Primary Color"}
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                value={
                  profileForm.theme?.primaryColor ||
                  (selectedTemplate ? getTemplateStyles(selectedTemplate.id).primaryColor : "#1e293b")
                }
                onChange={(e) => {
                  const newTheme = { ...profileForm.theme, primaryColor: e.target.value };
                  const newForm = { ...profileForm, theme: newTheme };
                  setProfileForm(newForm);
                  saveProfile(newForm);
                }}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0"
              />
              <input
                type="text"
                value={profileForm.theme?.primaryColor || ""}
                onChange={(e) => {
                  const newTheme = { ...profileForm.theme, primaryColor: e.target.value };
                  const newForm = { ...profileForm, theme: newTheme };
                  setProfileForm(newForm);
                  saveProfile(newForm);
                }}
                placeholder={
                  selectedTemplate ? getTemplateStyles(selectedTemplate.id).primaryColor : "#1e293b"
                }
                className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400">
              {language === "vi" ? "Màu điểm nhấn (Accent Color)" : "Accent Color"}
            </label>
            <div className="flex gap-2 mt-2">
              <input
                type="color"
                value={
                  profileForm.theme?.accentColor ||
                  (selectedTemplate ? getTemplateStyles(selectedTemplate.id).accentColor : "#3b82f6")
                }
                onChange={(e) => {
                  const newTheme = { ...profileForm.theme, accentColor: e.target.value };
                  const newForm = { ...profileForm, theme: newTheme };
                  setProfileForm(newForm);
                  saveProfile(newForm);
                }}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-0"
              />
              <input
                type="text"
                value={profileForm.theme?.accentColor || ""}
                onChange={(e) => {
                  const newTheme = { ...profileForm.theme, accentColor: e.target.value };
                  const newForm = { ...profileForm, theme: newTheme };
                  setProfileForm(newForm);
                  saveProfile(newForm);
                }}
                placeholder={
                  selectedTemplate ? getTemplateStyles(selectedTemplate.id).accentColor : "#3b82f6"
                }
                className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
