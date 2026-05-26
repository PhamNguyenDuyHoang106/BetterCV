"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCvStore } from "../../../lib/store/cv";
import { useAuthStore } from "../../../lib/store/auth";
import { apiFetch } from "../../../lib/api";
import { syncSessionToApp } from "../../../lib/auth-session";
import AutosaveIndicator from "../../../components/cv/AutosaveIndicator";
import ConflictDialog from "../../../components/cv/ConflictDialog";

// Import renderHtml from template-engine
import { renderHtml } from "@acv/template-engine";

type Template = {
  id: string;
  name: string;
  schema: any;
  category: {
    id: string;
    name: string;
  };
};

type Version = {
  id: string;
  cvId: string;
  snapshot: any;
  createdAt: string;
};

type AtsReport = {
  score: number;
  rulesEvaluated: Array<{
    ruleName: string;
    score: number;
    weight: number;
    findings: string[];
  }>;
  findings: string[];
  recommendations: string[];
};

export default function CvEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const cvId = params?.id as string;
  
  const { accessToken, hydrate } = useAuthStore();
  const {
    cv,
    saveStatus,
    loadCv,
    updateCvMetadata,
    upsertSection,
  } = useCvStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [activeTab, setActiveTab] = useState<string>("profile");
  
  // Versions and history sidebar
  const [versions, setVersions] = useState<Version[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);

  // Form states for sections
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    website: "",
    github: "",
    linkedin: "",
    avatarUrl: "",
  });

  const [summaryText, setSummaryText] = useState("");

  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Preview options
  const [previewScale, setPreviewScale] = useState<number>(100);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // ATS Panel States
  const [jobDescription, setJobDescription] = useState<string>("");
  const [atsReport, setAtsReport] = useState<AtsReport | null>(null);
  const [isAnalyzingAts, setIsAnalyzingAts] = useState<boolean>(false);

  // AI Assistant States
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTarget, setAiTarget] = useState<{ type: "summary" | "experience"; id?: string }>({ type: "summary" });
  const [aiStyle, setAiStyle] = useState<"professional" | "concise" | "ats">("professional");
  const [aiStreamingOutput, setAiStreamingOutput] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  // Load Auth Session
  useEffect(() => {
    hydrate();
    // Always sync session on mount to ensure we refresh any expired tokens hydrated from localStorage
    syncSessionToApp().catch(() => {});
  }, [hydrate]);

  // Load CV & Templates
  useEffect(() => {
    if (!accessToken || !cvId) return;
    
    loadCv(cvId);
    
    // Fetch Templates from NestJS
    apiFetch<any>("/templates")
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setTemplates(data);
        if (data.length > 0 && cv && cv.templateId) {
          const matched = data.find((t: any) => t.id === cv.templateId);
          if (matched) setSelectedTemplate(matched);
        }
      })
      .catch((err) => console.error("Error loading templates:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, cvId]);

  // Sync templates selection once CV is loaded
  useEffect(() => {
    if (cv && templates.length > 0) {
      const matched = templates.find((t) => t.id === cv.templateId);
      if (matched) {
        setSelectedTemplate(matched);
      } else if (!cv.templateId) {
        // Set default template
        const defaultTpl = templates.find((t) => t.id === "standard-ats") || templates[0];
        if (defaultTpl) {
          setSelectedTemplate(defaultTpl);
          updateCvMetadata({ templateId: defaultTpl.id });
        }
      }
    }

    // Populate local form states from CV sections
    if (cv) {
      const profileSec = cv.sections.find((s) => s.type === "PROFILE");
      if (profileSec && profileSec.content) {
        setProfileForm({
          fullName: profileSec.content.fullName || "",
          title: profileSec.content.title || "",
          email: profileSec.content.email || "",
          phone: profileSec.content.phone || "",
          website: profileSec.content.website || "",
          github: profileSec.content.github || "",
          linkedin: profileSec.content.linkedin || "",
          avatarUrl: profileSec.content.avatarUrl || "",
        });
      }

      const summarySec = cv.sections.find((s) => s.type === "SUMMARY");
      if (summarySec && summarySec.content) {
        setSummaryText(summarySec.content.text || "");
      }

      const expSec = cv.sections.find((s) => s.type === "EXPERIENCE");
      if (expSec && expSec.content && Array.isArray(expSec.content.items)) {
        setExperiences(expSec.content.items);
      } else if (expSec && expSec.content && Array.isArray(expSec.content)) {
        setExperiences(expSec.content);
      } else {
        setExperiences([]);
      }

      const eduSec = cv.sections.find((s) => s.type === "EDUCATION");
      if (eduSec && eduSec.content && Array.isArray(eduSec.content.items)) {
        setEducations(eduSec.content.items);
      } else if (eduSec && eduSec.content && Array.isArray(eduSec.content)) {
        setEducations(eduSec.content);
      } else {
        setEducations([]);
      }

      const skillSec = cv.sections.find((s) => s.type === "SKILLS");
      if (skillSec && skillSec.content && Array.isArray(skillSec.content.items)) {
        setSkills(skillSec.content.items);
      } else if (skillSec && skillSec.content && Array.isArray(skillSec.content)) {
        setSkills(skillSec.content);
      } else {
        setSkills([]);
      }

      const projSec = cv.sections.find((s) => s.type === "PROJECTS");
      if (projSec && projSec.content && Array.isArray(projSec.content.items)) {
        setProjects(projSec.content.items);
      } else if (projSec && projSec.content && Array.isArray(projSec.content)) {
        setProjects(projSec.content);
      } else {
        setProjects([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cv, templates]);

  // Load versions history
  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const res = await apiFetch<any>(`/cvs/${cvId}/versions`);
      const data = Array.isArray(res) ? res : res?.data || [];
      setVersions(data);
    } catch (err) {
      console.error("Failed to load versions:", err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("Bạn có chắc chắn muốn phục hồi CV về phiên bản này không? Tất cả các thay đổi chưa lưu trên tab hiện tại có thể bị ghi đè.")) {
      return;
    }
    try {
      await apiFetch(`/cvs/${cvId}/versions/${versionId}/restore`, { method: "POST" });
      await loadCv(cvId);
      setShowHistory(false);
      alert("Đã phục hồi phiên bản thành công!");
    } catch (err) {
      alert("Không thể phục hồi phiên bản. Vui lòng thử lại.");
    }
  };

  // Autosave triggers for metadata and sections
  const saveMetadata = (updates: { title?: string; locale?: "en" | "vi"; templateId?: string }) => {
    updateCvMetadata(updates);
  };

  const saveProfile = (updatedProfile = profileForm) => {
    const existing = cv?.sections.find((s) => s.type === "PROFILE");
    upsertSection({
      id: existing?.id,
      type: "PROFILE",
      content: updatedProfile,
      order: 1,
    });
  };

  const saveSummary = (text = summaryText) => {
    const existing = cv?.sections.find((s) => s.type === "SUMMARY");
    upsertSection({
      id: existing?.id,
      type: "SUMMARY",
      content: { text },
      order: 2,
    });
  };

  const saveExperiences = (items = experiences) => {
    const existing = cv?.sections.find((s) => s.type === "EXPERIENCE");
    upsertSection({
      id: existing?.id,
      type: "EXPERIENCE",
      content: { items },
      order: 3,
    });
  };

  const saveEducations = (items = educations) => {
    const existing = cv?.sections.find((s) => s.type === "EDUCATION");
    upsertSection({
      id: existing?.id,
      type: "EDUCATION",
      content: { items },
      order: 4,
    });
  };

  const saveSkills = (items = skills) => {
    const existing = cv?.sections.find((s) => s.type === "SKILLS");
    upsertSection({
      id: existing?.id,
      type: "SKILLS",
      content: { items },
      order: 5,
    });
  };

  const saveProjects = (items = projects) => {
    const existing = cv?.sections.find((s) => s.type === "PROJECTS");
    upsertSection({
      id: existing?.id,
      type: "PROJECTS",
      content: { items },
      order: 6,
    });
  };

  // Compile local CV data for renderHtml
  const assembleLocalResumeData = () => {
    return {
      schemaVersion: 1,
      profile: profileForm,
      summary: { text: summaryText },
      experience: experiences,
      education: educations,
      skills: skills,
      projects: projects,
    };
  };

  // Compile Live Preview HTML
  const getCompiledHtml = () => {
    if (!selectedTemplate) return "";
    const resumeData = assembleLocalResumeData();
    try {
      return renderHtml({
        template: selectedTemplate.schema,
        data: resumeData,
      });
    } catch (err) {
      console.error("Template rendering error:", err);
      return `<p style="padding: 20px; color: red;">Lỗi biên dịch giao diện CV: ${(err as Error).message}</p>`;
    }
  };

  // Actions
  const handleExportPDF = async () => {
    setExporting(true);
    setExportUrl(null);
    try {
      const res = await apiFetch<any>("/exports/pdf", {
        method: "POST",
        body: JSON.stringify({ cvId }),
      });
      const result = res?.data || res;
      if (result && result.url) {
        setExportUrl(result.url);
        window.open(result.url, "_blank");
      } else {
        alert("Xuất PDF thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      alert("Lỗi khi xuất PDF. Hãy chắc chắn rằng cổng API NestJS đang hoạt động.");
    } finally {
      setExporting(false);
    }
  };

  // ATS Evaluation trigger
  const runAtsAnalysis = async () => {
    if (!jobDescription.trim()) {
      alert("Vui lòng nhập mô tả công việc (JD) trước.");
      return;
    }
    setIsAnalyzingAts(true);
    try {
      const res = await apiFetch<any>("/ats/score", {
        method: "POST",
        body: JSON.stringify({
          cvId,
          jobDescription,
        }),
      });
      const report = res?.data?.data || res?.data || res;
      setAtsReport(report);
    } catch (err) {
      console.error("ATS Error:", err);
      alert("Lỗi khi chấm điểm ATS.");
    } finally {
      setIsAnalyzingAts(false);
    }
  };

  // AI Assistant - Trigger Rewrite SSE stream with fallback
  const triggerAiRewrite = async () => {
    setIsAiGenerating(true);
    setAiStreamingOutput("");
    
    let originalText = "";
    if (aiTarget.type === "summary") {
      originalText = summaryText;
    } else {
      const exp = experiences.find((e) => e.id === aiTarget.id);
      originalText = exp ? exp.description : "";
    }

    const payload = {
      locale: cv?.locale || "vi",
      sectionType: aiTarget.type === "summary" ? "SUMMARY" : "EXPERIENCE",
      content: aiTarget.type === "summary" ? { text: originalText } : { description: originalText },
      style: aiStyle,
    };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

    try {
      // 1. Try SSE Streaming first
      const response = await fetch(`${baseUrl}/ai/rewrite/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("SSE Stream connection failed, falling back to standard POST");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader found");

      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          
          // Parse Server Sent Events format
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.text) {
                  accumulated += data.text;
                  setAiStreamingOutput(accumulated);
                }
              } catch {
                // Ignore parsing errors for raw text chunks
                const rawContent = line.substring(6);
                if (rawContent && !rawContent.includes("done")) {
                  accumulated += rawContent;
                  setAiStreamingOutput(accumulated);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("Falling back to standard POST rewrite due to:", err);
      try {
        const res = await apiFetch<any>("/ai/rewrite", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const result = res?.data || res;
        const outputText = result.text || result.description || JSON.stringify(result);
        setAiStreamingOutput(outputText);
      } catch (postErr) {
        alert("Trợ lý AI đang bận. Vui lòng thử lại sau.");
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const acceptAiSuggestion = () => {
    if (aiTarget.type === "summary") {
      setSummaryText(aiStreamingOutput);
      saveSummary(aiStreamingOutput);
    } else {
      const updated = experiences.map((exp) =>
        exp.id === aiTarget.id ? { ...exp, description: aiStreamingOutput } : exp
      );
      setExperiences(updated);
      saveExperiences(updated);
    }
    setShowAiModal(false);
  };

  // Helpers for nested list updates
  const addExperienceItem = () => {
    const newItem = {
      id: `exp_${Date.now()}`,
      company: "Tên công ty mới",
      position: "Chức vụ mới",
      location: "",
      startDate: "2025-01",
      endDate: "2025-12",
      current: false,
      description: "- Đóng góp xây dựng...",
    };
    const updated = [...experiences, newItem];
    setExperiences(updated);
    saveExperiences(updated);
  };

  const updateExperienceItem = (id: string, field: string, val: any) => {
    const updated = experiences.map((exp) => (exp.id === id ? { ...exp, [field]: val } : exp));
    setExperiences(updated);
  };

  const removeExperienceItem = (id: string) => {
    const updated = experiences.filter((exp) => exp.id !== id);
    setExperiences(updated);
    saveExperiences(updated);
  };

  const addEducationItem = () => {
    const newItem = {
      id: `edu_${Date.now()}`,
      institution: "Trường đại học mới",
      degree: "Cử nhân",
      fieldOfStudy: "Công nghệ thông tin",
      startDate: "2020-09",
      endDate: "2024-06",
      gpa: "3.2/4.0",
    };
    const updated = [...educations, newItem];
    setEducations(updated);
    saveEducations(updated);
  };

  const updateEducationItem = (id: string, field: string, val: any) => {
    const updated = educations.map((edu) => (edu.id === id ? { ...edu, [field]: val } : edu));
    setEducations(updated);
  };

  const removeEducationItem = (id: string) => {
    const updated = educations.filter((edu) => edu.id !== id);
    setEducations(updated);
    saveEducations(updated);
  };

  const addSkillItem = () => {
    const newItem = {
      id: `skill_${Date.now()}`,
      name: "Tên kỹ năng",
      level: "Advanced",
    };
    const updated = [...skills, newItem];
    setSkills(updated);
    saveSkills(updated);
  };

  const updateSkillItem = (id: string, field: string, val: any) => {
    const updated = skills.map((sk) => (sk.id === id ? { ...sk, [field]: val } : sk));
    setSkills(updated);
  };

  const removeSkillItem = (id: string) => {
    const updated = skills.filter((sk) => sk.id !== id);
    setSkills(updated);
    saveSkills(updated);
  };

  const addProjectItem = () => {
    const newItem = {
      id: `proj_${Date.now()}`,
      name: "Tên dự án mới",
      description: "- Xây dựng hệ thống...",
      role: "Fullstack Developer",
      url: "",
      technologies: ["React", "NestJS", "PostgreSQL"],
    };
    const updated = [...projects, newItem];
    setProjects(updated);
    saveProjects(updated);
  };

  const updateProjectItem = (id: string, field: string, val: any) => {
    const updated = projects.map((pr) => (pr.id === id ? { ...pr, [field]: val } : pr));
    setProjects(updated);
  };

  const removeProjectItem = (id: string) => {
    const updated = projects.filter((pr) => pr.id !== id);
    setProjects(updated);
    saveProjects(updated);
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

  if (!cv) {
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
                value={cv.title}
                onChange={(e) => saveMetadata({ title: e.target.value })}
                className="bg-transparent hover:bg-slate-800/50 focus:bg-slate-800 border-none rounded px-2 py-0.5 font-semibold text-lg text-white max-w-[240px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="Click để đổi tên CV"
              />
              <span className="text-xs text-slate-500">v{cv.version}</span>
            </div>
            <p className="text-xs text-slate-500 px-2 mt-0.5">Locale: {cv.locale} | ID: {cv.id}</p>
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
              { id: "summary", label: "Giới thiệu" },
              { id: "experience", label: "Kinh nghiệm" },
              { id: "education", label: "Học vấn" },
              { id: "skills", label: "Kỹ năng" },
              { id: "projects", label: "Dự án" },
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
            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Thông tin liên hệ cơ bản</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Họ và tên *</label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => {
                          const newForm = { ...profileForm, fullName: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="Nguyễn Văn A"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Chức danh</label>
                      <input
                        type="text"
                        value={profileForm.title}
                        onChange={(e) => {
                          const newForm = { ...profileForm, title: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="Software Engineer"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => {
                          const newForm = { ...profileForm, email: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="name@domain.com"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Số điện thoại</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => {
                          const newForm = { ...profileForm, phone: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="+84 987 654 321"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Mạng xã hội & Portfolio</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">LinkedIn URL</label>
                      <input
                        type="text"
                        value={profileForm.linkedin}
                        onChange={(e) => {
                          const newForm = { ...profileForm, linkedin: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="https://linkedin.com/in/username"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">GitHub URL</label>
                      <input
                        type="text"
                        value={profileForm.github}
                        onChange={(e) => {
                          const newForm = { ...profileForm, github: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="https://github.com/username"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Website khác</label>
                      <input
                        type="text"
                        value={profileForm.website}
                        onChange={(e) => {
                          const newForm = { ...profileForm, website: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="https://myportfolio.dev"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400">Ảnh đại diện URL</label>
                      <input
                        type="text"
                        value={profileForm.avatarUrl}
                        onChange={(e) => {
                          const newForm = { ...profileForm, avatarUrl: e.target.value };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        placeholder="https://images.domain.com/avatar.jpg"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Tự giới thiệu bản thân</h3>
                      <p className="text-xs text-slate-500 mt-1">Viết một mô tả ngắn gọn về kinh nghiệm cốt lõi của bạn (hỗ trợ định dạng Markdown).</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setAiTarget({ type: "summary" });
                          setAiStreamingOutput("");
                          setShowAiModal(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow shadow-indigo-500/10 border-none transition-all"
                      >
                        ✨ AI Tối ưu hóa
                      </button>
                      <span className="text-xs font-mono text-slate-500">{summaryText.length} ký tự</span>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    value={summaryText}
                    onChange={(e) => {
                      setSummaryText(e.target.value);
                      saveSummary(e.target.value);
                    }}
                    placeholder="Ví dụ: Tôi là một Kỹ sư phần mềm có hơn 5 năm kinh nghiệm làm việc với các hệ thống phân tán..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Lịch sử làm việc</h3>
                  <button
                    onClick={addExperienceItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
                  >
                    + Thêm công ty
                  </button>
                </div>

                {experiences.map((exp) => (
                  <div key={exp.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group">
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAiTarget({ type: "experience", id: exp.id });
                          setAiStreamingOutput("");
                          setShowAiModal(true);
                        }}
                        className="flex h-8 px-2.5 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700/80 text-indigo-400 hover:text-indigo-300 border border-slate-700/60 transition-all text-xs font-bold"
                        title="Tối ưu mô tả bằng AI"
                      >
                        ✨ AI Rewrite
                      </button>
                      <button
                        onClick={() => removeExperienceItem(exp.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
                        title="Xóa công ty"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Tên công ty *</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperienceItem(exp.id, "company", e.target.value)}
                          onBlur={() => saveExperiences()}
                          placeholder="Ví dụ: Google LLC"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Vị trí chức danh *</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperienceItem(exp.id, "position", e.target.value)}
                          onBlur={() => saveExperiences()}
                          placeholder="Ví dụ: Senior Developer"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Bắt đầu (YYYY-MM) *</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => updateExperienceItem(exp.id, "startDate", e.target.value)}
                          onBlur={() => saveExperiences()}
                          placeholder="2022-01"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Kết thúc (YYYY-MM)</label>
                        <input
                          type="text"
                          value={exp.endDate || ""}
                          disabled={exp.current}
                          onChange={(e) => updateExperienceItem(exp.id, "endDate", e.target.value)}
                          onBlur={() => saveExperiences()}
                          placeholder="2024-05"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none disabled:opacity-40"
                        />
                      </div>
                      <div className="flex items-center mt-6">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => {
                              updateExperienceItem(exp.id, "current", e.target.checked);
                              saveExperiences(experiences.map(ex => ex.id === exp.id ? { ...ex, current: e.target.checked } : ex));
                            }}
                            className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>Hiện đang làm ở đây</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400">Mô tả công việc (Markdown)</label>
                      <textarea
                        rows={4}
                        value={exp.description}
                        onChange={(e) => updateExperienceItem(exp.id, "description", e.target.value)}
                        onBlur={() => saveExperiences()}
                        placeholder="- Lập trình backend bằng Node.js và NestJS..."
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* EDUCATION TAB */}
            {activeTab === "education" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Học vấn & Trình độ</h3>
                  <button
                    onClick={addEducationItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
                  >
                    + Thêm học vấn
                  </button>
                </div>

                {educations.map((edu) => (
                  <div key={edu.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group">
                    <button
                      onClick={() => removeEducationItem(edu.id)}
                      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
                      title="Xóa học vấn"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Trường/Cơ sở đào tạo *</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducationItem(edu.id, "institution", e.target.value)}
                          onBlur={() => saveEducations()}
                          placeholder="Ví dụ: Đại học Bách Khoa"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Bằng cấp *</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducationItem(edu.id, "degree", e.target.value)}
                          onBlur={() => saveEducations()}
                          placeholder="Cử nhân / Thạc sĩ / Kỹ sư"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400">Chuyên ngành</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy || ""}
                          onChange={(e) => updateEducationItem(edu.id, "fieldOfStudy", e.target.value)}
                          onBlur={() => saveEducations()}
                          placeholder="Ví dụ: Khoa học máy tính"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Bắt đầu</label>
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) => updateEducationItem(edu.id, "startDate", e.target.value)}
                          onBlur={() => saveEducations()}
                          placeholder="2020-09"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Tốt nghiệp</label>
                        <input
                          type="text"
                          value={edu.endDate || ""}
                          onChange={(e) => updateEducationItem(edu.id, "endDate", e.target.value)}
                          onBlur={() => saveEducations()}
                          placeholder="2024-06"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400">GPA</label>
                      <input
                        type="text"
                        value={edu.gpa || ""}
                        onChange={(e) => updateEducationItem(edu.id, "gpa", e.target.value)}
                        onBlur={() => saveEducations()}
                        placeholder="3.6/4.0 hoặc Giỏi"
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none max-w-[200px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SKILLS TAB */}
            {activeTab === "skills" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Kỹ năng chuyên môn</h3>
                  <button
                    onClick={addSkillItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
                  >
                    + Thêm kỹ năng
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {skills.map((sk) => (
                    <div key={sk.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 group">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={sk.name}
                          onChange={(e) => updateSkillItem(sk.id, "name", e.target.value)}
                          onBlur={() => saveSkills()}
                          placeholder="Ví dụ: Typescript"
                          className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
                        />
                        <select
                          value={sk.level || "Advanced"}
                          onChange={(e) => {
                            updateSkillItem(sk.id, "level", e.target.value);
                            saveSkills(skills.map(s => s.id === sk.id ? { ...s, level: e.target.value } : s));
                          }}
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-850 px-2 py-1 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Beginner">Cơ bản (Beginner)</option>
                          <option value="Intermediate">Khá (Intermediate)</option>
                          <option value="Advanced">Thành thạo (Advanced)</option>
                          <option value="Expert">Chuyên gia (Expert)</option>
                        </select>
                      </div>

                      <button
                        onClick={() => removeSkillItem(sk.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
                        title="Xóa kỹ năng"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Dự án cá nhân / Tiêu biểu</h3>
                  <button
                    onClick={addProjectItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
                  >
                    + Thêm dự án
                  </button>
                </div>

                {projects.map((proj) => (
                  <div key={proj.id} className="relative rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4 group">
                    <button
                      onClick={() => removeProjectItem(proj.id)}
                      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
                      title="Xóa dự án"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Tên dự án *</label>
                        <input
                          type="text"
                          value={proj.name}
                          onChange={(e) => updateProjectItem(proj.id, "name", e.target.value)}
                          onBlur={() => saveProjects()}
                          placeholder="Ví dụ: BetterCV Web App"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Vai trò trong dự án</label>
                        <input
                          type="text"
                          value={proj.role || ""}
                          onChange={(e) => updateProjectItem(proj.id, "role", e.target.value)}
                          onBlur={() => saveProjects()}
                          placeholder="Ví dụ: Team Lead / Fullstack"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400">Đường dẫn liên kết dự án</label>
                        <input
                          type="text"
                          value={proj.url || ""}
                          onChange={(e) => updateProjectItem(proj.id, "url", e.target.value)}
                          onBlur={() => saveProjects()}
                          placeholder="https://github.com/name/project"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400">Công nghệ (cách nhau bằng phẩy)</label>
                        <input
                          type="text"
                          value={Array.isArray(proj.technologies) ? proj.technologies.join(", ") : ""}
                          onChange={(e) => {
                            const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                            updateProjectItem(proj.id, "technologies", tags);
                          }}
                          onBlur={() => saveProjects()}
                          placeholder="React, Node.js"
                          className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400">Mô tả dự án (Markdown)</label>
                      <textarea
                        rows={3}
                        value={proj.description}
                        onChange={(e) => updateProjectItem(proj.id, "description", e.target.value)}
                        onBlur={() => saveProjects()}
                        placeholder="- Lập trình backend bằng Node.js và NestJS..."
                        className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ATS EVALUATE TAB */}
            {activeTab === "ats" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Chấm Điểm & Tối ưu hóa ATS</h3>
                    <p className="text-xs text-slate-500 mt-1">Dán mô tả công việc (Job Description) mục tiêu vào đây để hệ thống tự động quét từ khóa và đo lường độ trùng khớp.</p>
                  </div>

                  <textarea
                    rows={6}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Ví dụ: Yêu cầu ứng viên có kinh nghiệm lập trình React, Node.js và TypeScript. Hiểu biết sâu về cơ sở dữ liệu PostgreSQL..."
                    className="w-full rounded-lg bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />

                  <button
                    onClick={runAtsAnalysis}
                    disabled={isAnalyzingAts}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-sm font-bold text-white shadow shadow-indigo-500/10 border-none transition-all disabled:opacity-50"
                  >
                    {isAnalyzingAts ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Đang phân tích CV theo chuẩn ATS...
                      </>
                    ) : (
                      "Bắt đầu chấm điểm ATS 🎯"
                    )}
                  </button>
                </div>

                {atsReport && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-6 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">Kết quả phân tích tổng quan</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Dựa trên thuật toán so khớp trọng số thông minh</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase block tracking-wider font-semibold">Điểm ATS</span>
                          <span className={`text-2xl font-black ${
                            atsReport.score >= 80 ? "text-emerald-400" : atsReport.score >= 50 ? "text-amber-400" : "text-rose-400"
                          }`}>{atsReport.score}/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {atsReport.rulesEvaluated.map((rule, idx) => (
                        <div key={idx} className="rounded-lg border border-slate-850 bg-slate-900/20 p-3 text-center">
                          <span className="text-[10px] text-slate-400 block truncate font-medium">{rule.ruleName}</span>
                          <span className={`text-lg font-bold block mt-1.5 ${
                            rule.score >= 80 ? "text-emerald-400" : rule.score >= 50 ? "text-amber-400" : "text-rose-400"
                          }`}>{rule.score}%</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Phát hiện của hệ thống</h5>
                      <ul className="space-y-1.5">
                        {atsReport.findings.map((finding, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3 border-t border-slate-800 pt-4">
                      <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hành động khắc phục đề xuất</h5>
                      <ul className="space-y-1.5">
                        {atsReport.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                            <span className="text-indigo-400 mt-1">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Cài đặt ngôn ngữ</h3>
                  <div>
                    <label className="block text-xs font-medium text-slate-400">Ngôn ngữ hiển thị chính</label>
                    <select
                      value={cv.locale}
                      onChange={(e) => {
                        saveMetadata({ locale: e.target.value as "en" | "vi" });
                        // Re-trigger load to ensure server has updated the locale configuration
                        setTimeout(() => loadCv(cvId), 200);
                      }}
                      className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-850 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="vi">Tiếng Việt (vi)</option>
                      <option value="en">Tiếng Anh (en)</option>
                      <option value="ja">Tiếng Nhật (ja)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Mẫu CV giao diện chuyên nghiệp</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          saveMetadata({ templateId: tpl.id });
                        }}
                        className={`rounded-xl border p-4 text-left flex flex-col justify-between h-[120px] transition-all ${
                          selectedTemplate?.id === tpl.id
                            ? "bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20"
                            : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/40"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-white">{tpl.name}</div>
                          <div className="text-xs text-slate-500 mt-1">Loại: {tpl.schema.category || "General"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 self-end text-xs font-semibold text-indigo-400">
                          {selectedTemplate?.id === tpl.id ? "Đang áp dụng" : "Áp dụng mẫu này"}
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
                width: "816px", // Standard US Letter/A4 proportional width
                minHeight: "1056px",
              }}
            >
              <iframe
                title="Preview"
                srcDoc={getCompiledHtml()}
                sandbox="allow-same-origin allow-scripts"
                className="w-full h-full border-none block"
                style={{ minHeight: "1056px" }}
              />
            </div>
          </div>

          {/* Versions Sidebar Drawer */}
          {showHistory && (
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-300">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 sticky top-0">
                <div>
                  <h3 className="text-sm font-semibold text-indigo-400">Lịch sử sao lưu đám mây</h3>
                  <p className="text-xs text-slate-500">20 phiên bản tự động sao lưu gần đây</p>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingVersions ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    <span className="text-xs text-slate-500">Đang tải lịch sử...</span>
                  </div>
                ) : versions.length === 0 ? (
                  <div className="text-center text-xs text-slate-600 py-10">Không tìm thấy bản sao lưu nào.</div>
                ) : (
                  versions.map((ver, index) => {
                    const date = new Date(ver.createdAt);
                    return (
                      <div
                        key={ver.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 hover:bg-slate-900/80 transition-all flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-slate-300">Bản lưu #{versions.length - index}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {date.toLocaleDateString("vi-VN")} {date.toLocaleTimeString("vi-VN")}
                            </div>
                          </div>
                          <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400">
                            v{index === 0 ? cv.version : (ver.snapshot.version || index)}
                          </span>
                        </div>
                        
                        <div className="text-xs text-slate-400 truncate">
                          Mẫu: <span className="font-semibold text-slate-300">{ver.snapshot.templateId || "Standard"}</span>
                        </div>

                        <button
                          onClick={() => handleRestoreVersion(ver.id)}
                          className="mt-1 w-full rounded bg-slate-800 hover:bg-indigo-950 py-1 text-[11px] font-semibold text-slate-300 hover:text-indigo-400 transition-colors border border-slate-700/60 hover:border-indigo-900/60"
                        >
                          Phục hồi bản này
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Rewrite Assistant Modal Dialog */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-sm font-bold text-white">✨ Trợ lý AI Viết CV (Smart Assistant Suite)</span>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Workspace - Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Original and Options */}
              <div className="w-[45%] border-r border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto bg-slate-950/20">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Định dạng & Phong cách Rewrite</h4>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { id: "professional", label: "Chuyên nghiệp" },
                      { id: "concise", label: "Ngắn gọn" },
                      { id: "ats", label: "Chuẩn ATS" }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setAiStyle(style.id as any)}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                          aiStyle === style.id
                            ? "bg-indigo-600 text-white border-none"
                            : "bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700/60"
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Văn bản gốc trong CV</h4>
                  <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-850 text-xs text-slate-300 overflow-y-auto leading-relaxed">
                    {aiTarget.type === "summary" 
                      ? (summaryText || "(Văn bản trống)")
                      : (experiences.find(e => e.id === aiTarget.id)?.description || "(Văn bản trống)")}
                  </div>
                </div>

                <button
                  onClick={triggerAiRewrite}
                  disabled={isAiGenerating}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white shadow shadow-indigo-500/10 border-none transition-all disabled:opacity-50"
                >
                  {isAiGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      AI Đang viết trực tiếp (SSE)...
                    </div>
                  ) : (
                    "✨ Khởi tạo đề xuất AI"
                  )}
                </button>
              </div>

              {/* Right Column: AI Suggestion output */}
              <div className="flex-1 p-5 flex flex-col gap-4 bg-slate-950/40">
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Đề xuất tối ưu từ AI</h4>
                    {isAiGenerating && <span className="text-[10px] text-indigo-400 animate-pulse">Streaming từ OpenAI...</span>}
                  </div>
                  <textarea
                    readOnly={isAiGenerating}
                    value={aiStreamingOutput}
                    onChange={(e) => setAiStreamingOutput(e.target.value)}
                    placeholder="Đề xuất của AI sẽ xuất hiện tại đây..."
                    className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-850 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 overflow-y-auto leading-relaxed font-sans"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                  <button
                    onClick={() => setShowAiModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={acceptAiSuggestion}
                    disabled={!aiStreamingOutput || isAiGenerating}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow transition-all border-none disabled:opacity-40"
                  >
                    Chấp nhận & Thay thế
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Conflicts Overlay Dialog */}
      <ConflictDialog />
    </main>
  );
}
