import { useState, useCallback, useRef, useEffect } from "react";
import { apiFetch } from "../../lib/api";
import { useLanguageStore } from "../../lib/store/language";

type UseAiRewriteProps = {
  cv: any;
  accessToken: string | null;
  profileForm: any;
  experiences: any[];
  skills: any[];
  educations: any[];
  projects: any[];
  summaryText: string;
  setSummaryText: (val: string) => void;
  saveSummary: (val: string) => void;
  setExperiences: (val: any[]) => void;
  saveExperiences: (val: any[]) => void;
};

type InlineAiState = {
  open: boolean;
  isGenerating: boolean;
  output: string;
};

/** Context riêng của experience khi gọi AI */
type ExperienceContext = {
  company: string;
  position: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
};

export function useAiRewrite({
  cv,
  accessToken,
  profileForm,
  experiences,
  skills,
  educations,
  projects,
  summaryText,
  setSummaryText,
  saveSummary,
  setExperiences,
  saveExperiences,
}: UseAiRewriteProps) {
  // State per section: key = "summary" | experience.id
  const [inlineStates, setInlineStates] = useState<Record<string, InlineAiState>>({});

  // Ref to hold active AbortControllers to cancel requests and free browser connection pool
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  // Abort all active requests when unmounting
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach((controller) => {
        controller.abort();
      });
    };
  }, []);

  const getInlineState = useCallback(
    (key: string): InlineAiState =>
      inlineStates[key] ?? { open: false, isGenerating: false, output: "" },
    [inlineStates]
  );

  const setInlineField = (key: string, partial: Partial<InlineAiState>) => {
    setInlineStates((prev) => {
      const current = prev[key] ?? { open: false, isGenerating: false, output: "" };
      return { ...prev, [key]: { ...current, ...partial } };
    });
  };

  /** Toggle mở/đóng panel. Khi mở tự trigger generate luôn */
  const openInlineAi = useCallback(
    (key: string) => {
      setInlineStates((prev) => {
        const current = prev[key] ?? { open: false, isGenerating: false, output: "" };
        if (current.open) {
          // Abort active request if closing
          if (abortControllersRef.current[key]) {
            abortControllersRef.current[key].abort();
            delete abortControllersRef.current[key];
          }
          // Đang mở → đóng và reset
          return { ...prev, [key]: { open: false, isGenerating: false, output: "" } };
        }
        return { ...prev, [key]: { ...current, open: true } };
      });
    },
    []
  );

  const closeInlineAi = useCallback((key: string) => {
    if (abortControllersRef.current[key]) {
      abortControllersRef.current[key].abort();
      delete abortControllersRef.current[key];
    }
    setInlineField(key, { open: false, output: "", isGenerating: false });
  }, []);

  /**
   * Gọi AI generate.
   * - key = "summary" | experience.id
   * - expCtx = thông tin experience (company, position, ...) nếu là experience
   * - currentDescription = nội dung hiện tại trong textarea
   *
   * Logic:
   *   - Nếu currentDescription trống → AI sinh từ đầu dựa trên context
   *   - Nếu có nội dung → AI rewrite kết hợp context + nội dung người dùng nhập
   */
  const generateInlineAi = useCallback(
    async (key: string, currentDescription: string, expCtx?: ExperienceContext) => {
      const isSummary = key === "summary";
      const locale = cv?.locale || "vi";
      const hasUserInput = currentDescription.trim().length > 0;

      // ────── Build payload ──────
      let payload: Record<string, any>;

      if (isSummary) {
        payload = {
          locale,
          sectionType: "SUMMARY",
          style: "professional", // hardcoded – backend DTO vẫn cần field này
          content: { text: currentDescription }, // rỗng = sinh mới, có nội dung = rewrite
          resumeContext: {
            jobTitle: profileForm.title || "",
            fullName: profileForm.fullName || "",
            experiences,
            skills,
            educations,
            projects,
          },
        };
      } else {
        // Experience mode
        const exp = expCtx ?? experiences.find((e) => e.id === key);
        const company = exp?.company || "";
        const position = exp?.position || "";
        const startDate = exp?.startDate || "";
        const endDate = exp?.endDate || "";

        payload = {
          locale,
          sectionType: "EXPERIENCE",
          style: "professional", // hardcoded – backend DTO vẫn cần field này
          content: {
            description: currentDescription,
            // Gửi kèm thông tin experience để backend buildExperienceUserPrompt dùng
            company,
            position,
            startDate,
            endDate,
          },
          resumeContext: {
            company,
            position,
            startDate,
            endDate,
            // Gửi skills để AI biết tech stack của ứng viên
            skills,
            // Tiêu đề nghề nghiệp tổng quát
            jobTitle: profileForm.title || "",
          },
        };
      }

      // Abort any existing stream request for this specific key
      if (abortControllersRef.current[key]) {
        abortControllersRef.current[key].abort();
      }
      const controller = new AbortController();
      abortControllersRef.current[key] = controller;

      setInlineField(key, { isGenerating: true, output: "" });

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

      try {
        // Thử SSE stream trước
        const response = await fetch(`${baseUrl}/ai/rewrite/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("SSE Stream failed, falling back to POST");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No reader");

        let done = false;
        let accumulated = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.error) {
                    throw new Error(`STREAM_ERROR: ${data.error}`);
                  }
                  if (data.text) {
                    accumulated += data.text;
                    setInlineField(key, { output: accumulated });
                  }
                } catch (e: any) {
                  if (e.message?.startsWith("STREAM_ERROR:")) {
                    throw new Error(e.message.replace("STREAM_ERROR: ", ""));
                  }
                  const raw = line.substring(6);
                  if (raw && !raw.includes("done")) {
                    accumulated += raw;
                    setInlineField(key, { output: accumulated });
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // Do not fallback to POST if the request was intentionally aborted
          return;
        }
        // Fallback: standard POST
        try {
          const res = await apiFetch<any>("/ai/rewrite", {
            method: "POST",
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          const result = res?.data || res;
          const text =
            typeof result === "string"
              ? result
              : result.text || result.description || result.raw || JSON.stringify(result);
          setInlineField(key, { output: text });
        } catch (err: any) {
          if (err?.name === "AbortError") {
            return;
          }
          const lang = useLanguageStore.getState().language;
          const msg =
            err?.message ||
            (lang === "vi"
              ? "Trợ lý AI đang bận hoặc tài khoản đã hết lượt dùng AI. Vui lòng thử lại sau."
              : "AI Assistant is busy or your account has run out of AI credits. Please try again later.");
          alert(msg);
        }
      } finally {
        if (abortControllersRef.current[key] === controller) {
          delete abortControllersRef.current[key];
        }
        setInlineField(key, { isGenerating: false });
      }
    },
    [cv, accessToken, profileForm, experiences, skills, educations, projects]
  );

  /** Áp dụng gợi ý AI vào field tương ứng và đóng panel */
  const acceptInlineAi = useCallback(
    (key: string, text: string) => {
      if (key === "summary") {
        setSummaryText(text);
        saveSummary(text);
      } else {
        const updated = experiences.map((exp) =>
          exp.id === key ? { ...exp, description: text } : exp
        );
        setExperiences(updated);
        saveExperiences(updated);
      }
      closeInlineAi(key);
    },
    [experiences, setSummaryText, saveSummary, setExperiences, saveExperiences, closeInlineAi]
  );

  return {
    getInlineState,
    openInlineAi,
    closeInlineAi,
    generateInlineAi,
    acceptInlineAi,
  };
}
