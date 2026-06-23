import React, { useState } from "react";
import { ProfileForm } from "../../../hooks/cv/useCvEditor";
import { apiFetch } from "../../../lib/api";
import { useTranslation } from "../../../hooks/useTranslation";

type ProfilePanelProps = {
  profileForm: ProfileForm;
  handleProfileChange: (field: string, val: any) => void;
  handleThemeChange: (field: "primaryColor" | "accentColor", val: string) => void;
  setProfileForm: (val: ProfileForm) => void;
  saveProfile: (val?: ProfileForm) => void;
};

export function ProfilePanel({
  profileForm,
  handleProfileChange,
  handleThemeChange,
  setProfileForm,
  saveProfile,
}: ProfilePanelProps) {
  const { t, language } = useTranslation();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState<boolean>(false);

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch<any>("/exports/avatar", {
        method: "POST",
        body: formData,
      });
      const url = res?.data?.url || res?.url;
      if (url) {
        const newForm = { ...profileForm, avatarUrl: url };
        setProfileForm(newForm);
        saveProfile(newForm);
      } else {
        alert(t.editor.profile.uploadFailed);
      }
    } catch (err) {
      console.error(err);
      alert(t.editor.profile.uploadError);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAvatarUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          {t.editor.profile.title}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.fullName}</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => handleProfileChange("fullName", e.target.value)}
              placeholder={t.editor.profile.fullNamePlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.jobTitle}</label>
            <input
              type="text"
              value={profileForm.title}
              onChange={(e) => handleProfileChange("title", e.target.value)}
              placeholder={t.editor.profile.jobTitlePlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.email}</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => handleProfileChange("email", e.target.value)}
              placeholder={t.editor.profile.emailPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.phone}</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => handleProfileChange("phone", e.target.value)}
              placeholder={t.editor.profile.phonePlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.address}</label>
            <input
              type="text"
              value={profileForm.address || ""}
              onChange={(e) => handleProfileChange("address", e.target.value)}
              placeholder={t.editor.profile.addressPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">{t.editor.profile.city}</label>
            <input
              type="text"
              value={profileForm.city || ""}
              onChange={(e) => handleProfileChange("city", e.target.value)}
              placeholder={t.editor.profile.cityPlaceholder}
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
            {t.editor.profile.socialsTitle}
          </h3>
          <button
            type="button"
            onClick={() => {
              const newSocial = { id: `social_${Date.now()}`, type: "linkedin", label: "", url: "" };
              const updated = { ...profileForm, socials: [...(profileForm.socials || []), newSocial] };
              setProfileForm(updated);
              saveProfile(updated);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {language === "vi" ? "Thêm liên kết" : "Add Link"}
          </button>
        </div>

        <div className="space-y-3">
          {(profileForm.socials || []).map((social, idx) => {
            const SOCIAL_OPTIONS = [
              { value: "linkedin",   label: "LinkedIn",     placeholder: "https://linkedin.com/in/username" },
              { value: "github",     label: "GitHub",       placeholder: "https://github.com/username" },
              { value: "facebook",   label: "Facebook",     placeholder: "https://facebook.com/username" },
              { value: "twitter",    label: "Twitter / X",  placeholder: "https://twitter.com/username" },
              { value: "instagram",  label: "Instagram",    placeholder: "https://instagram.com/username" },
              { value: "youtube",    label: "YouTube",      placeholder: "https://youtube.com/@channel" },
              { value: "behance",    label: "Behance",      placeholder: "https://behance.net/username" },
              { value: "dribbble",   label: "Dribbble",     placeholder: "https://dribbble.com/username" },
              { value: "website",    label: "Website",      placeholder: "https://mywebsite.com" },
              { value: "custom",     label: language === "vi" ? "Tùy chỉnh…" : "Custom…", placeholder: "https://..." },
            ];
            const option = SOCIAL_OPTIONS.find(o => o.value === social.type) || SOCIAL_OPTIONS[SOCIAL_OPTIONS.length - 1];

            const updateSocial = (field: string, val: string) => {
              const updated = {
                ...profileForm,
                socials: profileForm.socials.map((s, i) => i === idx ? { ...s, [field]: val } : s),
              };
              setProfileForm(updated);
              saveProfile(updated);
            };
            const removeSocial = () => {
              const updated = {
                ...profileForm,
                socials: profileForm.socials.filter((_, i) => i !== idx),
              };
              setProfileForm(updated);
              saveProfile(updated);
            };

            return (
              <div key={social.id} className="flex flex-col gap-2 rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                <div className="flex items-center gap-2">
                  {/* Platform dropdown */}
                  <select
                    value={social.type}
                    onChange={(e) => updateSocial("type", e.target.value)}
                    className="flex-none rounded-lg bg-slate-800 border border-slate-700 px-2 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                    style={{ minWidth: "120px" }}
                  >
                    {SOCIAL_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>

                  {/* Custom label input (only for "custom" type) */}
                  {social.type === "custom" && (
                    <input
                      type="text"
                      value={social.label || ""}
                      onChange={(e) => updateSocial("label", e.target.value)}
                      placeholder={language === "vi" ? "Tên website..." : "Website name..."}
                      className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={removeSocial}
                    className="ml-auto flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-900/60 transition-all"
                    title={language === "vi" ? "Xóa liên kết" : "Remove link"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* URL input */}
                <input
                  type="url"
                  value={social.url || ""}
                  onChange={(e) => updateSocial("url", e.target.value)}
                  placeholder={option.placeholder}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              {t.editor.profile.avatarLabel}
            </label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                  : "border-slate-800 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/60"
              }`}
              onClick={() => {
                const input = document.getElementById("avatar-upload-input");
                input?.click();
              }}
            >
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleAvatarUpload(e.target.files[0]);
                  }
                }}
              />

              {isUploadingAvatar ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                  <span className="text-xs font-medium text-indigo-400">
                    {t.editor.profile.avatarUploading}
                  </span>
                </div>
              ) : profileForm.avatarUrl ? (
                <div className="flex items-center gap-5 w-full">
                  <img
                    src={profileForm.avatarUrl}
                    alt="Avatar Preview"
                    className="h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-md shadow-indigo-500/15"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {t.editor.profile.avatarUploaded}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {profileForm.avatarUrl}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.getElementById("avatar-upload-input");
                          input?.click();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700/60 transition-colors"
                      >
                        {t.editor.profile.avatarChangeBtn}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newForm = { ...profileForm, avatarUrl: "" };
                          setProfileForm(newForm);
                          saveProfile(newForm);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/80 text-xs font-semibold text-rose-400 border border-rose-900/60 transition-colors"
                      >
                        {t.editor.profile.avatarDeleteBtn}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50 transition-transform">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      {isDragActive ? t.editor.profile.avatarDragActive : t.editor.profile.avatarDragInactive}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {t.editor.profile.avatarFormats}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
