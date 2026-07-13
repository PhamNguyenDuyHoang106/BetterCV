"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCvStore } from "../../../lib/store/cv";
import { useAuthStore } from "../../../lib/store/auth";
import { apiFetch } from "../../../lib/api";
import AutosaveIndicator from "../../../components/cv/AutosaveIndicator";
import ConflictDialog from "../../../components/cv/ConflictDialog";
import { useTranslation } from "../../../hooks/useTranslation";
import { syncSessionWithRetry } from "../../../lib/auth-session";

// Import renderHtml from template-engine
import { renderHtml } from "@acv/template-engine";

// Import custom hooks
import { useCvEditor } from "../../../hooks/cv/useCvEditor";
import { useAutosave } from "../../../hooks/cv/useAutosave";
import { useAiRewrite } from "../../../hooks/cv/useAiRewrite";

// Import panels components
import { ProfilePanel } from "../../../components/cv/editor/ProfilePanel";
import { SummaryPanel } from "../../../components/cv/editor/SummaryPanel";
import { ExperiencePanel } from "../../../components/cv/editor/ExperiencePanel";
import { EducationPanel } from "../../../components/cv/editor/EducationPanel";
import { SkillsPanel } from "../../../components/cv/editor/SkillsPanel";
import { ProjectsPanel } from "../../../components/cv/editor/ProjectsPanel";
import { LanguagesPanel } from "../../../components/cv/editor/LanguagesPanel";
import { CertificationsPanel } from "../../../components/cv/editor/CertificationsPanel";
import { AwardsPanel } from "../../../components/cv/editor/AwardsPanel";
import { AtsPanel } from "../../../components/cv/editor/AtsPanel";
import { TemplatePicker } from "../../../components/cv/editor/TemplatePicker";
import { HistorySidebar } from "../../../components/cv/editor/HistorySidebar";
import { getTemplateDisplayMeta } from "../../../lib/dashboard-templates";

export default function CvEditorPage() {
  const { t, language } = useTranslation();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const cvId = params?.id as string;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialHtmlRef = useRef<string>("");
  const lastHtmlRef = useRef<string>("");

  const { accessToken, user, hydrate } = useAuthStore();
  const { loadCv, isDirty, syncDirtyChanges } = useCvStore();

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [exporting, setExporting] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [checkoutQr, setCheckoutQr] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<"PRO" | "PREMIUM" | null>(null);

  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [isSavingManual, setIsSavingManual] = useState<boolean>(false);
  const [versionUpdateTrigger, setVersionUpdateTrigger] = useState<number>(0);

  // 1. Hook quản lý Autosave
  const { triggerAutosave } = useAutosave();

  // 2. Hook quản lý Form States & Actions chính của CV
  const editor = useCvEditor(cvId, triggerAutosave);

  // 3. Hook quản lý Trợ lý AI Viết CV (SSE Stream + Fallback)
  const ai = useAiRewrite({
    cv: editor.cv,
    accessToken,
    profileForm: editor.profileForm,
    experiences: editor.experiences,
    skills: editor.skills,
    educations: editor.educations,
    projects: editor.projects,
    summaryText: editor.summaryText,
    setSummaryText: editor.setSummaryText,
    saveSummary: editor.saveSummary,
    setExperiences: editor.setExperiences,
    saveExperiences: editor.saveExperiences,
  });

  // Compile Live Preview HTML
  const getCompiledHtml = useCallback(() => {
    if (!editor.cv) return "";
    const templateSchema =
      editor.selectedTemplate?.schema || editor.cv.templateSnapshot;
    if (!templateSchema) return "";
    const resumeData = editor.assembleLocalResumeData();
    try {
      return renderHtml({
        template: templateSchema,
        data: resumeData,
        locale: editor.cv?.locale || "vi",
      });
    } catch (err) {
      console.error("Template rendering error:", err);
      return `<p style="padding: 20px; color: red;">${t.editor.renderError} ${(err as Error).message}</p>`;
    }
  }, [editor, t.editor.renderError]);

  // Load Auth Session
  useEffect(() => {
    hydrate();
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedAutoSave = localStorage.getItem("acv-auto-save");
      if (savedAutoSave !== null) {
        setAutoSaveEnabled(savedAutoSave === "true");
      }
    }
  }, [hydrate]);

  const handleManualSave = async () => {
    setIsSavingManual(true);
    try {
      if (isDirty) {
        await syncDirtyChanges();
      }
      await apiFetch(`/cvs/${cvId}/versions`, { method: "POST" });
      setVersionUpdateTrigger((prev) => prev + 1);
      alert(language === "vi" ? "Lưu bản sao thành công!" : "Saved version copy successfully!");
    } catch (err) {
      console.error("Failed to save manually:", err);
      alert(language === "vi" ? "Lỗi lưu bản sao!" : "Failed to save copy!");
    } finally {
      setIsSavingManual(false);
    }
  };

  useEffect(() => {
    if (mounted && !accessToken) {
      router.replace("/");
    }
  }, [mounted, accessToken, router]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "PAYMENT_SUCCESS") {
        console.log("Payment success received from child tab!");
        try {
          await syncSessionWithRetry(5, 2000);
          alert(language === "vi" ? "Nâng cấp tài khoản thành công!" : "Account upgraded successfully!");
        } catch (e) {
          console.error("Failed to sync session on payment success:", e);
        } finally {
          setShowUpgradeModal(false);
          setCheckoutUrl(null);
          setCheckoutQr(null);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [language]);

  // Sync iframe qua postMessage để giảm giật lag và flicker
  useEffect(() => {
    const html = getCompiledHtml();
    if (!html) return;

    if (!initialHtmlRef.current) {
      initialHtmlRef.current = html;
      lastHtmlRef.current = html;
      return;
    }

    if (html === lastHtmlRef.current) return;
    lastHtmlRef.current = html;

    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: "UPDATE_HTML",
          html: html,
        },
        "*"
      );
    }
  }, [getCompiledHtml]);

  // Reset refs khi đổi CV hoặc khi cv bị null (loading)
  useEffect(() => {
    if (!editor.cv) {
      initialHtmlRef.current = "";
      lastHtmlRef.current = "";
    }
  }, [cvId, editor.cv]);

  const handleUpgradeCheckout = async (tier: "PRO" | "PREMIUM") => {
    setCheckoutLoading(tier);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard?paid=1`;
      const cancelUrl = `${origin}/dashboard?paid=0`;
      const mode = tier === "PREMIUM" ? "payment" : "subscription";
      
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
      if (!url) throw new Error("Could not retrieve checkout url");
      setCheckoutUrl(url);
      if (payload?.qrCode) setCheckoutQr(payload.qrCode);
      window.open(url, "_blank");
    } catch (e) {
      alert(language === "vi" ? "Lỗi tạo link thanh toán: " + (e as Error).message : "Error creating checkout: " + (e as Error).message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const qrSrc = checkoutQr
    ? checkoutQr.startsWith("data:") || checkoutQr.startsWith("http")
      ? checkoutQr
      : `data:image/png;base64,${checkoutQr}`
    : checkoutUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(checkoutUrl)}`
      : null;

  // Hành động in và xuất PDF
  const handleExportPDF = async () => {
    const currentTemplateId = editor.selectedTemplate?.id || editor.cv?.templateId;
    const isPremiumTemplate = currentTemplateId
      ? getTemplateDisplayMeta(currentTemplateId).tag === "Premium"
      : false;

    if (isPremiumTemplate && user?.role === "FREE") {
      setShowUpgradeModal(true);
      return;
    }

    setExporting(true);
    try {
      const res = await apiFetch<any>("/exports/pdf", {
        method: "POST",
        body: JSON.stringify({ cvId }),
      });
      const result = res?.data || res;
      if (result && result.url) {
        window.open(result.url, "_blank");
      } else {
        alert(language === "vi" ? "Xuất PDF thất bại. Vui lòng thử lại." : "Exporting PDF failed. Please try again.");
      }
    } catch (err) {
      alert(language === "vi" ? "Lỗi khi xuất PDF. Hãy chắc chắn rằng API Server đang chạy." : "Error exporting PDF. Make sure the API server is running.");
    } finally {
      setExporting(false);
    }
  };

  if (!mounted || !accessToken) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!editor.cv) {
    return (
      <main className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">{t.editor.syncingCloud}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Top Bar Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all text-slate-300"
            title={t.editor.backToDashboard}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editor.cv.title}
                onChange={(e) => editor.saveMetadata({ title: e.target.value })}
                className="bg-transparent hover:bg-slate-800/50 focus:bg-slate-800 border-none rounded px-2 py-0.5 font-semibold text-lg text-white max-w-[240px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title={t.editor.changeCvTitle}
              />
              <span className="text-xs text-slate-500">v{editor.cv.version}</span>
            </div>
            <p className="text-xs text-slate-500 px-2 mt-0.5">Locale: {editor.cv.locale} | ID: {editor.cv.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {autoSaveEnabled ? (
            <AutosaveIndicator />
          ) : (
            <button
              onClick={handleManualSave}
              disabled={isSavingManual}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700/80 transition-all ${
                isDirty
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                  : "bg-slate-900 text-slate-500 hover:bg-slate-850 border-slate-800/80"
              }`}
            >
              {isSavingManual ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  {language === "vi" ? "Đang lưu..." : "Saving..."}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8zm0 0v4h6V4H8zm-2 9h12v5H6v-5z" />
                  </svg>
                  {language === "vi" ? "Lưu bản sao" : "Save Copy"}
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700/80 hover:bg-slate-800 transition-all ${
              showHistory ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 text-slate-300"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.editor.versionTitle}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all border-none disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {t.editor.exportingPdf}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {t.editor.exportPdfBtn}
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Form Panel (Left) */}
        <div className="w-[55%] flex flex-col border-r border-slate-800 bg-slate-950">
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-800 p-2 bg-slate-950/60 sticky top-0 z-10 scrollbar-none gap-1">
            {[
              { id: "profile", label: t.editor.tabs.profile },
              { id: "experience", label: t.editor.tabs.experience },
              { id: "education", label: t.editor.tabs.education },
              { id: "skills", label: t.editor.tabs.skills },
              { id: "projects", label: t.editor.tabs.projects },
              { id: "languages", label: t.editor.tabs.languages },
              { id: "certifications", label: t.editor.tabs.certifications },
              { id: "awards", label: t.editor.tabs.awards },
              { id: "summary", label: t.editor.tabs.summary },
              { id: "ats", label: t.editor.tabs.ats },
              { id: "settings", label: t.editor.tabs.settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-800 text-white border border-slate-700/80 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Scroll Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "profile" && (
              <ProfilePanel
                profileForm={editor.profileForm}
                handleProfileChange={editor.handleProfileChange}
                handleThemeChange={editor.handleThemeChange}
                setProfileForm={editor.setProfileForm}
                saveProfile={editor.saveProfile}
              />
            )}

            {activeTab === "summary" && (
              <SummaryPanel
                summaryText={editor.summaryText}
                setSummaryText={editor.setSummaryText}
                saveSummary={editor.saveSummary}
                inlineAiState={ai.getInlineState("summary")}
                onOpenInlineAi={() => ai.openInlineAi("summary")}
                onCloseInlineAi={() => ai.closeInlineAi("summary")}
                onGenerateInlineAi={(currentText) =>
                  ai.generateInlineAi("summary", currentText)
                }
                onAcceptInlineAi={(text) => ai.acceptInlineAi("summary", text)}
              />
            )}

            {activeTab === "experience" && (
              <ExperiencePanel
                experiences={editor.experiences}
                addExperienceItem={editor.addExperienceItem}
                updateExperienceItem={editor.updateExperienceItem}
                removeExperienceItem={editor.removeExperienceItem}
                saveExperiences={editor.saveExperiences}
                getInlineAiState={ai.getInlineState}
                onOpenInlineAi={ai.openInlineAi}
                onCloseInlineAi={ai.closeInlineAi}
                onGenerateInlineAi={ai.generateInlineAi}
                onAcceptInlineAi={ai.acceptInlineAi}
              />
            )}

            {activeTab === "education" && (
              <EducationPanel
                educations={editor.educations}
                addEducationItem={editor.addEducationItem}
                updateEducationItem={editor.updateEducationItem}
                removeEducationItem={editor.removeEducationItem}
                saveEducations={editor.saveEducations}
              />
            )}

            {activeTab === "skills" && (
              <SkillsPanel
                skills={editor.skills}
                setSkills={editor.setSkills}
                showLevel={editor.showLevel}
                handleShowLevelChange={editor.handleShowLevelChange}
                addSkillItem={editor.addSkillItem}
                updateSkillItem={editor.updateSkillItem}
                removeSkillItem={editor.removeSkillItem}
                saveSkills={editor.saveSkills}
                profileTitle={editor.profileForm.title}
                cvLocale={editor.cv.locale}
              />
            )}

            {activeTab === "projects" && (
              <ProjectsPanel
                projects={editor.projects}
                addProjectItem={editor.addProjectItem}
                updateProjectItem={editor.updateProjectItem}
                removeProjectItem={editor.removeProjectItem}
                saveProjects={editor.saveProjects}
              />
            )}

            {activeTab === "languages" && (
              <LanguagesPanel
                languages={editor.languages}
                addLanguageItem={editor.addLanguageItem}
                updateLanguageItem={editor.updateLanguageItem}
                removeLanguageItem={editor.removeLanguageItem}
                saveLanguages={editor.saveLanguages}
              />
            )}

            {activeTab === "certifications" && (
              <CertificationsPanel
                certifications={editor.certifications}
                addCertificationItem={editor.addCertificationItem}
                updateCertificationItem={editor.updateCertificationItem}
                removeCertificationItem={editor.removeCertificationItem}
                saveCertifications={editor.saveCertifications}
              />
            )}

            {activeTab === "awards" && (
              <AwardsPanel
                awards={editor.awards}
                addAwardItem={editor.addAwardItem}
                updateAwardItem={editor.updateAwardItem}
                removeAwardItem={editor.removeAwardItem}
                saveAwards={editor.saveAwards}
              />
            )}

            {activeTab === "ats" && (
              <AtsPanel cvId={cvId} cvLocale={editor.cv?.locale || "vi"} />
            )}

            {activeTab === "settings" && (
              <TemplatePicker
                cv={editor.cv}
                templates={editor.templates}
                selectedTemplate={editor.selectedTemplate}
                setSelectedTemplate={editor.setSelectedTemplate}
                saveMetadata={editor.saveMetadata}
                profileForm={editor.profileForm}
                setProfileForm={editor.setProfileForm}
                saveProfile={editor.saveProfile}
                loadCv={loadCv}
                userRole={user?.role}
              />
            )}
          </div>
        </div>

        {/* Live Preview Viewport Panel (Right) */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
          {/* Viewport Control Panel */}
          <div className="border-b border-slate-800 px-5 py-3 bg-slate-950/40 backdrop-blur-md flex items-center justify-between z-10">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t.editor.livePreview}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewScale(Math.max(50, previewScale - 10))}
                className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title={t.editor.scaleOut}
              >
                -
              </button>
              <span className="text-xs font-mono text-slate-400 w-12 text-center">{previewScale}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(150, previewScale + 10))}
                className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title={t.editor.scaleIn}
              >
                +
              </button>
            </div>
          </div>

          {/* Sandboxed Iframe Container */}
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-900/50">
            <div
              className="bg-white shadow-2xl origin-top transition-transform duration-200"
              style={{
                transform: `scale(${previewScale / 100})`,
                width: "816px",
                minHeight: "1056px",
              }}
            >
              <iframe
                ref={iframeRef}
                title="Preview"
                srcDoc={initialHtmlRef.current || getCompiledHtml()}
                sandbox="allow-same-origin allow-scripts"
                className="w-full h-full border-none block"
                style={{ minHeight: "1056px" }}
              />
            </div>
          </div>

          {/* Versions Sidebar Drawer */}
          <HistorySidebar
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            cvId={cvId}
            cvVersionNum={editor.cv.version}
            cvLocale={editor.cv.locale}
            loadCv={loadCv}
            versionUpdateTrigger={versionUpdateTrigger}
          />
        </div>
      </div>

      {/* Editing Conflicts Overlay Dialog */}
      <ConflictDialog />

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
              <span className="material-symbols-outlined text-3xl">workspace_premium</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {language === "vi" ? "Mẫu CV Cao Cấp (PRO/ULTRA)" : "PRO/ULTRA CV Template"}
              </h3>
              <p className="text-sm text-slate-400">
                {language === "vi"
                  ? "Mẫu giao diện này chỉ áp dụng cho tài khoản cao cấp. Vui lòng chọn gói nâng cấp phù hợp bên dưới để tiếp tục xuất PDF."
                  : "This template is only available for premium accounts. Please choose a suitable upgrade plan below to export PDF."}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                disabled={checkoutLoading !== null}
                onClick={() => handleUpgradeCheckout("PRO")}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-500 hover:from-indigo-950/60 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-400 text-lg group-hover:scale-110 transition-transform">workspace_premium</span>
                    {language === "vi" ? "Nâng cấp gói Pro (Theo tháng)" : "Upgrade to PRO (Monthly)"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === "vi" ? "Truy cập mọi mẫu CV, đầy đủ công cụ AI thông minh." : "Unlock all premium templates and AI assistant tools."}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>

              <button
                disabled={checkoutLoading !== null}
                onClick={() => handleUpgradeCheckout("PREMIUM")}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 hover:border-amber-500 hover:from-amber-950/60 transition-all text-left group"
              >
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-400 text-lg group-hover:scale-110 transition-transform">verified</span>
                    {language === "vi" ? "Nâng cấp gói Ultra (Trọn đời)" : "Upgrade to ULTRA (Lifetime)"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === "vi" ? "Sở hữu vĩnh viễn, không giới hạn lượt xuất và tính năng." : "Lifetime access, unlimited exports and all features forever."}
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-transparent text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
              >
                {language === "vi" ? "Đóng" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Checkout QR Modal Overlay */}
      {checkoutUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">
                  {language === "vi" ? "Quét mã QR thanh toán" : "Scan QR Code"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {language === "vi"
                    ? "Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử để tiến hành nâng cấp tài khoản."
                    : "Scan the QR code with your mobile banking or wallet app to complete payment."}
                </p>
              </div>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400"
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
                  className="w-[220px] h-[220px] rounded-2xl ring-1 ring-slate-800 bg-white p-2"
                />
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={checkoutUrl}
                target="_blank"
                rel="opener"
                className="w-full text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all border-none"
              >
                {language === "vi" ? "Mở trang thanh toán" : "Open payment page"}
              </a>
              <button
                type="button"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-transparent text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(checkoutUrl);
                    alert(language === "vi" ? "Đã sao chép liên kết thanh toán vào bộ nhớ tạm!" : "Payment link copied to clipboard!");
                  } catch { }
                }}
              >
                {language === "vi" ? "Sao chép liên kết" : "Copy payment link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
