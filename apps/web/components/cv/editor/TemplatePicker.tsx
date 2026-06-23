import React, { useMemo } from "react";
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
  const activeSchema = selectedTemplate?.schema || cv?.templateSnapshot;

  const configurableSections = useMemo(() => {
    const sections = Array.isArray(activeSchema?.layout?.sections) ? activeSchema.layout.sections : [];
    return sections.filter((section: any) => section?.type && section.type !== "PROFILE");
  }, [activeSchema]);

  const renderOptions = profileForm?.renderOptions || { hiddenSections: [], hiddenBlocks: [], sectionVariants: {} };
  const hiddenSections = new Set<string>(
    Array.isArray(renderOptions.hiddenSections)
      ? renderOptions.hiddenSections.map((value: unknown) => String(value))
      : [],
  );
  const hiddenBlocks = new Set<string>(
    Array.isArray(renderOptions.hiddenBlocks)
      ? renderOptions.hiddenBlocks.map((value: unknown) => String(value))
      : [],
  );
  const sectionVariants = renderOptions.sectionVariants && typeof renderOptions.sectionVariants === "object"
    ? renderOptions.sectionVariants
    : {};

  const variantOptions: Record<string, string[]> = {
    EXPERIENCE: ["classic", "timeline", "card", "minimal"],
    EDUCATION: ["classic", "timeline", "minimal"],
    SKILLS: ["badges", "bars", "columns"],
    PROJECTS: ["classic", "grid"],
  };

  const updateRenderOptions = (next: {
    hiddenSections?: string[];
    hiddenBlocks?: string[];
    sectionVariants?: Record<string, string>;
  }) => {
    const newForm = {
      ...profileForm,
      renderOptions: {
        hiddenSections: next.hiddenSections || [],
        hiddenBlocks: next.hiddenBlocks || [],
        sectionVariants: next.sectionVariants || {},
      },
    };
    setProfileForm(newForm);
    saveProfile(newForm);
  };

  const handleSectionToggle = (sectionType: string, visible: boolean) => {
    const next = new Set(hiddenSections);
    if (visible) {
      next.delete(sectionType);
    } else {
      next.add(sectionType);
    }
    updateRenderOptions({
      hiddenSections: Array.from(next),
      hiddenBlocks: Array.from(hiddenBlocks),
      sectionVariants,
    });
  };

  const handleBlockToggle = (blockKey: string, visible: boolean) => {
    const next = new Set(hiddenBlocks);
    if (visible) {
      next.delete(blockKey);
    } else {
      next.add(blockKey);
    }
    updateRenderOptions({
      hiddenSections: Array.from(hiddenSections),
      hiddenBlocks: Array.from(next),
      sectionVariants,
    });
  };

  const handleVariantChange = (sectionType: string, value: string) => {
    const next = {
      ...sectionVariants,
      [sectionType]: value,
    };
    updateRenderOptions({
      hiddenSections: Array.from(hiddenSections),
      hiddenBlocks: Array.from(hiddenBlocks),
      sectionVariants: next,
    });
  };

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

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {language === "vi" ? "Bật/tắt cấu trúc hiển thị" : "Toggle Layout Structure"}
        </h3>
        <p className="text-xs text-slate-500">
          {language === "vi"
            ? "Ẩn/hiện từng section hoặc block mà không đổi dữ liệu gốc. Cài đặt này được lưu trong hồ sơ CV."
            : "Hide/show each section or block without deleting source data. These settings are stored with your CV profile."}
        </p>
        <div className="space-y-3">
          {configurableSections.length === 0 ? (
            <p className="text-xs text-slate-400">
              {language === "vi" ? "Template hiện tại chưa có dữ liệu cấu trúc." : "Current template has no section layout data."}
            </p>
          ) : (
            configurableSections.map((section: any) => {
              const sectionVisible = !hiddenSections.has(section.type);
              const blocks = Array.isArray(section.blocks) ? section.blocks : [];

              return (
                <div key={section.type} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{section.type}</p>
                      <p className="text-[11px] text-slate-500">
                        {language === "vi" ? "Hiển thị section" : "Show section"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={sectionVisible}
                      onChange={(e) => handleSectionToggle(section.type, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30"
                    />
                  </label>

                  {variantOptions[section.type] && (
                    <div className="mt-2">
                      <label className="block text-[11px] text-slate-500 mb-1">
                        {language === "vi" ? "Biến thể hiển thị" : "Display variant"}
                      </label>
                      <select
                        value={
                          sectionVariants[section.type] ||
                          activeSchema?.sectionStyles?.[section.type.toLowerCase()]?.variant ||
                          variantOptions[section.type][0]
                        }
                        onChange={(e) => handleVariantChange(section.type, e.target.value)}
                        className="w-full rounded-md bg-slate-900 border border-slate-800 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      >
                        {variantOptions[section.type].map((variant) => (
                          <option key={variant} value={variant}>
                            {variant}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sectionVisible && blocks.length > 0 && (
                    <div className="mt-3 pl-2 border-l border-slate-800 space-y-2">
                      {blocks.map((block: any) => {
                        const blockVisible = !hiddenBlocks.has(block.key);
                        return (
                          <label key={block.key} className="flex items-center justify-between gap-3 cursor-pointer">
                            <div>
                              <p className="text-xs font-medium text-slate-300">{block.label || block.key}</p>
                              <p className="text-[10px] text-slate-500">{block.key}</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={blockVisible}
                              onChange={(e) => handleBlockToggle(block.key, e.target.checked)}
                              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/30"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
