import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { useLanguageStore } from "../../lib/store/language";

type TargetType = {
  type: "summary" | "experience";
  id?: string;
};

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
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTarget, setAiTarget] = useState<TargetType>({ type: "summary" });
  const [aiStyle, setAiStyle] = useState<"professional" | "concise" | "ats">("professional");
  const [aiStreamingOutput, setAiStreamingOutput] = useState<string>("");
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);

  const openAiModal = (type: "summary" | "experience", id?: string) => {
    setAiTarget({ type, id });
    setAiStreamingOutput("");
    setShowAiModal(true);
  };

  const triggerAiRewrite = async () => {
    setIsAiGenerating(true);
    setAiStreamingOutput("");

    let originalText = "";
    let company = "";
    let position = "";
    if (aiTarget.type === "summary") {
      originalText = summaryText;
    } else {
      const exp = experiences.find((e) => e.id === aiTarget.id);
      originalText = exp ? exp.description : "";
      company = exp ? exp.company : "";
      position = exp ? exp.position : "";
    }

    const payload = {
      locale: cv?.locale || "vi",
      sectionType: aiTarget.type === "summary" ? "SUMMARY" : "EXPERIENCE",
      content:
        aiTarget.type === "summary"
          ? { text: originalText }
          : { description: originalText, company, position },
      style: aiStyle,
      resumeContext: aiTarget.type === "summary" ? {
        jobTitle: profileForm.title || "",
        fullName: profileForm.fullName || "",
        experiences: experiences,
        skills: skills,
        educations: educations,
        projects: projects,
      } : undefined,
    };

    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000/api";

    try {
      // 1. Gửi SSE Stream
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
                  setAiStreamingOutput(accumulated);
                }
              } catch (e: any) {
                if (e.message?.startsWith("STREAM_ERROR:")) {
                  throw new Error(e.message.replace("STREAM_ERROR: ", ""));
                }
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
        const outputText =
          typeof result === "string"
            ? result
            : result.text || result.description || result.raw || JSON.stringify(result);
        setAiStreamingOutput(outputText);
      } catch (postErr) {
        const lang = useLanguageStore.getState().language;
        alert(
          lang === "vi"
            ? "Trợ lý AI đang bận hoặc tài khoản của bạn đã hết lượt dùng AI. Vui lòng thử lại sau."
            : "AI Assistant is busy or your account has run out of AI credits. Please try again later."
        );
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

  return {
    showAiModal,
    setShowAiModal,
    aiTarget,
    aiStyle,
    setAiStyle,
    aiStreamingOutput,
    isAiGenerating,
    openAiModal,
    triggerAiRewrite,
    acceptAiSuggestion,
  };
}
