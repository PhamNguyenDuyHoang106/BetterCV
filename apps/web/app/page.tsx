"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/store/auth";

export default function HomePage() {
  const { accessToken, hydrate } = useAuthStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const faqs = [
    {
      question: "How does the AI Resume Builder work?",
      answer: "Our AI scans your experience and highlights keywords from the target job description. It suggests active voice verbs, rewrites paragraphs, and calculates a dynamic ATS match score."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We prioritize your privacy. All your CVs and credentials are stored securely via Supabase and are only accessible by you."
    },
    {
      question: "Can I download my resume as PDF?",
      answer: "Yes, you can export your resumes as high-quality PDFs that are perfectly formatted and fully readable by Applicant Tracking Systems (ATS)."
    }
  ];

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col bg-radial-gradient relative overflow-x-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-fixed/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary-container/40 rounded-full blur-3xl"></div>
      </div>

      {/* Landing Page Custom Navigation */}
      <nav className="sticky top-0 w-full z-50 bg-glass-bg backdrop-blur-md border-b border-glass-border shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-sm">
              BC
            </div>
            <span className="font-section-title font-bold text-primary text-xl tracking-tight">BetterCV</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-label-md text-sm font-semibold">
            <a className="text-text-secondary hover:text-primary transition-colors px-2 py-1" href="#features">Features</a>
            <a className="text-text-secondary hover:text-primary transition-colors px-2 py-1" href="#how-it-works">How It Works</a>
            <a className="text-text-secondary hover:text-primary transition-colors px-2 py-1" href="#faq">FAQ</a>
          </div>
          
          <div className="flex items-center gap-3">
            {accessToken ? (
              <Link
                href="/dashboard"
                className="font-label-md text-sm font-semibold bg-primary text-on-primary rounded-xl px-6 py-2.5 shadow-sm hover:shadow-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="font-label-md text-sm font-semibold text-primary bg-white/40 border border-glass-border rounded-full px-6 py-2 hover:bg-white/60 transition-all hidden sm:block"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="font-label-md text-sm font-semibold bg-primary text-on-primary rounded-xl px-6 py-2.5 shadow-sm hover:shadow-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6 text-left">
            <div className="inline-flex self-start items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
              ✨ Intelligent CV Optimization
            </div>
            <h1 className="font-hero-title text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              {"Build a Job-Winning Resume with AI"}
            </h1>
            <p className="font-body-lg text-lg text-text-secondary max-w-lg leading-relaxed">
              {"Craft professional, ATS-optimized resumes in minutes. Let our AI tailor your experience to match your dream job perfectly."}
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link
                href={accessToken ? "/dashboard" : "/register"}
                className="font-label-md text-sm font-semibold bg-primary text-on-primary rounded-xl px-8 py-3.5 shadow-md hover:shadow-lg hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-md">description</span>
                Create Resume Now
              </Link>
              <Link
                href={accessToken ? "/dashboard" : "/login"}
                className="font-label-md text-sm font-semibold text-primary bg-white/40 border border-glass-border rounded-full px-8 py-3.5 hover:bg-white/60 transition-all duration-200 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-md">upload_file</span>
                Explore Dashboard
              </Link>
            </div>
          </div>
          
          <div className="relative w-full h-[380px] md:h-[450px] flex justify-center items-center">
            {/* Main Glass Editor Panel */}
            <div className="glass-panel w-full max-w-md h-[340px] md:h-[380px] rounded-2xl p-6 relative z-10 flex flex-col gap-4 border border-white/50 shadow-xl">
              <div className="flex items-center gap-2 border-b border-glass-border pb-3 mb-1">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="text-xs text-text-secondary ml-2 font-mono">resume_draft.pdf</span>
              </div>
              <div className="w-1/3 h-4 bg-tertiary-fixed rounded"></div>
              <div className="w-3/4 h-8 bg-surface-variant rounded"></div>
              <div className="space-y-2 mt-2">
                <div className="w-full h-2 bg-tertiary-fixed rounded"></div>
                <div className="w-full h-2 bg-tertiary-fixed rounded"></div>
                <div className="w-5/6 h-2 bg-tertiary-fixed rounded"></div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="w-full h-2 bg-tertiary-fixed rounded"></div>
                <div className="w-4/5 h-2 bg-tertiary-fixed rounded"></div>
              </div>
            </div>
            
            {/* Floating ATS Badge */}
            <div className="absolute top-6 right-0 lg:-right-4 bg-white/90 backdrop-blur-md rounded-full shadow-lg p-3 flex items-center gap-2.5 z-20 border border-slate-100 animate-bounce" style={{ animationDuration: "4s" }}>
              <div className="bg-primary/20 text-primary font-bold rounded-full w-10 h-10 flex items-center justify-center font-label-md text-sm">
                95
              </div>
              <span className="font-label-sm text-xs font-semibold text-text-secondary pr-2">ATS Score</span>
            </div>
            
            {/* Floating AI Suggestions */}
            <div className="absolute bottom-6 left-0 lg:-left-6 glass-panel rounded-2xl p-4 z-20 w-52 shadow-xl border border-white/50">
              <div className="flex items-center gap-1.5 mb-2 text-primary">
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span className="font-label-sm text-xs font-bold">AI Suggestion</span>
              </div>
              <p className="font-label-sm text-text-secondary text-xs leading-relaxed">
                {"Consider adding more quantifiable achievements to this software engineer role."}
              </p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="max-w-7xl mx-auto px-6 py-12 border-y border-glass-border bg-white/20 backdrop-blur-sm mt-8">
          <div className="flex flex-col items-center gap-6">
            <span className="font-label-sm text-xs font-bold text-text-secondary tracking-widest uppercase">
              {"TRUSTED BY JOB SEEKERS WHO LANDED ROLES AT"}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-65 grayscale hover:grayscale-0 transition-all duration-300">
              <span className="text-xl font-bold text-slate-400">Google</span>
              <span className="text-xl font-bold text-slate-400">Microsoft</span>
              <span className="text-xl font-bold text-slate-400">Amazon</span>
              <span className="text-xl font-bold text-slate-400">Meta</span>
            </div>
            <div className="flex gap-6 mt-2 text-xs md:text-sm font-semibold">
              <span className="text-primary">120,000+ Resumes Optimized</span>
              <span className="text-outline-variant">•</span>
              <span className="text-primary">98% ATS Success Rate</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-section-title text-3xl font-bold text-text-primary">
              Powerful Tools for Career Growth
            </h2>
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">
              Discover how BetterCV utilizes state-of-the-art AI parsing and generation to build high-converting resume profiles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "auto_awesome",
                title: "AI Section Rewrites",
                description: "Struggling to phrase achievements? Let our AI rewrite summaries and job descriptions with actionable power verbs instantly."
              },
              {
                icon: "fact_check",
                title: "ATS Compatibility Scan",
                description: "Our system scores your CV against standard Applicant Tracking System checkers to verify formatting and keyword density."
              },
              {
                icon: "share",
                title: "Safe Sharing & Export",
                description: "Download fully compliant ATS PDFs or generate secure web-view links to send directly to prospective employers."
              }
            ].map((feat, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 border border-white/40 flex flex-col gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-2xl">{feat.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary">{feat.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="max-w-3xl mx-auto px-6 py-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="font-section-title text-3xl font-bold text-text-primary">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-white/40 shadow-sm transition-all duration-300">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-text-primary hover:bg-white/20 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined">
                    {activeFaq === idx ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-glass-border/30">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-16 bg-surface-container-lowest border-t border-outline-variant">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4">
              <span className="font-section-title font-bold text-primary text-2xl tracking-tight">BetterCV</span>
              <p className="text-xs text-text-secondary leading-relaxed">
                {"© 2026 BetterCV. Professional resumes made simple and beautiful with AI-powered optimization."}
              </p>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-bold text-text-primary mb-1">Product</span>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#features">Features</a>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#how-it-works">Templates</a>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#faq">Pricing</a>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-bold text-text-primary mb-1">Company</span>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#">About Us</a>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#">Careers</a>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#">Contact</a>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <span className="text-sm font-bold text-text-primary mb-1">Legal</span>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-xs text-text-secondary hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
