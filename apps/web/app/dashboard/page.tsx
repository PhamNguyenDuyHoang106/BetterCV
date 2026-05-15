"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store/auth";

type Template = {
  id: string;
  name: string;
  category?: { name: string };
};

type Cv = {
  id: string;
  title: string;
  locale: string;
};

type CreateForm = {
  title: string;
  locale: "en" | "vi";
  templateId?: string;
};

export default function DashboardPage() {
  const { accessToken, hydrate } = useAuthStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cvs, setCvs] = useState<Cv[]>([]);
  const { register, handleSubmit, reset } = useForm<CreateForm>({
    defaultValues: { locale: "en" }
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    apiFetch<Template[]>("/templates")
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    apiFetch<Cv[]>("/cvs")
      .then(setCvs)
      .catch(() => setCvs([]));
  }, [accessToken]);

  const onCreate = async (values: CreateForm) => {
    const cv = await apiFetch<Cv>("/cvs", {
      method: "POST",
      body: JSON.stringify(values)
    });
    setCvs((prev) => [cv, ...prev]);
    reset({ title: "", locale: values.locale, templateId: values.templateId });
  };

  if (!accessToken) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-slate-600">Please log in to manage your CVs.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Go to login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Your CVs</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Recent CVs</h2>
          <div className="mt-4 space-y-3">
            {cvs.length === 0 && (
              <p className="text-sm text-slate-500">No CVs yet.</p>
            )}
            {cvs.map((cv) => (
              <Link
                key={cv.id}
                href={`/cv/${cv.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <div className="font-medium">{cv.title}</div>
                  <div className="text-xs text-slate-500">Locale: {cv.locale}</div>
                </div>
                <span className="text-sm text-slate-500">Edit</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Create CV</h2>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit(onCreate)}>
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("title", { required: true })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Locale</label>
              <select
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("locale")}
              >
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Template</label>
              <select
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
                {...register("templateId")}
              >
                <option value="">Select template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Create
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
