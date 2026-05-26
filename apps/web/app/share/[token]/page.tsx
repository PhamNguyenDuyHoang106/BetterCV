"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";

type ShareCv = {
  title: string;
  locale: string;
  sections: Array<{ id: string; type: string; content: any }>;
};

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const [cv, setCv] = useState<ShareCv | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    apiFetch<any>(`/share/${token}`)
      .then((res) => setCv(res?.data || res))
      .catch(() => setCv(null));
  }, [token]);

  if (!cv) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-slate-600">Share link is invalid or expired.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">{cv.title}</h1>
      <p className="text-sm text-slate-500">Locale: {cv.locale}</p>
      <div className="mt-6 space-y-4">
        {cv.sections.map((section) => (
          <div key={section.id} className="rounded-lg border border-slate-200 p-4">
            <div className="text-sm font-semibold">{section.type}</div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
              {JSON.stringify(section.content, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
