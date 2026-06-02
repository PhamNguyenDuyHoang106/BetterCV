import React, { useState } from "react";
import { ProfileForm } from "../../../hooks/cv/useCvEditor";
import { apiFetch } from "../../../lib/api";

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
        alert("Upload thất bại. Không nhận được URL ảnh từ server.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
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
          Thông tin liên hệ cơ bản
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">Họ và tên *</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => handleProfileChange("fullName", e.target.value)}
              placeholder="Nguyễn Văn A"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Chức danh</label>
            <input
              type="text"
              value={profileForm.title}
              onChange={(e) => handleProfileChange("title", e.target.value)}
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
              onChange={(e) => handleProfileChange("email", e.target.value)}
              placeholder="name@domain.com"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Số điện thoại</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => handleProfileChange("phone", e.target.value)}
              placeholder="+84 987 654 321"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">Địa chỉ</label>
            <input
              type="text"
              value={profileForm.address || ""}
              onChange={(e) => handleProfileChange("address", e.target.value)}
              placeholder="Số 12, Ngõ 34, Đường Láng"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">Thành phố / Tỉnh</label>
            <input
              type="text"
              value={profileForm.city || ""}
              onChange={(e) => handleProfileChange("city", e.target.value)}
              placeholder="Hà Nội"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Mạng xã hội & Portfolio
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400">LinkedIn URL</label>
            <input
              type="text"
              value={profileForm.linkedin}
              onChange={(e) => handleProfileChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400">GitHub URL</label>
            <input
              type="text"
              value={profileForm.github}
              onChange={(e) => handleProfileChange("github", e.target.value)}
              placeholder="https://github.com/username"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-400">Website khác</label>
            <input
              type="text"
              value={profileForm.website}
              onChange={(e) => handleProfileChange("website", e.target.value)}
              placeholder="https://myportfolio.dev"
              className="mt-1.5 w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="col-span-2 mt-2">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Ảnh đại diện (Avatar)
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
                    Đang tải ảnh lên Supabase Cloud...
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
                      Đã có ảnh đại diện
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
                        Thay ảnh mới
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
                        Xóa ảnh
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
                      Kéo thả ảnh hoặc click để chọn
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Hỗ trợ PNG, JPG, GIF (Tải trực tiếp lên Supabase Storage)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
