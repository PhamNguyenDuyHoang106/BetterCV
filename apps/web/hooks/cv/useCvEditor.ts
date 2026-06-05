import { useState, useEffect, useRef, useCallback } from "react";
import { useCvStore } from "../../lib/store/cv";
import { useAuthStore } from "../../lib/store/auth";
import { apiFetch } from "../../lib/api";

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
  theme: {
    primaryColor: string;
    accentColor: string;
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
    theme: {
      primaryColor: "",
      accentColor: "",
    },
  });

  const [summaryText, setSummaryText] = useState("");
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showLevel, setShowLevel] = useState<boolean>(true);

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

  // Sync templates selection once CV is loaded
  useEffect(() => {
    if (cv && templates.length > 0) {
      const matched = templates.find((t) => t.id === cv.templateId);
      if (matched) {
        setSelectedTemplate(matched);
      } else {
        const defaultTpl = templates.find((t) => t.id === "standard-ats") || templates[0];
        if (defaultTpl) {
          setSelectedTemplate(defaultTpl);
          updateCvMetadata({ templateId: defaultTpl.id });
        }
      }
    }

    // Populate local form states from CV sections only ONCE on initial CV load (to decouple typing lag)
    if (cv && cv.sections && cv.id !== loadedCvIdRef.current) {
      loadedCvIdRef.current = cv.id;
      
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
          address: profileSec.content.address || "",
          city: profileSec.content.city || "",
          theme: {
            primaryColor: profileSec.content.theme?.primaryColor || "",
            accentColor: profileSec.content.theme?.accentColor || "",
          },
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
        if (skillSec.content.showLevel !== undefined) {
          setShowLevel(!!skillSec.content.showLevel);
        } else {
          setShowLevel(true);
        }
      } else if (skillSec && skillSec.content && Array.isArray(skillSec.content)) {
        setSkills(skillSec.content);
        setShowLevel(true);
      } else {
        setSkills([]);
        setShowLevel(true);
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
  }, [cv, templates, updateCvMetadata]);

  // Reset refs when loading a new CV to force initialization reload
  useEffect(() => {
    loadedCvIdRef.current = null;
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

  const updateProjectItem = (id: string, field: string, val: any) => {
    const updated = projects.map((pr) => (pr.id === id ? { ...pr, [field]: val } : pr));
    setProjects(updated);
  };

  const removeProjectItem = (id: string) => {
    const updated = projects.filter((pr) => pr.id !== id);
    setProjects(updated);
    saveProjects(updated);
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
      theme: profileForm.theme,
    };
  }, [profileForm, summaryText, experiences, educations, skills, showLevel, projects]);

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
    showLevel,
    setShowLevel,
    saveMetadata,
    saveProfile,
    saveSummary,
    saveExperiences,
    saveEducations,
    saveSkills,
    saveProjects,
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
    assembleLocalResumeData,
  };
}
