"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store/auth";
import { TEMPLATE_IDS } from "@acv/shared";
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
import { FALLBACK_TEMPLATES, getTemplateDisplayMeta } from "../../lib/dashboard-templates";
import { syncSessionToApp } from "../../lib/auth-session";
import { useLanguageStore } from "../../lib/store/language";
import { translations } from "../../lib/translations";
import { isRenderableCv } from "../../lib/cv-health";

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

type AtsScan = {
  overallScore: number;
};

type Cv = {
  id: string;
  title: string;
  locale: string;
  templateId?: string;
  atsScore?: number | null;
  completenessScore?: number | null;
  thumbnailUrl?: string | null;
  thumbnailGeneratedAt?: string | null;
  thumbnailStatus?: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  atsScans?: AtsScan[];
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

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, user, clear, hydrate, setAuth } = useAuthStore();
  const { language } = useLanguageStore();

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
  const [mounted, setMounted] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<CreateForm>({
    defaultValues: { locale: "vi" }
  });

  const { register: registerProfile, handleSubmit: handleSubmitProfile, setValue: setValueProfile } = useForm<ProfileUpdateForm>();

  useEffect(() => {
    hydrate();
    // Always sync session on mount to ensure we refresh any expired tokens hydrated from localStorage
    syncSessionToApp().catch(() => {});
    setMounted(true);
  }, [hydrate]);

  useEffect(() => {
    if (mounted && !accessToken) {
      router.replace("/");
    }
  }, [mounted, accessToken, router]);

  useEffect(() => {
    const paid = searchParams.get("paid");
    const orderCode = searchParams.get("orderCode");
    if (paid !== "1") return;

    const finish = async () => {
      try {
        if (orderCode) {
          try {
            await apiFetch(`/billing/payos/confirm/${orderCode}`, { method: "POST" });
          } catch (e) {
            console.warn("PayOS confirm API error (payment might be processed via webhook):", e);
          }
        }
        await syncSessionToApp();
      } catch (err) {
        console.error("Failed to confirm payment and sync session:", err);
      } finally {
        router.replace("/dashboard");
      }
    };
    finish();
  }, [searchParams, router]);

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
        const filtered = data.filter((item: Template) => TEMPLATE_IDS.includes(item.id));
        const list = filtered?.length ? filtered : FALLBACK_TEMPLATES;
        setTemplates(list);
        if (!filtered?.length) {
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

  // Polling for CV thumbnail updates when rendering is active
  useEffect(() => {
    if (!accessToken || cvs.length === 0) return;

    const hasProcessing = cvs.some(
      (cv) => (cv.thumbnailStatus === "PENDING" || cv.thumbnailStatus === "PROCESSING") && isRenderableCv(cv)
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchCvs();
    }, 5000);

    return () => clearInterval(interval);
  }, [accessToken, cvs, fetchCvs]);

  // Log in check
  if (!mounted || !accessToken) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Safe translations lookup
  const activeLang = mounted ? language : "vi";
  const t = translations[activeLang];

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
      setErrorMsg(err instanceof Error ? err.message : t.dashboard.errInit);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    const meta = getTemplateDisplayMeta(templateId);
    if (meta.tag === "Premium" && user?.role === "FREE") {
      alert(t.dashboard.quickCreateAlert);
      setActiveTab("upgrade");
      return;
    }
    setSelectedTemplateId(templateId);
    setValue("templateId", templateId);
    setIsWorkflowModalOpen(true);
  };

  const handleQuickCreateFromTemplate = async (templateId: string, templateName: string) => {
    const meta = getTemplateDisplayMeta(templateId);
    if (meta.tag === "Premium" && user?.role === "FREE") {
      alert(t.dashboard.quickCreateAlertName.replace("{name}", templateName));
      setActiveTab("upgrade");
      return;
    }
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
          locale: activeLang,
          templateId,
        }),
      });
      const cv = res?.data || res;
      setCvs((prev) => [cv, ...prev]);
      setIsWorkflowModalOpen(false);
      router.push(`/cv/${cv.id}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t.dashboard.errInit);
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
      onProgress(activeLang === "vi" ? "Đang tải tệp lên máy chủ AI..." : "Uploading file to AI server...");
      
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await apiFetch<any>("/ai/upload-cv", {
        method: "POST",
        body: formData,
      });
      const job = uploadRes?.data || uploadRes;

      let currentJob = job;
      let status: string = (currentJob.status || "").toUpperCase();

      onProgress(activeLang === "vi" ? "Đang đưa CV vào hàng đợi xử lý AI..." : "Queuing resume for AI processing...");

      // Poll until job is COMPLETED or FAILED (max 3 minutes = 90 attempts × 2s)
      const MAX_ATTEMPTS = 90;
      let attempts = 0;

      while (
        status === "UPLOADED" ||
        status === "QUEUED" ||
        status === "PROCESSING" ||
        status === "REVIEWING"
      ) {
        if (attempts >= MAX_ATTEMPTS) {
          throw new Error(
            activeLang === "vi"
              ? "Quá trình xử lý mất quá nhiều thời gian. Vui lòng thử lại."
              : "Processing timed out. Please try again."
          );
        }
        await new Promise((r) => setTimeout(r, 2000));
        const statusRes = await apiFetch<any>(`/ai/ocr/status/${job.id}`);
        currentJob = statusRes?.data || statusRes;
        status = (currentJob.status || "").toUpperCase();
        attempts++;

        if (status === "PROCESSING" || status === "REVIEWING") {
          onProgress(activeLang === "vi" ? "AI đang tiến hành quét OCR và phân tích cấu trúc CV..." : "AI is performing OCR and structural resume analysis...");
        } else if (status === "QUEUED") {
          onProgress(activeLang === "vi" ? "CV đang chờ trong hàng đợi xử lý..." : "Resume is waiting in the processing queue...");
        }
      }

      if (status === "COMPLETED" && currentJob.extractedCvId) {
        onProgress(activeLang === "vi" ? "Trích xuất hoàn tất! Đang áp dụng thiết kế giao diện..." : "Extraction complete! Applying design template...");
        
        // Save the chosen templateId onto the extracted CV
        if (templateId) {
          await apiFetch(`/cvs/${currentJob.extractedCvId}`, {
            method: "PUT",
            body: JSON.stringify({
              title: `Imported - ${file.name.replace(/\.[^/.]+$/, "")}`,
              locale: activeLang,
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
        throw new Error(currentJob.error || t.dashboard.errParse);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : t.dashboard.errParse);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplateName = templates.find((t) => t.id === selectedTemplateId)?.name;

  const tabMeta: Record<DashboardTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: t.dashboard.overviewTitle,
      subtitle: t.dashboard.welcomeMsg.replace("{name}", user?.fullName?.split(" ")[0] || (activeLang === "vi" ? "bạn" : "there")),
    },
    resumes: {
      title: t.dashboard.tabMyCvs,
      subtitle: t.dashboard.myCvsSub,
    },
    templates: {
      title: t.dashboard.tabTemplates,
      subtitle: t.dashboard.templatesSub,
    },
    upgrade: {
      title: t.dashboard.tabUpgrade,
      subtitle: t.dashboard.upgradeSub,
    },
    settings: {
      title: t.dashboard.tabSettings,
      subtitle: t.dashboard.settingsSub,
    },
    profile: {
      title: t.profile.title,
      subtitle: t.profile.subtitle,
    },
  };

  // Handle Delete CV
  const onDelete = async (cvId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(t.dashboard.deleteConfirm)) {
      return;
    }
    try {
      await apiFetch(`/cvs/${cvId}`, {
        method: "DELETE"
      });
      setCvs((prev) => prev.filter((cv) => cv.id !== cvId));
    } catch (err) {
      alert(t.dashboard.deleteFailed + (err instanceof Error ? err.message : "Unknown error"));
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
        title: `${sourceCv.title} (${activeLang === "vi" ? "Bản sao" : "Copy"})`,
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
      alert(t.dashboard.duplicateFailed + (err instanceof Error ? err.message : "Unknown error"));
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
      alert(t.dashboard.profileSuccess);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t.dashboard.profileFailed);
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

  // Format date nicely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return activeLang === "vi" ? "Vừa xong" : "Just now";
    const date = new Date(dateStr);
    return date.toLocaleDateString(activeLang === "vi" ? "vi-VN" : "en-US", {
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
        userAvatar={user?.avatarUrl}
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
            {t.dashboard.createBtn}
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
            formatDate={formatDate}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            templates={templates}
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
        onClose={() => { setIsWorkflowModalOpen(false); setLoading(false); }}
        onStartFromScratch={handleStartFromScratch}
        onUploadAndParse={handleUploadAndParse}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
