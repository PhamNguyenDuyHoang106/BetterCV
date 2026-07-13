import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_TEMPLATE_ID } from "@acv/shared";
import type { SocialItem } from "@acv/shared";
import { useCvStore } from "../../lib/store/cv";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";
import { resolveCvTemplateRecord } from "../../lib/resolve-cv-template-schema";

export type ProfileForm = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  avatarUrl: string;
  address: string;
  city: string;
  socials: SocialItem[];
  theme: {
    primaryColor: string;
    accentColor: string;
  };
  renderOptions?: {
    hiddenSections?: string[];
    hiddenBlocks?: string[];
    sectionVariants?: Record<string, string>;
  };
};

export function useCvEditor(cvId: string, triggerAutosave: () => void) {
  const { accessToken } = useAuthStore();
  const {
    cv,
    loadCv,
    updateCvMetadata,
    setDraftMetadata,
    setDraftSection,
  } = useCvStore();

  const loadedCvIdRef = useRef<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  // Local Form States to decouple typing lag from Zustand store
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    fullName: "",
    title: "",
    email: "",
    phone: "",
    website: "",
    github: "",
    linkedin: "",
    avatarUrl: "",
    address: "",
    city: "",
    socials: [{ id: "social_default_li", type: "linkedin", label: "", url: "" }],
    theme: {
      primaryColor: "",
      accentColor: "",
    },
    renderOptions: {
      hiddenSections: [],
      hiddenBlocks: [],
      sectionVariants: {},
    },
  });

  const [summaryText, setSummaryText] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [awards, setAwards] = useState<any[]>([]);
  const [showLevel, setShowLevel] = useState<boolean>(true);
  const [showLangLevel, setShowLangLevel] = useState<boolean>(false);

  const [prevCvId, setPrevCvId] = useState<string | null>(null);
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(null);

  // Load CV and Templates
  useEffect(() => {
    if (!accessToken || !cvId) return;

    loadCv(cvId);

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

  // Sync template selection and section values synchronously during the render phase.
  // This prevents blank preview flashes/remounts by ensuring initial srcDoc always compiles with populated states.
  if (cv && (cv.id !== prevCvId || (templates.length > 0 && resolvedTemplateId !== cv.id))) {
    setPrevCvId(cv.id);
    if (templates.length > 0) {
      setResolvedTemplateId(cv.id);
    }

    const record = resolveCvTemplateRecord(cv, templates);
    if (record) {
      setSelectedTemplate(record);
    } else if (templates.length > 0) {
      const defaultTpl = templates.find((t) => t.id === DEFAULT_TEMPLATE_ID) || templates[0];
      if (defaultTpl) {
        setSelectedTemplate(defaultTpl);
      }
    }

    // Only populate sections if the CV itself has changed
    if (cv.id !== prevCvId) {
      const profileSec = cv.sections?.find((s) => s.type === "PROFILE");
      if (profileSec && profileSec.content) {
        // Load or migrate socials: use saved socials array if present, otherwise
        // migrate legacy linkedin/github/website into the new socials format.
        let loadedSocials: SocialItem[] = [];
        const savedSocials = profileSec.content.socials;
        if (Array.isArray(savedSocials) && savedSocials.length > 0) {
          loadedSocials = savedSocials;
        } else {
          // Migration: auto-convert legacy fields to dynamic socials
          const legacy = profileSec.content;
          if (legacy.linkedin) loadedSocials.push({ id: `social_li_${Date.now()}`, type: "linkedin", label: "", url: legacy.linkedin });
          if (legacy.github) loadedSocials.push({ id: `social_gh_${Date.now() + 1}`, type: "github", label: "", url: legacy.github });
          if (legacy.website) loadedSocials.push({ id: `social_ws_${Date.now() + 2}`, type: "website", label: "", url: legacy.website });
        }
        // Always ensure at least one entry so the panel doesn't look empty
        if (loadedSocials.length === 0) {
          loadedSocials = [{ id: "social_default_li", type: "linkedin", label: "", url: "" }];
        }

        setProfileForm({
          fullName: profileSec.content.fullName || "",
          title: profileSec.content.title || "",
          email: profileSec.content.email || "",
          phone: profileSec.content.phone || "",
          website: profileSec.content.website || "",
          github: profileSec.content.github || "",
          linkedin: profileSec.content.linkedin || "",
          avatarUrl: profileSec.content.avatarUrl || "",
          address: profileSec.content.address || "",
          city: profileSec.content.city || "",
          socials: loadedSocials,
          theme: {
            primaryColor: profileSec.content.theme?.primaryColor || "",
            accentColor: profileSec.content.theme?.accentColor || "",
          },
          renderOptions: {
            hiddenSections: Array.isArray(profileSec.content.renderOptions?.hiddenSections)
              ? profileSec.content.renderOptions.hiddenSections
              : [],
            hiddenBlocks: Array.isArray(profileSec.content.renderOptions?.hiddenBlocks)
              ? profileSec.content.renderOptions.hiddenBlocks
              : [],
            sectionVariants: profileSec.content.renderOptions?.sectionVariants
              && typeof profileSec.content.renderOptions.sectionVariants === "object"
              ? profileSec.content.renderOptions.sectionVariants
              : {},
          },
        });
      }

      const summarySec = cv.sections?.find((s) => s.type === "SUMMARY");
      if (summarySec && summarySec.content) {
        setSummaryText(summarySec.content.text || "");
      }

      const expSec = cv.sections?.find((s) => s.type === "EXPERIENCE");
      if (expSec && expSec.content && Array.isArray(expSec.content.items)) {
        setExperiences(expSec.content.items);
      } else if (expSec && expSec.content && Array.isArray(expSec.content)) {
        setExperiences(expSec.content);
      } else {
        setExperiences([]);
      }

      const eduSec = cv.sections?.find((s) => s.type === "EDUCATION");
      if (eduSec && eduSec.content && Array.isArray(eduSec.content.items)) {
        setEducations(eduSec.content.items);
      } else if (eduSec && eduSec.content && Array.isArray(eduSec.content)) {
        setEducations(eduSec.content);
      } else {
        setEducations([]);
      }

      const skillSec = cv.sections?.find((s) => s.type === "SKILLS");
      if (skillSec && skillSec.content && Array.isArray(skillSec.content.items)) {
        setSkills(skillSec.content.items);
        setShowLevel(skillSec.content.showLevel !== undefined ? !!skillSec.content.showLevel : true);
      } else if (skillSec && skillSec.content && Array.isArray(skillSec.content)) {
        setSkills(skillSec.content);
        setShowLevel(true);
      } else {
        setSkills([]);
        setShowLevel(true);
      }

      const projSec = cv.sections?.find((s) => s.type === "PROJECTS");
      if (projSec && projSec.content && Array.isArray(projSec.content.items)) {
        setProjects(projSec.content.items);
      } else if (projSec && projSec.content && Array.isArray(projSec.content)) {
        setProjects(projSec.content);
      } else {
        setProjects([]);
      }

      const langSec = cv.sections?.find((s) => s.type === "LANGUAGES");
      if (langSec && langSec.content && Array.isArray(langSec.content.items)) {
        setLanguages(langSec.content.items);
        setShowLangLevel(langSec.content.showLevel !== undefined ? !!langSec.content.showLevel : false);
      } else if (langSec && langSec.content && Array.isArray(langSec.content)) {
        setLanguages(langSec.content);
        setShowLangLevel(false);
      } else {
        setLanguages([]);
        setShowLangLevel(false);
      }

      const certSec = cv.sections?.find((s) => s.type === "CERTIFICATIONS");
      if (certSec && certSec.content && Array.isArray(certSec.content.items)) {
        setCertifications(certSec.content.items);
      } else if (certSec && certSec.content && Array.isArray(certSec.content)) {
        setCertifications(certSec.content);
      } else {
        setCertifications([]);
      }

      const awardSec = cv.sections?.find((s) => s.type === "AWARDS");
      if (awardSec && awardSec.content && Array.isArray(awardSec.content.items)) {
        setAwards(awardSec.content.items);
      } else if (awardSec && awardSec.content && Array.isArray(awardSec.content)) {
        setAwards(awardSec.content);
      } else {
        setAwards([]);
      }
    }
  }

  // Reset refs when loading a new CV to force initialization reload
  useEffect(() => {
    setPrevCvId(null);
    setResolvedTemplateId(null);
    loadedCvIdRef.current = null;

    // Reset tất cả local form states về rỗng ngay lập tức khi cvId thay đổi.
    // Điều này đảm bảo dữ liệu CV cũ không tự fill vào CV mới
    // trong khoảng thời gian đang fetch CV mới từ API.
    setProfileForm({
      fullName: "",
      title: "",
      email: "",
      phone: "",
      website: "",
      github: "",
      linkedin: "",
      avatarUrl: "",
      address: "",
      city: "",
      socials: [{ id: "social_default_li", type: "linkedin", label: "", url: "" }],
      theme: { primaryColor: "", accentColor: "" },
      renderOptions: {
        hiddenSections: [],
        hiddenBlocks: [],
        sectionVariants: {},
      },
    });
    setSummaryText("");
    setExperiences([]);
    setEducations([]);
    setSkills([]);
    setProjects([]);
    setLanguages([]);
    setShowLangLevel(false);
    setCertifications([]);
    setAwards([]);
    setShowLevel(true);
    setSelectedTemplate(null);
  }, [cvId]);

  // Save Helpers
  const saveMetadata = useCallback((updates: { title?: string; locale?: "en" | "vi"; templateId?: string }) => {
    setDraftMetadata(updates);
    triggerAutosave();
  }, [setDraftMetadata, triggerAutosave]);

  const saveProfile = useCallback((updatedProfile = profileForm) => {
    setDraftSection("PROFILE", updatedProfile, 1);
    triggerAutosave();
  }, [profileForm, setDraftSection, triggerAutosave]);

  const saveSummary = useCallback((text = summaryText) => {
    setDraftSection("SUMMARY", { text }, 2);
    triggerAutosave();
  }, [summaryText, setDraftSection, triggerAutosave]);

  const saveExperiences = useCallback((items = experiences) => {
    setDraftSection("EXPERIENCE", { items }, 3);
    triggerAutosave();
  }, [experiences, setDraftSection, triggerAutosave]);

  const saveEducations = useCallback((items = educations) => {
    setDraftSection("EDUCATION", { items }, 4);
    triggerAutosave();
  }, [educations, setDraftSection, triggerAutosave]);

  const saveSkills = useCallback((items = skills, showLvl = showLevel) => {
    setDraftSection("SKILLS", { items, showLevel: showLvl }, 5);
    triggerAutosave();
  }, [skills, showLevel, setDraftSection, triggerAutosave]);

  const saveProjects = useCallback((items = projects) => {
    setDraftSection("PROJECTS", { items }, 6);
    triggerAutosave();
  }, [projects, setDraftSection, triggerAutosave]);

  const saveLanguages = useCallback((items = languages, showLvl = showLangLevel) => {
    setDraftSection("LANGUAGES", { items, showLevel: showLvl }, 7);
    triggerAutosave();
  }, [languages, showLangLevel, setDraftSection, triggerAutosave]);

  const saveCertifications = useCallback((items = certifications) => {
    setDraftSection("CERTIFICATIONS", { items }, 8);
    triggerAutosave();
  }, [certifications, setDraftSection, triggerAutosave]);

  const saveAwards = useCallback((items = awards) => {
    setDraftSection("AWARDS", { items }, 9);
    triggerAutosave();
  }, [awards, setDraftSection, triggerAutosave]);

  // --- Profile Helpers ---
  const handleProfileChange = (field: keyof ProfileForm | string, val: any) => {
    const updated = { ...profileForm, [field]: val };
    setProfileForm(updated);
    saveProfile(updated);
  };

  const handleThemeChange = (field: "primaryColor" | "accentColor", val: string) => {
    const updated = {
      ...profileForm,
      theme: { ...profileForm.theme, [field]: val },
    };
    setProfileForm(updated);
    saveProfile(updated);
  };

  // --- Experience Helpers ---
  const addExperienceItem = () => {
    const newItem = {
      id: `exp_${Date.now()}`,
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
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

  // --- Education Helpers ---
  const addEducationItem = () => {
    const newItem = {
      id: `edu_${Date.now()}`,
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: "",
      current: false,
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

  // --- Skills Helpers ---
  const addSkillItem = () => {
    const newItem = {
      id: `skill_${Date.now()}`,
      name: "",
      level: "",
    };
    const updated = [newItem, ...skills];
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

  const handleShowLevelChange = (val: boolean) => {
    setShowLevel(val);
    saveSkills(skills, val);
  };

  // --- Projects Helpers ---
  const addProjectItem = () => {
    const newItem = {
      id: `proj_${Date.now()}`,
      name: "",
      description: "",
      role: "",
      url: "",
      technologies: [],
    };
    const updated = [...projects, newItem];
    setProjects(updated);
    saveProjects(updated);
  };

  const updateProjectItem = (id: string, field: string | Record<string, any>, val?: any) => {
    const updated = projects.map((pr) => {
      if (pr.id === id) {
        if (typeof field === "string") {
          return { ...pr, [field]: val };
        } else {
          return { ...pr, ...field };
        }
      }
      return pr;
    });
    setProjects(updated);
  };

  const removeProjectItem = (id: string) => {
    const updated = projects.filter((pr) => pr.id !== id);
    setProjects(updated);
    saveProjects(updated);
  };

  const addLanguageItem = () => {
    const newItem = { id: `lang_${Date.now()}`, name: "", level: showLangLevel ? "Intermediate" : "" };
    const updated = [...languages, newItem];
    setLanguages(updated);
    saveLanguages(updated);
  };

  const handleShowLangLevelChange = (val: boolean) => {
    setShowLangLevel(val);
    saveLanguages(languages, val);
  };

  const updateLanguageItem = (id: string, field: string, val: any) => {
    const updated = languages.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    setLanguages(updated);
  };

  const removeLanguageItem = (id: string) => {
    const updated = languages.filter((item) => item.id !== id);
    setLanguages(updated);
    saveLanguages(updated);
  };

  const addCertificationItem = () => {
    const newItem = { id: `cert_${Date.now()}`, name: "", issuer: "", date: "", url: "" };
    const updated = [...certifications, newItem];
    setCertifications(updated);
    saveCertifications(updated);
  };

  const updateCertificationItem = (id: string, field: string, val: any) => {
    const updated = certifications.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    setCertifications(updated);
  };

  const removeCertificationItem = (id: string) => {
    const updated = certifications.filter((item) => item.id !== id);
    setCertifications(updated);
    saveCertifications(updated);
  };

  const addAwardItem = () => {
    const newItem = { id: `award_${Date.now()}`, title: "", issuer: "", date: "", description: "" };
    const updated = [...awards, newItem];
    setAwards(updated);
    saveAwards(updated);
  };

  const updateAwardItem = (id: string, field: string, val: any) => {
    const updated = awards.map((item) => (item.id === id ? { ...item, [field]: val } : item));
    setAwards(updated);
  };

  const removeAwardItem = (id: string) => {
    const updated = awards.filter((item) => item.id !== id);
    setAwards(updated);
    saveAwards(updated);
  };

  // Assemble Local Resume Data for compilation/postMessage
  const assembleLocalResumeData = useCallback(() => {
    return {
      schemaVersion: 1,
      profile: profileForm,
      summary: { text: summaryText },
      experience: experiences,
      education: educations,
      skills: { items: skills, showLevel: showLevel },
      projects: projects,
      languages: { items: languages, showLevel: showLangLevel },
      certifications: certifications,
      awards: awards,
      theme: profileForm.theme,
    };
  }, [profileForm, summaryText, experiences, educations, skills, showLevel, projects, languages, showLangLevel, certifications, awards]);

  return {
    cv,
    templates,
    selectedTemplate,
    setSelectedTemplate,
    profileForm,
    setProfileForm,
    summaryText,
    setSummaryText,
    experiences,
    setExperiences,
    educations,
    setEducations,
    skills,
    setSkills,
    projects,
    setProjects,
    languages,
    setLanguages,
    certifications,
    setCertifications,
    awards,
    setAwards,
    showLevel,
    setShowLevel,
    showLangLevel,
    setShowLangLevel,
    saveMetadata,
    saveProfile,
    saveSummary,
    saveExperiences,
    saveEducations,
    saveSkills,
    saveProjects,
    saveLanguages,
    saveCertifications,
    saveAwards,
    handleProfileChange,
    handleThemeChange,
    addExperienceItem,
    updateExperienceItem,
    removeExperienceItem,
    addEducationItem,
    updateEducationItem,
    removeEducationItem,
    addSkillItem,
    updateSkillItem,
    removeSkillItem,
    handleShowLevelChange,
    addProjectItem,
    updateProjectItem,
    removeProjectItem,
    addLanguageItem,
    updateLanguageItem,
    removeLanguageItem,
    handleShowLangLevelChange,
    addCertificationItem,
    updateCertificationItem,
    removeCertificationItem,
    addAwardItem,
    updateAwardItem,
    removeAwardItem,
    assembleLocalResumeData,
  };
}
