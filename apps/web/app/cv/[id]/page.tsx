"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCvStore } from "../../../lib/store/cv";
import { useAuthStore } from "../../../lib/store/auth";
import { apiFetch } from "../../../lib/api";
import { syncSessionToApp } from "../../../lib/auth-session";
import AutosaveIndicator from "../../../components/cv/AutosaveIndicator";
import ConflictDialog from "../../../components/cv/ConflictDialog";

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
import { AtsPanel } from "../../../components/cv/editor/AtsPanel";
import { TemplatePicker } from "../../../components/cv/editor/TemplatePicker";
import { AiAssistantModal } from "../../../components/cv/editor/AiAssistantModal";
import { HistorySidebar } from "../../../components/cv/editor/HistorySidebar";

export default function CvEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const cvId = params?.id as string;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialHtmlRef = useRef<string>("");
  const lastHtmlRef = useRef<string>("");

  const { accessToken, hydrate } = useAuthStore();
  const { loadCv, saveStatus } = useCvStore();

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [exporting, setExporting] = useState<boolean>(false);

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
    if (!editor.selectedTemplate || !editor.cv) return "";
    const resumeData = editor.assembleLocalResumeData();
    try {
      return renderHtml({
        template: editor.selectedTemplate.schema,
        data: resumeData,
      });
    } catch (err) {
      console.error("Template rendering error:", err);
      return `<p style="padding: 20px; color: red;">Lỗi biên dịch giao diện CV: ${(err as Error).message}</p>`;
    }
  }, [editor]);

  // Load Auth Session
  useEffect(() => {
    hydrate();
    syncSessionToApp().catch(() => {});
  }, [hydrate]);

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

  // Reset refs khi đổi CV
  useEffect(() => {
    initialHtmlRef.current = "";
    lastHtmlRef.current = "";
  }, [cvId]);

  // Hành động in và xuất PDF
  const handleExportPDF = async () => {
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
        alert("Xuất PDF thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      alert("Lỗi khi xuất PDF. Hãy chắc chắn rằng API Server đang chạy.");
    } finally {
      setExporting(false);
    }
  };

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Vui lòng đăng nhập</h2>
        <p className="mt-2 text-slate-500">Bạn cần đăng nhập để truy cập trình soạn thảo BetterCV.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
        >
          Đăng nhập ngay
        </button>
      </main>
    );
  }

  if (!editor.cv) {
    return (
      <main className="flex h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Đang đồng bộ cấu trúc CV từ Cloud...</p>
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
            title="Quay lại Dashboard"
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
                title="Click để đổi tên CV"
              />
              <span className="text-xs text-slate-500">v{editor.cv.version}</span>
            </div>
            <p className="text-xs text-slate-500 px-2 mt-0.5">Locale: {editor.cv.locale} | ID: {editor.cv.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AutosaveIndicator />
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700/80 hover:bg-slate-800 transition-all ${
              showHistory ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 text-slate-300"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Phiên bản
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition-all border-none disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Đang in PDF...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Xuất PDF
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
              { id: "profile", label: "Thông tin cá nhân" },
              { id: "experience", label: "Kinh nghiệm" },
              { id: "education", label: "Học vấn" },
              { id: "skills", label: "Kỹ năng" },
              { id: "projects", label: "Dự án" },
              { id: "summary", label: "Giới thiệu" },
              { id: "ats", label: "Phân tích ATS 🎯" },
              { id: "settings", label: "Thiết kế & Layout" },
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
                openAiRewrite={ai.openAiRewrite}
              />
            )}

            {activeTab === "experience" && (
              <ExperiencePanel
                experiences={editor.experiences}
                addExperienceItem={editor.addExperienceItem}
                updateExperienceItem={editor.updateExperienceItem}
                removeExperienceItem={editor.removeExperienceItem}
                saveExperiences={editor.saveExperiences}
                openAiRewrite={ai.openAiRewrite}
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

            {activeTab === "ats" && (
              <AtsPanel cvId={cvId} />
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
              Live Preview (Single Rendering Contract WYSIWYG)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewScale(Math.max(50, previewScale - 10))}
                className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Thu nhỏ"
              >
                -
              </button>
              <span className="text-xs font-mono text-slate-400 w-12 text-center">{previewScale}%</span>
              <button
                onClick={() => setPreviewScale(Math.min(150, previewScale + 10))}
                className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                title="Phóng to"
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
          />
        </div>
      </div>

      {/* AI Rewrite Assistant Modal Dialog */}
      <AiAssistantModal
        showAiModal={ai.showAiModal}
        setShowAiModal={ai.setShowAiModal}
        aiTarget={ai.aiTarget}
        aiStyle={ai.aiStyle}
        setAiStyle={ai.setAiStyle}
        aiStreamingOutput={ai.aiStreamingOutput}
        isAiGenerating={ai.isAiGenerating}
        triggerAiRewrite={ai.triggerAiRewrite}
        acceptAiSuggestion={ai.acceptAiSuggestion}
        summaryText={editor.summaryText}
        experiences={editor.experiences}
      />

      {/* Editing Conflicts Overlay Dialog */}
      <ConflictDialog />
    </main>
  );
}
