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
import { DashPageHero } from "../../components/dashboard/dashboard-ui";
import { DashboardOverviewTab } from "../../components/dashboard/views/DashboardOverviewTab";
import { DashboardResumesTab } from "../../components/dashboard/views/DashboardResumesTab";
import { DashboardUpgradeTab } from "../../components/dashboard/views/DashboardUpgradeTab";
import { DashboardSettingsTab } from "../../components/dashboard/views/DashboardSettingsTab";
import { DashboardProfileTab } from "../../components/dashboard/views/DashboardProfileTab";
import { FALLBACK_TEMPLATES } from "../../lib/dashboard-templates";
import { syncSessionToApp } from "../../lib/auth-session";

type Template = {
  id: string;
  name: string;
  schema?: any;
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
    // Always sync session on mount to ensure we refresh any expired tokens hydrated from localStorage
    syncSessionToApp().catch(() => {});
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
    apiFetch<any>("/templates")
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data || [];
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
    apiFetch<any>("/cvs")
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setCvs(list);
      })
      .catch(() => setCvs([]));
  }, [accessToken]);

  useEffect(() => {
    fetchCvs();
  }, [fetchCvs]);

  // Log in check
  if (!accessToken) {
    return (
      <main className="min-h-screen auth-page-bg flex items-center justify-center p-6">
        <div className="auth-card max-w-md w-full p-10 text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary via-primary-dark to-primary-darker rounded-2xl flex items-center justify-center text-on-primary font-bold text-xl shadow-lg mb-5">
            BC
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome to BetterCV</h1>
          <p className="mt-3 text-slate-500 text-sm leading-relaxed">
            Please log in or register a new account to start building and managing your professional CVs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="auth-primary-btn inline-flex items-center justify-center">
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Register
            </Link>
          </div>
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
      const res = await apiFetch<any>("/cvs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const cv = res?.data || res;
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
      const res = await apiFetch<any>("/cvs", {
        method: "POST",
        body: JSON.stringify({
          title: `CV — ${templateName}`,
          locale: "vi",
          templateId,
        }),
      });
      const cv = res?.data || res;
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
      
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await apiFetch<any>("/ai/upload-cv", {
        method: "POST",
        body: formData,
      });
      const job = uploadRes?.data || uploadRes;

      let status = job.status;
      let currentJob = job;

      onProgress("Đang đưa CV vào hàng đợi xử lý AI...");

      while (status === "uploaded" || status === "queued" || status === "processing") {
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await apiFetch<any>(`/ai/ocr/status/${job.id}`);
        currentJob = statusRes?.data || statusRes;
        status = currentJob.status;

        if (status === "processing") {
          onProgress("AI đang tiến hành quét OCR và phân tích cấu trúc CV...");
        }
      }

      if (status === "completed" && currentJob.extractedCvId) {
        onProgress("Trích xuất hoàn tất! Đang áp dụng thiết kế giao diện...");
        
        // Save the chosen templateId onto the extracted CV
        if (templateId) {
          await apiFetch(`/cvs/${currentJob.extractedCvId}`, {
            method: "PUT",
            body: JSON.stringify({
              title: `Imported - ${file.name.replace(/\.[^/.]+$/, "")}`,
              locale: "vi",
              templateId,
              version: 1, // Start with version 1
            }),
          }).catch((err) => console.warn("Failed to set templateId on extracted CV:", err));
        }

        // Fetch refreshed CVs list
        fetchCvs();
        setIsWorkflowModalOpen(false);
        router.push(`/cv/${currentJob.extractedCvId}`);
      } else {
        throw new Error(currentJob.error || "Quá trình trích xuất CV bằng AI gặp lỗi.");
      }
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
      const sourceCvRes = await apiFetch<any>(`/cvs/${cvId}`);
      const sourceCv = sourceCvRes?.data || sourceCvRes;
      // 2. Create the copied CV
      const payload = {
        title: `${sourceCv.title} (Copy)`,
        locale: sourceCv.locale as "en" | "vi",
        templateId: sourceCv.templateId || undefined,
      };

      const newCvRes = await apiFetch<any>("/cvs", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const newCv = newCvRes?.data || newCvRes;
      
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
      const profileRes = await apiFetch<any>("/auth/sync", {
        method: "POST",
        body: JSON.stringify({ fullName: values.fullName })
      });
      const profile = profileRes?.data || profileRes;
      
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

  return (
    <div className="dashboard-shell text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden relative transition-all duration-300">
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
        activeTab={activeTab}
        userName={user?.fullName}
        userRole={user?.role}
        onTabChange={setActiveTab}
        onUpgrade={() => setActiveTab("upgrade")}
        onProfile={() => setActiveTab("profile")}
      />

      <main className="flex-1 min-w-0 w-full min-h-screen pt-topnav-height px-container-margin md:px-grid-gutter py-stack-md relative z-10 flex flex-col transition-all duration-300">
        <header className="flex flex-wrap justify-end items-center gap-4 w-full mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className="dash-btn-primary flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Tạo CV mới
          </button>
        </header>

        {activeTab !== "templates" && (
          <div className="mb-6">
            <DashPageHero
              title={tabMeta[activeTab].title}
              subtitle={tabMeta[activeTab].subtitle}
              accent={
                activeTab === "upgrade"
                  ? "amber"
                  : activeTab === "settings"
                    ? "teal"
                    : activeTab === "profile"
                      ? "violet"
                      : activeTab === "resumes"
                        ? "violet"
                        : "blue"
              }
            />
          </div>
        )}

        {activeTab === "dashboard" && (
          <DashboardOverviewTab
            cvs={cvs}
            onGoResumes={() => setActiveTab("resumes")}
            onGoTemplates={() => setActiveTab("templates")}
            onGoUpgrade={() => setActiveTab("upgrade")}
            onDuplicate={onDuplicate}
            formatDate={formatDate}
          />
        )}

        {activeTab === "resumes" && (
          <DashboardResumesTab
            filteredCvs={filteredCvs}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onGoTemplates={() => setActiveTab("templates")}
            getAtsScore={getAtsScore}
            formatDate={formatDate}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}

        {/* Templates */}
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

        {activeTab === "upgrade" && <DashboardUpgradeTab />}

        {activeTab === "settings" && <DashboardSettingsTab />}

        {activeTab === "profile" && (
          <DashboardProfileTab
            user={user}
            errorMsg={errorMsg}
            register={registerProfile}
            onSubmit={handleSubmitProfile}
            onUpdate={onUpdateProfile}
            onLogout={handleLogout}
          />
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
