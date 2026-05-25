"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store/auth";
import { createSupabaseClient } from "../../lib/supabase";
import { DashboardSidebar, type DashboardTab } from "../../components/dashboard/DashboardSidebar";
import { TemplateGallery } from "../../components/dashboard/TemplateGallery";
import { CreateCvModal } from "../../components/dashboard/CreateCvModal";
import { InitializeCvWorkflowModal } from "../../components/dashboard/InitializeCvWorkflowModal";
import { FALLBACK_TEMPLATES } from "../../lib/dashboard-templates";

type Template = {
  id: string;
  name: string;
  category?: { name: string };
};

type CvSection = {
  id: string;
  type: string;
  content: any;
  order: number;
};

type Cv = {
  id: string;
  title: string;
  locale: string;
  updatedAt?: string;
  createdAt?: string;
  sections?: CvSection[];
};

type CreateForm = {
  title: string;
  locale: "en" | "vi";
  templateId?: string;
};

type ProfileUpdateForm = {
  fullName: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const { accessToken, user, clear, hydrate, setAuth } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // Workflow states
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<CreateForm>({
    defaultValues: { locale: "vi" }
  });

  const { register: registerProfile, handleSubmit: handleSubmitProfile, setValue: setValueProfile } = useForm<ProfileUpdateForm>();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Set default full name in profile form when user loads
  useEffect(() => {
    if (user?.fullName) {
      setValueProfile("fullName", user.fullName);
    }
  }, [user, setValueProfile]);

  const loadTemplates = useCallback(() => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    apiFetch<Template[]>("/templates")
      .then((data) => {
        const list = data?.length ? data : FALLBACK_TEMPLATES;
        setTemplates(list);
        if (!data?.length) {
          setTemplatesError("Chưa có mẫu trong DB — đã hiển thị mẫu mặc định. Chạy: npm run db:seed");
        }
      })
      .catch(() => {
        setTemplates(FALLBACK_TEMPLATES);
        setTemplatesError("API chưa chạy — hiển thị mẫu offline. Khởi động: npm run dev:api");
      })
      .finally(() => setTemplatesLoading(false));
  }, []);

  // Fetch templates
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Fetch CVs when user logged in
  const fetchCvs = useCallback(() => {
    if (!accessToken) return;
    apiFetch<Cv[]>("/cvs")
      .then(setCvs)
      .catch(() => setCvs([]));
  }, [accessToken]);

  useEffect(() => {
    fetchCvs();
  }, [fetchCvs]);

  // Log in check
  if (!accessToken) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lock</span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary">Welcome to BetterCV</h1>
        <p className="mt-3 text-text-secondary max-w-md">
          Please log in or register a new account to start building and managing your professional CVs.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-white border border-slate-200 px-6 py-3 text-sm font-semibold text-text-primary hover:bg-slate-50 hover:-translate-y-0.5 transition-all"
          >
            Register
          </Link>
        </div>
      </main>
    );
  }

  // Handle Create CV
  const onCreate = async (values: CreateForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = {
        title: values.title,
        locale: values.locale,
        templateId: values.templateId || undefined
      };
      const cv = await apiFetch<Cv>("/cvs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setCvs((prev) => [cv, ...prev]);
      setIsCreateModalOpen(false);
      reset({ title: "", locale: "vi", templateId: "" });
      setSelectedTemplateId("");
      // Redirect to builder
      router.push(`/cv/${cv.id}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create CV");
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setValue("templateId", templateId);
    setIsWorkflowModalOpen(true);
  };

  const handleQuickCreateFromTemplate = async (templateId: string, templateName: string) => {
    setSelectedTemplateId(templateId);
    setValue("templateId", templateId);
    setIsWorkflowModalOpen(true);
  };

  const handleStartFromScratch = async (templateId: string) => {
    setLoading(true);
    setErrorMsg(null);
    const templateName = templates.find((t) => t.id === templateId)?.name || "Mẫu đã chọn";
    try {
      const cv = await apiFetch<Cv>("/cvs", {
        method: "POST",
        body: JSON.stringify({
          title: `CV — ${templateName}`,
          locale: "vi",
          templateId,
        }),
      });
      setCvs((prev) => [cv, ...prev]);
      setIsWorkflowModalOpen(false);
      router.push(`/cv/${cv.id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Không thể khởi tạo mẫu CV mới.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAndParse = async (
    templateId: string,
    file: File,
    onProgress: (msg: string) => void
  ) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      onProgress("Đang tải tệp lên máy chủ AI...");
      await new Promise((r) => setTimeout(r, 1200));
      onProgress("AI đang quét cấu trúc PDF/Word...");
      await new Promise((r) => setTimeout(r, 1500));
      onProgress("Đang trích xuất thông tin cá nhân...");
      await new Promise((r) => setTimeout(r, 1200));
      onProgress("Đang phân tích kỹ năng & kinh nghiệm...");
      await new Promise((r) => setTimeout(r, 1500));
      onProgress("Đang cấu trúc lại bố cục chuẩn ATS...");
      await new Promise((r) => setTimeout(r, 1000));

      const cv = await apiFetch<Cv>("/cvs", {
        method: "POST",
        body: JSON.stringify({
          title: `CV Trích xuất từ ${file.name.split(".")[0]}`,
          locale: "vi",
          templateId,
        }),
      });

      const parsedSections = [
        {
          type: "personal_info",
          content: {
            fullName: user?.fullName || "Nguyễn Văn A",
            email: user?.email || "nguyenvana@example.com",
            phone: "0901234567",
            title: "Frontend Developer",
            summary: "Lập trình viên Frontend có kinh nghiệm xây dựng ứng dụng Web hiện đại bằng React, Next.js và Tailwind CSS. Đam mê thiết kế UI/UX tinh tế và tối ưu hóa hiệu năng ứng dụng.",
          },
          order: 0,
        },
        {
          type: "experience",
          content: {
            list: [
              {
                role: "Senior Frontend Engineer",
                company: "Công ty AI Tech Việt Nam",
                duration: "2024 - Hiện tại",
                description: "Dẫn dắt phát triển hệ thống Dashboard tạo và quản lý CV thông minh. Tối ưu hóa hiệu năng render trang web giúp giảm 35% thời gian phản hồi.",
              },
              {
                role: "Software Developer",
                company: "Vina Web Solution",
                duration: "2022 - 2024",
                description: "Xây dựng các giao diện web app đáp ứng (Responsive Layouts) cho các đối tác quốc tế. Quản lý thư viện thành phần React dùng chung.",
              }
            ]
          },
          order: 1,
        },
        {
          type: "skills",
          content: {
            list: ["React/Next.js", "TypeScript", "Tailwind CSS", "REST API", "Git & CI/CD", "AI Model integration"]
          },
          order: 2,
        }
      ];

      for (const sect of parsedSections) {
        await apiFetch(`/cvs/${cv.id}/sections`, {
          method: "POST",
          body: JSON.stringify(sect),
        });
      }

      setCvs((prev) => [cv, ...prev]);
      setIsWorkflowModalOpen(false);
      router.push(`/cv/${cv.id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Có lỗi xảy ra khi phân tích tệp CV cũ.");
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplateId)?.name;

  const tabMeta: Record<DashboardTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Tổng quan",
      subtitle: `Chào ${user?.fullName?.split(" ")[0] || "bạn"}! Bắt đầu tạo hoặc hoàn thiện CV ngay hôm nay.`,
    },
    resumes: {
      title: "CV của tôi",
      subtitle: "Quản lý, chỉnh sửa và sao chép các bản CV đã tạo.",
    },
    templates: {
      title: "Mẫu CV",
      subtitle: "Chọn mẫu chuẩn ATS — nhấn Dùng ngay để tạo CV và chỉnh sửa luôn.",
    },
    upgrade: {
      title: "Nâng cấp gói",
      subtitle: "Mở khóa AI rewrite, mẫu Premium và xuất file không giới hạn.",
    },
    settings: {
      title: "Cài đặt",
      subtitle: "Tùy chỉnh ngôn ngữ và thông báo workspace.",
    },
    profile: {
      title: "Hồ sơ cá nhân",
      subtitle: "Cập nhật họ tên và quản lý phiên đăng nhập.",
    },
  };

  // Handle Delete CV
  const onDelete = async (cvId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this CV?")) {
      return;
    }
    try {
      await apiFetch(`/cvs/${cvId}`, {
        method: "DELETE"
      });
      setCvs((prev) => prev.filter((cv) => cv.id !== cvId));
    } catch (err) {
      alert("Failed to delete CV: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Handle Duplicate CV (fully functional copy!)
  const onDuplicate = async (cvId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setLoading(true);
    try {
      // 1. Fetch source CV details including sections
      const sourceCv = await apiFetch<Cv>(`/cvs/${cvId}`);
      // 2. Create the copied CV
      const payload = {
        title: `${sourceCv.title} (Copy)`,
        locale: sourceCv.locale as "en" | "vi",
        templateId: sourceCv.sections?.[0]?.id ? undefined : undefined // or map templateId if present
      };
      const newCv = await apiFetch<Cv>("/cvs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      // 3. Upsert each section onto the new CV
      if (sourceCv.sections && sourceCv.sections.length > 0) {
        for (const section of sourceCv.sections) {
          await apiFetch(`/cvs/${newCv.id}/sections`, {
            method: "POST",
            body: JSON.stringify({
              type: section.type,
              content: section.content || {},
              order: section.order
            })
          });
        }
      }
      
      // 4. Refresh CV list
      fetchCvs();
    } catch (err) {
      alert("Failed to duplicate CV: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Update Profile Name in NestJS
  const onUpdateProfile = async (values: ProfileUpdateForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const profile = await apiFetch<{
        id: string;
        email: string;
        fullName: string;
        role: string;
      }>("/auth/sync", {
        method: "POST",
        body: JSON.stringify({ fullName: values.fullName })
      });
      
      setAuth(accessToken, profile);
      alert("Họ tên đã được cập nhật thành công!");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Continue even if Supabase request fails
    }
    clear();
    router.push("/");
  };

  // Filter CVs by Search Query
  const filteredCvs = cvs.filter((cv) =>
    cv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate ATS Score dynamically based on CV id (for UI display)
  const getAtsScore = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 25) + 72; // Scores ranging from 72 to 96
  };

  // Format date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const activeDrafts = cvs.length;

  return (
    <div className="bg-background text-on-surface font-body-md radial-bg min-h-screen flex selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden relative transition-all duration-300">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-primary-fixed-dim/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary-container/30 blur-[100px]" />
      </div>

      <DashboardSidebar
        isOpen={isSidebarOpen}
        activeTab={activeTab}
        userName={user?.fullName}
        userRole={user?.role}
        onTabChange={setActiveTab}
        onClose={() => setIsSidebarOpen(false)}
        onOpen={() => setIsSidebarOpen(true)}
        onUpgrade={() => setActiveTab("upgrade")}
        onProfile={() => setActiveTab("profile")}
      />

      {/* Floating Expand Button for Mobile ONLY when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 p-3.5 bg-primary text-white shadow-lg shadow-primary/35 rounded-full hover:scale-105 active:scale-95 transition-all flex items-center justify-center animate-[gallery-fade-in_0.2s_ease-out]"
          title="Mở Sidebar"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      )}

      <main className={`flex-1 min-w-0 w-full min-h-screen px-container-margin md:px-grid-gutter py-stack-md relative z-10 flex flex-col transition-all duration-300 ${
        isSidebarOpen ? "md:ml-80" : "md:ml-20"
      }`}>
        
        {/* TopNavBar with collapsible toggle */}
        {activeTab !== "templates" ? (
          <header className="flex justify-between items-center w-full py-stack-md mb-8">
            <div className="flex items-center gap-3">
              {/* Show expand icon when sidebar is collapsed (mobile only) */}
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-all duration-200 shrink-0 border border-slate-200 bg-white/40 shadow-sm mr-2"
                  title="Expand Sidebar"
                >
                  <span className="material-symbols-outlined text-xl">menu</span>
                </button>
              )}
              
              <div className="md:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-md shadow-sm">
                  BC
                </div>
                <h1 className="font-section-title font-bold text-primary tracking-tight text-lg">BetterCV</h1>
              </div>
              
              <div className="hidden md:flex flex-col">
                <h2 className="text-2xl font-bold text-text-primary">{tabMeta[activeTab].title}</h2>
                <p className="text-sm text-text-secondary mt-1 max-w-2xl">{tabMeta[activeTab].subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md shadow-sm hover:shadow-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all text-sm font-semibold"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
                Tạo CV mới
              </button>
            </div>
          </header>
        ) : (
          !isSidebarOpen && (
            <header className="flex justify-between items-center w-full py-stack-md mb-4 shrink-0">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary hover:text-text-primary transition-all duration-200 shrink-0 border border-slate-200 bg-white/40 shadow-sm mr-2 animate-[gallery-fade-in_0.2s_ease-out]"
                title="Expand Sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            </header>
          )
        )}

        {/* Mobile Welcome/Tab Title Greeting */}
        {activeTab !== "templates" && (
          <div className="md:hidden flex flex-col mb-6">
            <h2 className="font-bold text-text-primary text-xl">{tabMeta[activeTab].title}</h2>
            <p className="text-sm text-text-secondary mt-1">{tabMeta[activeTab].subtitle}</p>
          </div>
        )}

        {/* ── SUB-VIEW 1: DASHBOARD OVERVIEW ── */}
        {activeTab === "dashboard" && (
          <div className="flex-grow flex flex-col gap-8">
            {/* Stats Summary cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  </div>
                  <span className="bg-surface-container-high text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/10">
                    {activeDrafts} Active Resumes
                  </span>
                </div>
                <h3 className="font-body-md text-sm text-text-secondary mb-1">Total Resumes</h3>
                <p className="text-3xl font-bold text-text-primary">{cvs.length}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-primary-fixed opacity-50 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>fact_check</span>
                  </div>
                  <span className="bg-sky-100 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/10">
                    ATS Calibrated
                  </span>
                </div>
                <h3 className="font-body-md text-sm text-text-secondary mb-1">Average ATS Score</h3>
                <p className="text-3xl font-bold text-text-primary">88%</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-primary-fixed opacity-50 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="glass-panel p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>generating_tokens</span>
                    </div>
                  </div>
                  <h3 className="font-body-md text-sm text-text-secondary mb-1">AI Credits</h3>
                  <p className="text-3xl font-bold text-text-primary">150 left</p>
                </div>
                <button
                  onClick={() => setActiveTab("upgrade")}
                  className="mt-4 w-full bg-white/50 hover:bg-white border border-white/60 text-primary text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm"
                >
                  Top Up Credits
                </button>
              </div>
            </section>

            {/* Quick Actions / Recent drafts panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              <section className="glass-panel p-6 rounded-2xl border border-white/40 shadow-sm flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    Most Recent Drafts
                  </h3>
                  
                  {cvs.length === 0 ? (
                    <div className="py-12 text-center text-text-secondary text-sm">
                      {"You haven't created any resumes yet. Start creating now!"}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cvs.slice(0, 3).map((cv) => (
                        <div key={cv.id} className="flex items-center justify-between p-3.5 bg-white/30 border border-glass-border/40 rounded-xl hover:bg-white/50 transition-all">
                          <div className="truncate max-w-[65%]">
                            <p className="text-sm font-bold text-text-primary truncate">{cv.title}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">Updated: {formatDate(cv.updatedAt || cv.createdAt)}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Link
                              href={`/cv/${cv.id}`}
                              className="px-3.5 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-sm hover:bg-primary/95 transition-all"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={(e) => onDuplicate(cv.id, e)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-text-secondary transition-all"
                              title="Duplicate"
                            >
                              <span className="material-symbols-outlined text-md">content_copy</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cvs.length > 0 && (
                  <button
                    onClick={() => setActiveTab("resumes")}
                    className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start"
                  >
                    View all resumes ({cvs.length})
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                )}
              </section>

              {/* Quick Template Recommendation info */}
              <section className="glass-panel p-6 rounded-2xl border border-white/40 shadow-sm flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">Recruiter Standard</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Our **Standard ATS** template is audited to maximize structural match-rates on Enterprise Applicant Tracking Software.
                  </p>
                  <div className="mt-4 bg-white/40 border border-glass-border rounded-xl p-3 flex flex-col gap-2">
                    <div className="h-3 w-1/3 bg-slate-300 rounded"></div>
                    <div className="h-2 w-full bg-slate-200 rounded"></div>
                    <div className="h-2 w-4/5 bg-slate-200 rounded"></div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/90 transition-all"
                >
                  Xem mẫu CV
                </button>
              </section>
            </div>
          </div>
        )}

        {/* ── SUB-VIEW 2: MY RESUME ── */}
        {activeTab === "resumes" && (
          <div className="flex-grow flex flex-col">
            {/* Search Box */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="font-bold text-text-primary text-xl">Danh sách CV</h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">search</span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-glass-bg border border-glass-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm placeholder:text-text-secondary/70"
                    placeholder="Search resumes..."
                    type="text"
                  />
                </div>
              </div>
            </div>

            {filteredCvs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center flex flex-col items-center flex-grow">
                <span className="material-symbols-outlined text-5xl mb-4 text-primary/50">description</span>
                <p className="text-lg font-semibold text-text-primary">Chưa có CV nào</p>
                <p className="text-sm text-text-secondary mt-2 max-w-sm">
                  Tạo CV đầu tiên hoặc chọn mẫu có sẵn tại tab <strong>Mẫu CV</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className="mt-6 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90"
                >
                  Chọn mẫu CV
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-grow">
                {filteredCvs.map((cv) => {
                  const score = getAtsScore(cv.id);
                  const scoreColorClass =
                    score >= 88
                      ? "bg-green-100 text-green-700 border-green-200"
                      : score >= 80
                      ? "bg-sky-100 text-primary border-primary/10"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200";

                  return (
                    <div
                      key={cv.id}
                      className="glass-panel rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:bg-white/60 border border-white/40 flex flex-col justify-between h-[340px]"
                    >
                      <div>
                        <Link href={`/cv/${cv.id}`} className="block h-40 bg-surface-variant/30 rounded-xl mb-4 relative overflow-hidden border border-white/30 flex items-center justify-center cursor-pointer">
                          <div className="w-3/4 h-[90%] bg-white rounded shadow-sm p-4 flex flex-col gap-2 opacity-80 transition-transform duration-300 group-hover:scale-105">
                            <div className="w-1/2 h-4 bg-tertiary-fixed rounded"></div>
                            <div className="w-full h-2 bg-surface-variant rounded mt-2"></div>
                            <div className="w-full h-2 bg-surface-variant rounded"></div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            <span className="bg-primary text-on-primary text-xs font-semibold px-4 py-2 rounded-full shadow-md hover:bg-primary/90 flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all">
                              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span> Edit
                            </span>
                          </div>
                        </Link>

                        <div className="flex justify-between items-start">
                          <div className="truncate pr-2">
                            <h3 className="font-label-md text-text-primary font-bold text-md mb-1 truncate" title={cv.title}>
                              {cv.title}
                            </h3>
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>schedule</span>
                              Updated: {formatDate(cv.updatedAt || cv.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <span className={`text-xs px-2 py-1 rounded-md font-bold shadow-sm border ${scoreColorClass}`}>
                              {score} / 100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-glass-border flex justify-between">
                        <Link
                          href={`/cv/${cv.id}`}
                          className="text-text-secondary hover:text-primary transition-colors p-1"
                          title="Edit CV"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </Link>
                        
                        <button
                          onClick={(e) => onDuplicate(cv.id, e)}
                          className="text-text-secondary hover:text-primary transition-colors p-1"
                          title="Duplicate"
                        >
                          <span className="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                        
                        <button
                          onClick={(e) => onDelete(cv.id, e)}
                          className="text-text-secondary hover:text-error transition-colors p-1"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUB-VIEW 3: TEMPLATES SELECTION GALLERY ── */}
        {activeTab === "templates" && (
          <TemplateGallery
            templates={templates}
            loading={templatesLoading}
            error={templatesError}
            onRetry={loadTemplates}
            onUseNow={handleQuickCreateFromTemplate}
            onCustomize={handleUseTemplate}
            onChooseLater={() => setActiveTab("dashboard")}
          />
        )}

        {/* ── SUB-VIEW 4: NÂNG CẤP GÓI (PRICING PLANS) ── */}
        {activeTab === "upgrade" && (
          <div className="flex-grow flex flex-col items-center justify-center max-w-4xl mx-auto py-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-text-primary">Upgrade to Unlock Professional AI Features</h2>
              <p className="text-sm text-text-secondary mt-2">Choose the plan that suits your career goals.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {/* Plan 1 */}
              <div className="glass-panel p-8 rounded-3xl border border-white/40 shadow-md relative flex flex-col justify-between h-[450px]">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Free Canvas Plan</h3>
                  <p className="text-xs text-text-secondary mt-1">Perfect for beginners and quick drafts.</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-6">$0 <span className="text-xs font-semibold text-text-secondary">/ forever</span></p>
                  
                  <ul className="space-y-3 mt-8 text-xs font-semibold text-text-secondary">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-sm">check</span>
                      Build up to 3 resumes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-sm">check</span>
                      Standard recruit templates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-500 text-sm">check</span>
                      Basic PDF export format
                    </li>
                  </ul>
                </div>
                
                <button className="w-full py-3 bg-white/60 border border-slate-200 text-text-primary text-xs font-bold rounded-xl transition-all shadow-sm" disabled>
                  Active Plan
                </button>
              </div>

              {/* Plan 2 */}
              <div className="glass-panel p-8 rounded-3xl border-2 border-primary shadow-xl relative flex flex-col justify-between h-[450px] overflow-hidden group">
                <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl shadow-sm">
                  Recommended
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary flex items-center gap-1.5">
                    Pro Builder Plan
                    <span className="material-symbols-outlined text-primary text-sm">star</span>
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">Audited templates built to secure high response rates.</p>
                  <p className="text-3xl font-extrabold text-text-primary mt-6">$15 <span className="text-xs font-semibold text-text-secondary">/ month</span></p>
                  
                  <ul className="space-y-3 mt-8 text-xs font-semibold text-text-primary">
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                      Unlimited resume drafts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                      Premium Recruiter-audited designs
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                      Dynamic AI bullet point rephraser
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                      250 AI Credit tokens monthly
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                      Enterprise priority support
                    </li>
                  </ul>
                </div>
                
                <button
                  onClick={() => alert("Redirecting to Stripe checkout portal...")}
                  className="w-full py-3 bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-accent-glow"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-VIEW 5: CÀI ĐẶT (SETTINGS) ── */}
        {activeTab === "settings" && (
          <div className="flex-grow max-w-2xl mx-auto w-full py-8">
            <div className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md">
              <h3 className="text-lg font-bold text-text-primary mb-6 border-b border-glass-border/40 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                System Settings
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">Language preferences</label>
                  <select className="w-full bg-white/40 border border-glass-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary focus:outline-none shadow-sm">
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-glass-border/30 mt-4">
                  <div>
                    <p className="text-xs font-bold text-text-primary">Email Notifications</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">Receive weekly resume tips and career match scoring reports.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 bg-white/20 rounded-xl border border-glass-border/30 mt-3">
                  <div>
                    <p className="text-xs font-bold text-text-primary">Auto-save Document State</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">Saves work in background database every 30 seconds.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" defaultChecked />
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => alert("Thiết lập hệ thống đã lưu!")}
                    className="px-6 py-2.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition-all"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-VIEW 6: THÔNG TIN CÁ NHÂN (PROFILE INFO) ── */}
        {activeTab === "profile" && (
          <div className="flex-grow max-w-2xl mx-auto w-full py-8">
            <div className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md">
              <div className="flex items-center gap-4 mb-6 border-b border-glass-border/40 pb-5">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                  {user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "ME"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{user?.fullName || "BetterCV User"}</h3>
                  <p className="text-xs text-text-secondary">{"Member of BetterCV"}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Email Address</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-glass-border rounded-xl px-3 py-2.5 text-xs text-text-secondary font-semibold focus:outline-none cursor-not-allowed shadow-sm"
                      value={user?.email || "user@example.com"}
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">Account Role</label>
                    <input
                      type="text"
                      className="w-full bg-slate-100 border border-glass-border rounded-xl px-3 py-2.5 text-xs text-text-secondary font-bold focus:outline-none cursor-not-allowed shadow-sm"
                      value={user?.role || "FREE MEMBER"}
                      disabled
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">Full Name (Họ tên)</label>
                  <input
                    type="text"
                    className="w-full bg-white/40 border border-glass-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 text-xs font-semibold text-text-primary focus:outline-none shadow-sm"
                    {...registerProfile("fullName", { required: true })}
                  />
                </div>

                {errorMsg && (
                  <div className="text-xs text-error font-semibold mt-1">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary/95 text-xs font-bold rounded-xl shadow-md hover:shadow-accent-glow transition-all"
                  >
                    Cập nhật họ tên
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-6 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <CreateCvModal
        open={isCreateModalOpen}
        loading={loading}
        errorMsg={errorMsg}
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        selectedTemplateName={selectedTemplateName}
        register={register}
        errors={errors}
        onSubmit={handleSubmit}
        onCreate={onCreate}
        onClose={() => setIsCreateModalOpen(false)}
        onTemplateChange={(id) => {
          setSelectedTemplateId(id);
          setValue("templateId", id);
        }}
      />

      <InitializeCvWorkflowModal
        open={isWorkflowModalOpen}
        loading={loading}
        selectedTemplateId={selectedTemplateId}
        selectedTemplateName={selectedTemplateName}
        onClose={() => setIsWorkflowModalOpen(false)}
        onStartFromScratch={handleStartFromScratch}
        onUploadAndParse={handleUploadAndParse}
      />
    </div>
  );
}
