"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";

type Props = {
  open: boolean;
  loading: boolean;
  selectedTemplateId: string;
  selectedTemplateName?: string;
  onClose: () => void;
  /** Creates CV with blank details */
  onStartFromScratch: (templateId: string) => Promise<void>;
  /** Simulates or triggers API file upload for parsing */
  onUploadAndParse: (templateId: string, file: File, onProgress: (msg: string) => void) => Promise<void>;
};

export function InitializeCvWorkflowModal({
  open,
  loading,
  selectedTemplateId,
  selectedTemplateName,
  onClose,
  onStartFromScratch,
  onUploadAndParse,
}: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customProgressMsg, setCustomProgressMsg] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const PARSE_STEPS = t.initializeCvModal.parseSteps;
  const progressMsg = customProgressMsg || PARSE_STEPS[stepIndex] || "";

  // Rotate parsing steps messages during AI analysis
  useEffect(() => {
    if (!isUploading) return;
    
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next < PARSE_STEPS.length) {
          return next;
        }
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isUploading, PARSE_STEPS.length]);

  if (!open) return null;

  const handleCardUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extensions (.pdf, .docx, .doc)
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx", "doc"].includes(ext)) {
      setUploadError(t.initializeCvModal.errFileType);
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadError(null);
    setStepIndex(0);
    setCustomProgressMsg(null);

    try {
      await onUploadAndParse(selectedTemplateId, file, (msg) => {
        setCustomProgressMsg(msg);
      });
      // Reset uploading state on success (navigation may have a brief delay)
      setIsUploading(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.initializeCvModal.errParseGeneric);
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleScratchClick = async () => {
    try {
      await onStartFromScratch(selectedTemplateId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t.initializeCvModal.errScratchGeneric);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[gallery-fade-in_0.2s_ease-out]">
      {/* Backdrop blur overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={!isUploading && !loading ? onClose : undefined}
        aria-hidden
      />

      <div className="relative w-full max-w-xl rounded-[28px] glass-overlay p-8 shadow-2xl border border-white/50 bg-white/95 overflow-hidden z-10">
        {/* Soft decorative blur glow inside modal */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-sky-500 text-3xl font-light">auto_stories</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
                {t.initializeCvModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.initializeCvModal.subtitle}
              </p>
            </div>
          </div>
          {!isUploading && !loading && (
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={onClose}
              title={t.initializeCvModal.closeTooltip}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Selected Template Indicator */}
        {selectedTemplateName && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl bg-sky-50/80 border border-sky-100 px-4 py-3 text-xs text-sky-700 font-bold shadow-sm">
            <span className="material-symbols-outlined text-base">palette</span>
            {t.initializeCvModal.selectedTemplate.replace("{name}", selectedTemplateName)}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Render uploading/parsing screen */}
        {isUploading || loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            {/* Spinning/pulsing AI circle */}
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                <span className="material-symbols-outlined text-3xl">psychology</span>
              </div>
            </div>

            <h4 className="text-md font-bold text-slate-900 mb-2">
              {selectedFile 
                ? t.initializeCvModal.parsingTitle.replace("{name}", selectedFile.name) 
                : t.initializeCvModal.settingUpTitle}
            </h4>
            
            {/* Realtime revolving action log */}
            <p className="text-xs text-slate-500 font-semibold px-4 py-2 bg-slate-50 rounded-full ring-1 ring-slate-100 animate-pulse">
              {progressMsg}
            </p>

            <div className="w-full max-w-xs bg-slate-100 h-1.5 rounded-full overflow-hidden mt-6">
              <div 
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(((stepIndex + 1) / PARSE_STEPS.length) * 100, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
            {/* Card 1: Import resume */}
            <button
              type="button"
              onClick={handleCardUploadClick}
              className="group text-left p-5 bg-white border border-slate-200/80 hover:border-sky-400 rounded-3xl shadow-sm hover:shadow-md hover:shadow-sky-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white shadow-md mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-light">cloud_upload</span>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  {t.initializeCvModal.cardUploadTitle}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-2.5">
                  {t.initializeCvModal.cardUploadDesc}
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-extrabold text-sky-500 uppercase tracking-wider gap-1">
                {t.initializeCvModal.cardUploadBadge}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>

            {/* Card 2: Start from scratch */}
            <button
              type="button"
              onClick={handleScratchClick}
              className="group text-left p-5 bg-white border border-slate-200/80 hover:border-violet-400 rounded-3xl shadow-sm hover:shadow-md hover:shadow-violet-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white shadow-md mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-light">edit_note</span>
                </div>
                <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                  {t.initializeCvModal.cardScratchTitle}
                </h4>
                <p className="text-[11px] font-medium text-slate-400 leading-relaxed mt-2.5">
                  {t.initializeCvModal.cardScratchDesc}
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-extrabold text-violet-500 uppercase tracking-wider gap-1">
                {t.initializeCvModal.cardScratchBadge}
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>
          </div>
        )}

        {/* Error notification block */}
        {uploadError && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-700 shadow-sm animate-pulse">
            <span className="material-symbols-outlined text-md shrink-0">error</span>
            <p className="flex-1 font-semibold">{uploadError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
