"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { apiFetch } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store/auth";

type Cv = {
  id: string;
  title: string;
  locale: string;
  sections: Array<{ id: string; type: string; content: any; order: number }>;
};

type SectionForm = {
  type: string;
  content: string;
  order: number;
};

export default function CvEditorPage() {
  const params = useParams<{ id: string }>();
  const cvId = params?.id as string;
  const { accessToken, hydrate } = useAuthStore();
  const [cv, setCv] = useState<Cv | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<SectionForm>({
    defaultValues: { type: "SUMMARY", order: 1 }
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!accessToken || !cvId) {
      return;
    }
    apiFetch<Cv>(`/cvs/${cvId}`).then(setCv).catch(() => setCv(null));
  }, [accessToken, cvId]);

  const onAddSection = async (values: SectionForm) => {
    try {
      const content = values.content ? JSON.parse(values.content) : {};
      await apiFetch(`/cvs/${cvId}/sections`, {
        method: "POST",
        body: JSON.stringify({
          type: values.type,
          content,
          order: Number(values.order)
        })
      });
      const updated = await apiFetch<Cv>(`/cvs/${cvId}`);
      setCv(updated);
      reset({ type: values.type, order: values.order, content: "" });
      setError(null);
    } catch {
      setError("Invalid JSON content.");
    }
  };

  const onShare = async () => {
    const result = await apiFetch<{ token: string }>(`/cvs/${cvId}/share`, {
      method: "POST"
    });
    setShareUrl(`${window.location.origin}/share/${result.token}`);
  };

  const onExport = async () => {
    const result = await apiFetch<{ url: string | null }>("/exports/pdf", {
      method: "POST",
      body: JSON.stringify({ cvId })
    });
    setExportUrl(result.url);
  };

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-slate-600">Please log in to edit this CV.</p>
      </main>
    );
  }

  if (!cv) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-slate-600">Loading CV...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{cv.title}</h1>
          <p className="text-sm text-slate-500">Locale: {cv.locale}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            onClick={onShare}
          >
            Create share link
          </button>
          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
            onClick={onExport}
          >
            Export PDF
          </button>
        </div>
      </div>
      {shareUrl && (
        <p className="mt-4 text-sm text-slate-600">Share URL: {shareUrl}</p>
      )}
      {exportUrl && (
        <p className="mt-2 text-sm text-slate-600">
          Export URL: <a className="underline" href={exportUrl}>Download</a>
        </p>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Sections</h2>
          <div className="mt-4 space-y-4">
            {cv.sections.map((section) => (
              <div key={section.id} className="rounded-lg border border-slate-200 p-4">
                <div className="text-sm font-semibold">{section.type}</div>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                  {JSON.stringify(section.content, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Add Section</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onAddSection)}>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("type")}
              >
                {[
                  "PROFILE",
                  "SUMMARY",
                  "EXPERIENCE",
                  "EDUCATION",
                  "SKILLS",
                  "PROJECTS"
                ].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Order</label>
              <input
                type="number"
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("order", { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content (JSON)</label>
              <textarea
                rows={6}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("content")}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Save section
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </section>
    </main>
  );
}
