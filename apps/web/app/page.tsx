export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold">AI CV Builder</h1>
        <p className="mt-3 text-slate-600">
          Build, optimize, and export ATS-friendly CVs with AI assistance.
        </p>
      </header>
      <section className="mb-10 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Template Library",
            description: "Tech, Business, and Design templates with clean layouts."
          },
          {
            title: "AI Optimization",
            description: "Rewrite sections and score against job descriptions."
          },
          {
            title: "Export & Share",
            description: "Download PDF/DOCX and share read-only links."
          }
        ].map((card) => (
          <div key={card.title} className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </div>
        ))}
      </section>
      <div className="flex flex-wrap gap-4">
        <a
          href="/register"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Get started
        </a>
        <a href="/dashboard" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
          Go to dashboard
        </a>
      </div>
    </main>
  );
}
