import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../lib/api";

type SkillsPanelProps = {
  skills: any[];
  setSkills: (items: any[]) => void;
  showLevel: boolean;
  handleShowLevelChange: (val: boolean) => void;
  addSkillItem: () => void;
  updateSkillItem: (id: string, field: string, val: any) => void;
  removeSkillItem: (id: string) => void;
  saveSkills: (items?: any[], showLvl?: boolean) => void;
  profileTitle: string;
  cvLocale: string;
};

export function SkillsPanel({
  skills,
  setSkills,
  showLevel,
  handleShowLevelChange,
  addSkillItem,
  updateSkillItem,
  removeSkillItem,
  saveSkills,
  profileTitle,
  cvLocale,
}: SkillsPanelProps) {
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState<boolean>(false);
  const [suggestCount, setSuggestCount] = useState<number>(0);
  const lastFetchedJobTitleRef = useRef<string>("");

  const fetchSkillSuggestions = async () => {
    const jobTitle = profileTitle || "";
    if (!jobTitle.trim()) return;
    lastFetchedJobTitleRef.current = jobTitle.trim();
    setIsSuggestingSkills(true);
    try {
      const res = await apiFetch<any>("/ai/skills/suggest", {
        method: "POST",
        body: JSON.stringify({
          jobTitle,
          locale: cvLocale || "vi",
          currentSkills: skills.map((s: any) => s.name).filter(Boolean),
        }),
      });
      const data = Array.isArray(res) ? res : res?.data || [];
      setSuggestedSkills(data);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  const handleRegenerateSkills = async () => {
    const jobTitle = profileTitle || "";
    if (!jobTitle.trim()) {
      alert("Vui lòng nhập Chức danh tại trang Thông tin cá nhân trước.");
      return;
    }
    setSuggestCount((prev) => {
      const next = prev + 1;
      return next > 5 ? 1 : next;
    });
    await fetchSkillSuggestions();
  };

  useEffect(() => {
    if (profileTitle) {
      const trimmedTitle = profileTitle.trim();
      if (trimmedTitle !== lastFetchedJobTitleRef.current) {
        lastFetchedJobTitleRef.current = trimmedTitle;
        fetchSkillSuggestions().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileTitle]);

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "Beginner":
        return "Beginner";
      case "Intermediate":
        return "Intermediate";
      case "Advanced":
        return "Advanced";
      case "Professional":
        return "Professional";
      case "Expert":
        return "Expert";
      default:
        return "Advanced";
    }
  };

  return (
    <div className="space-y-6">
      {/* Show Experience Level Toggle */}
      <div className="flex items-center gap-3 py-1">
        <button
          type="button"
          onClick={() => handleShowLevelChange(!showLevel)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            showLevel ? "bg-sky-500" : "bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              showLevel ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm font-medium text-slate-300">Show experience level</span>
      </div>

      <div className="h-[1px] bg-slate-800/80 my-2" />

      {/* AI SUGGESTED SKILLS */}
      <div className="rounded-2xl border border-sky-950/40 bg-slate-900/20 p-5 space-y-4 shadow-lg shadow-sky-950/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sky-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.43 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18.75 1.5a.75.75 0 0 1 .75.75v.003c0 .356-.25.684-.6.741l-.315.053a1.125 1.125 0 0 0-.915.915l-.053.315a.75.75 0 0 1-1.474-.247l.053-.315a1.125 1.125 0 0 0-.915-.915l-.315-.053a.75.75 0 0 1 .166-1.474l.315.053a1.125 1.125 0 0 0 .915.915l.053.315a.75.75 0 0 1 1.474.247l-.053-.315a1.125 1.125 0 0 0 .915-.915l.315-.053a.75.75 0 0 1 .75-.75Zm-2.25 16.5a.75.75 0 0 1 .75.75v.003c0 .356-.25.684-.6.741l-.315.053a1.125 1.125 0 0 0-.915.915l-.053.315a.75.75 0 0 1-1.474-.247l.053-.315a1.125 1.125 0 0 0-.915-.915l-.315-.053a.75.75 0 0 1 .166-1.474l.315.053a1.125 1.125 0 0 0 .915.915l.053.315a.75.75 0 0 1 1.474.247l-.053-.315a1.125 1.125 0 0 0 .915-.915l.315-.053a.75.75 0 0 1 .75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <h4 className="text-sm font-semibold text-slate-200">
              {profileTitle ? (
                <>
                  Suggested skills for{" "}
                  <span className="text-sky-400 font-bold">{profileTitle}</span>
                </>
              ) : (
                "Suggested skills from AI"
              )}
            </h4>
          </div>
          <button
            type="button"
            onClick={handleRegenerateSkills}
            disabled={isSuggestingSkills}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-lg shadow-sky-500/10 transition-all border-none disabled:opacity-40"
          >
            {isSuggestingSkills ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.75a.75.75 0 0 0-.75.75v4.482a.75.75 0 0 0 1.5 0v-2.299l.322.322a7 7 0 0 0 11.758-3.15.75.75 0 0 0-1.268-.615ZM16.25 3.75a.75.75 0 0 0-1.5 0v2.299l-.322-.322A7 7 0 0 0 2.67 10.877a.75.75 0 1 0 1.268.616 5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h4.482a.75.75 0 0 0 .75-.75V3.75Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>Regenerate ({suggestCount}/5)</span>
          </button>
        </div>

        {suggestedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {suggestedSkills.map((skName) => {
              const isAdded = skills.some((s) => s.name.toLowerCase() === skName.toLowerCase());
              return (
                <button
                  key={skName}
                  type="button"
                  onClick={() => {
                    if (isAdded) {
                      const matched = skills.find(
                        (s) => s.name.toLowerCase() === skName.toLowerCase(),
                      );
                      if (matched) {
                        const updated = skills.filter((s) => s.id !== matched.id);
                        setSkills(updated);
                        saveSkills(updated);
                      }
                    } else {
                      const newItem = {
                        id: `skill_${Date.now()}_${Math.random()}`,
                        name: skName,
                        level: "Advanced",
                      };
                      const updated = [...skills, newItem];
                      setSkills(updated);
                      saveSkills(updated);
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isAdded
                      ? "bg-sky-500/25 border-sky-400 text-sky-300 font-extrabold shadow shadow-sky-500/15 scale-[1.02] ring-1 ring-sky-400/20"
                      : "bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {skName}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            {profileTitle
              ? "Đang chuẩn bị danh sách kỹ năng gợi ý..."
              : "Vui lòng nhập Chức danh tại Thông tin cá nhân để AI phân tích và đề xuất kỹ năng phù hợp."}
          </p>
        )}
      </div>

      {/* MANUAL SKILLS LIST */}
      <div className="flex items-center justify-between mt-6">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Danh sách kỹ năng tự chọn
        </h3>
        <button
          type="button"
          onClick={addSkillItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/10 transition-all border-none"
        >
          + Thêm kỹ năng
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {skills.map((sk) => (
          <div
            key={sk.id}
            className="rounded-xl border border-slate-850 bg-slate-900/25 p-4 space-y-3 relative group"
          >
            <button
              type="button"
              onClick={() => removeSkillItem(sk.id)}
              className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/60 hover:bg-rose-950 text-slate-400 hover:text-rose-450 border border-slate-750/50 hover:border-rose-900/60 transition-all opacity-0 group-hover:opacity-100"
              title="Xóa kỹ năng"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div>
              <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Tên kỹ năng
              </label>
              <input
                type="text"
                value={sk.name}
                onChange={(e) => updateSkillItem(sk.id, "name", e.target.value)}
                onBlur={() => saveSkills(skills)}
                placeholder="Ví dụ: React"
                className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {showLevel && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                  <span>Trình độ:</span>
                  <span className="text-sky-400 font-bold">{getLevelLabel(sk.level)}</span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={
                      sk.level === "Beginner"
                        ? 1
                        : sk.level === "Intermediate"
                          ? 2
                          : sk.level === "Advanced"
                            ? 3
                            : sk.level === "Professional"
                              ? 4
                              : sk.level === "Expert"
                                ? 5
                                : 3
                    }
                    onChange={(e) => {
                      const levelMap: Record<number, string> = {
                        1: "Beginner",
                        2: "Intermediate",
                        3: "Advanced",
                        4: "Professional",
                        5: "Expert",
                      };
                      const val = parseInt(e.target.value);
                      const targetLevel = levelMap[val] || "Advanced";
                      updateSkillItem(sk.id, "level", targetLevel);
                      saveSkills(
                        skills.map((s) => (s.id === sk.id ? { ...s, level: targetLevel } : s)),
                      );
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[8px] text-slate-600 px-1 mt-0.5 font-semibold">
                    <span>Beg</span>
                    <span>Int</span>
                    <span>Adv</span>
                    <span>Pro</span>
                    <span>Exp</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
