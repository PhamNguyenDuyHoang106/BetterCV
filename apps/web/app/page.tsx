"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/store/auth";

const STATS = [
  { value: "120K+", label: "CV đã tối ưu" },
  { value: "98%", label: "Tỷ lệ ATS pass" },
  { value: "4.9", label: "Đánh giá người dùng" },
];

const FEATURES = [
  {
    icon: "auto_awesome",
    title: "AI viết lại từng mục",
    description:
      "Gợi ý động từ mạnh, số liệu định lượng và cấu trúc bullet chuẩn recruiter — không còn CV nhàm chán.",
  },
  {
    icon: "fact_check",
    title: "Quét ATS thời gian thực",
    description:
      "Điểm khớp từ khóa, cảnh báo định dạng và checklist trước khi bạn gửi đơn ứng tuyển.",
  },
  {
    icon: "palette",
    title: "Mẫu chuyên nghiệp",
    description:
      "Thư viện template hiện đại, xuất PDF sắc nét và link chia sẻ bảo mật cho nhà tuyển dụng.",
  },
];

const STEPS = [
  { step: "01", title: "Chọn mẫu", desc: "Pick template phù hợp ngành & level của bạn." },
  { step: "02", title: "Điền & AI gợi ý", desc: "Nhập kinh nghiệm — AI polish từng dòng." },
  { step: "03", title: "Xuất & ứng tuyển", desc: "Tải PDF ATS-safe hoặc share link trực tiếp." },
];

const TESTIMONIALS = [
  {
    quote: "Từ 2 tuần không có phỏng vấn sang 5 offer trong tháng. ATS score lên 94% nhờ BetterCV.",
    name: "Minh Anh",
    role: "Software Engineer · Fintech",
  },
  {
    quote: "Giao diện sạch, AI rewrite tiết kiệm cả buổi tối mỗi lần chỉnh CV.",
    name: "Hoàng Long",
    role: "Product Manager · Startup",
  },
];

export default function HomePage() {
  const { accessToken, hydrate } = useAuthStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const faqs = [
    {
      question: "AI Resume Builder hoạt động thế nào?",
      answer:
        "Hệ thống phân tích JD mục tiêu, đối chiếu từ khóa với CV của bạn và đề xuất chỉnh sửa từng section — kèm điểm ATS trực quan.",
    },
    {
      question: "Dữ liệu của tôi có an toàn không?",
      answer:
        "Mọi CV được mã hóa và lưu qua Supabase. Chỉ bạn (và link share bạn tạo) mới truy cập được nội dung.",
    },
    {
      question: "Có xuất PDF chuẩn ATS không?",
      answer:
        "Có — PDF giữ layout, font và cấu trúc mà hệ thống tuyển dụng đọc được, không bị lỗi parse.",
    },
  ];

  return (
    <div className="bg-background text-text-primary antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-landing-mesh z-0" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-5%] w-[480px] h-[480px] bg-primary/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[520px] h-[520px] bg-primary-dark/15 rounded-full blur-3xl" />
      </div>

      <nav className="sticky top-0 w-full z-50 bg-glass-bg/90 backdrop-blur-xl border-b border-primary/20 shadow-sm">
        <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary-darker flex items-center justify-center text-on-primary font-bold text-lg shadow-md">
              BC
            </div>
            <span className="font-bold text-primary-darker text-xl tracking-tight">BetterCV</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-text-secondary">
            <a className="hover:text-primary-darker transition-colors" href="#features">
              Tính năng
            </a>
            <a className="hover:text-primary-darker transition-colors" href="#how-it-works">
              Cách dùng
            </a>
            <a className="hover:text-primary-darker transition-colors" href="#faq">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            {accessToken ? (
              <Link
                href="/dashboard"
                className="text-sm font-bold bg-primary text-on-primary rounded-xl px-5 py-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Vào Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-primary-darker hidden sm:block px-4 py-2 rounded-full border border-primary/40 hover:bg-primary/10 transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-primary text-on-primary rounded-xl px-5 py-2.5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Bắt đầu miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div className="flex flex-col gap-7">
              <div className="inline-flex self-start items-center gap-2 bg-primary/30 rounded-full px-4 py-1.5 border border-primary/50 text-xs font-bold text-primary-darker uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">bolt</span>
                AI · ATS · Professional
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold text-text-primary leading-[1.1] tracking-tight">
                CV chuẩn recruiter,
                <span className="text-primary-darker"> không cần designer.</span>
              </h1>
              <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
                BetterCV giúp bạn tạo hồ sơ ATS-friendly trong vài phút — AI rewrite, quét từ khóa và xuất PDF
                sắc nét như agency tuyển dụng.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={accessToken ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 text-sm font-bold bg-primary text-on-primary rounded-xl px-8 py-3.5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <span className="material-symbols-outlined">rocket_launch</span>
                  Tạo CV ngay
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-darker bg-white/60 border border-primary/30 rounded-xl px-8 py-3.5 hover:bg-white transition-all"
                >
                  Xem quy trình
                </a>
              </div>
              <div className="flex flex-wrap gap-8 pt-4 border-t border-primary/20">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-primary-darker">{s.value}</p>
                    <p className="text-xs font-semibold text-text-secondary mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-[400px] md:h-[460px]">
              <div className="absolute inset-4 rounded-3xl bg-gradient-to-br from-primary/40 via-primary-dark/20 to-transparent blur-2xl" />
              <div className="glass-panel absolute inset-0 rounded-2xl p-6 flex flex-col gap-4 border border-white/60 shadow-2xl z-10">
                <div className="flex items-center gap-2 border-b border-glass-border pb-3">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-text-secondary ml-2 font-mono">alex_mercer_cv.pdf</span>
                </div>
                <div className="w-2/5 h-3 rounded bg-primary/40" />
                <div className="w-4/5 h-7 rounded-lg bg-surface-variant" />
                <div className="space-y-2 flex-1">
                  {[100, 95, 88, 92].map((w) => (
                    <div key={w} className="h-2 rounded bg-tertiary-fixed" style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                  <span className="text-xs font-semibold text-text-secondary">ATS Match</span>
                  <span className="text-lg font-extrabold text-primary-darker">94%</span>
                </div>
              </div>

              <div
                className="absolute -top-2 right-0 lg:right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-primary/20 z-20"
                style={{ animation: "gallery-fade-in 0.6s ease-out" }}
              >
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                  94
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">ATS Score</p>
                  <p className="text-[10px] text-text-secondary">Excellent match</p>
                </div>
              </div>

              <div className="absolute bottom-4 left-0 lg:-left-4 glass-panel rounded-2xl p-4 w-56 shadow-xl border border-white/50 z-20">
                <div className="flex items-center gap-1.5 mb-2 text-primary-darker">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  <span className="text-xs font-bold">AI gợi ý</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Thêm số liệu: &quot;Tăng throughput 40%&quot; thay vì &quot;Cải thiện hiệu suất&quot;.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-primary/15 bg-white/40 backdrop-blur-sm py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-text-secondary tracking-widest uppercase text-center md:text-left">
              Được tin dùng bởi ứng viên tại
            </p>
            <div className="flex flex-wrap justify-center gap-10 text-lg font-bold text-slate-400/90">
              {["Google", "Microsoft", "Amazon", "Shopee", "VNG"].map((co) => (
                <span key={co} className="hover:text-primary-darker transition-colors">
                  {co}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold text-primary-darker uppercase tracking-widest mb-3">Tính năng</p>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              Mọi thứ bạn cần để CV được gọi phỏng vấn
            </h2>
            <p className="text-text-secondary mt-4 leading-relaxed">
              Không chỉ là template đẹp — BetterCV tối ưu nội dung, từ khóa và định dạng cho hệ thống tuyển dụng.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="group glass-panel p-8 rounded-2xl border border-white/50 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/50 flex items-center justify-center text-primary-darker mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-2xl">{feat.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{feat.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-16 md:py-24">
          <div className="rounded-3xl bg-gradient-to-br from-primary-darker via-[#2d5a38] to-[#1e3d28] p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-2">Quy trình 3 bước</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-10">Từ trống đến CV sẵn gửi trong 15 phút</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {STEPS.map((s) => (
                  <div key={s.step} className="border border-white/15 rounded-2xl p-6 bg-white/5 backdrop-blur-sm">
                    <span className="text-3xl font-black text-primary/80">{s.step}</span>
                    <h3 className="text-lg font-bold mt-3">{s.title}</h3>
                    <p className="text-sm text-white/75 mt-2 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
              <Link
                href={accessToken ? "/dashboard" : "/register"}
                className="inline-flex mt-10 items-center gap-2 bg-primary text-on-primary font-bold rounded-xl px-8 py-3.5 hover:brightness-105 transition-all"
              >
                Bắt đầu miễn phí
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-12">
            Người dùng nói gì về BetterCV
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="glass-panel rounded-2xl p-8 border border-white/50 relative"
              >
                <span className="material-symbols-outlined text-primary text-3xl mb-4 block opacity-60">
                  format_quote
                </span>
                <p className="text-text-primary leading-relaxed font-medium">&quot;{t.quote}&quot;</p>
                <footer className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/60 flex items-center justify-center text-on-primary font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-secondary">{t.role}</p>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="faq" className="max-w-2xl mx-auto px-6 py-12 mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-10">Câu hỏi thường gặp</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-white/50">
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-text-primary hover:bg-primary/10 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="material-symbols-outlined text-primary-darker">
                    {activeFaq === idx ? "expand_less" : "expand_more"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-primary/15">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-3xl bg-primary/40 border border-primary/50 p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-landing-mesh opacity-60" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold text-text-primary mb-4">
                Sẵn sàng chiếm spotlight trong hồ sơ ứng tuyển?
              </h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-8">
                Miễn phí bắt đầu. Nâng cấp Pro khi cần AI không giới hạn và template premium.
              </p>
              <Link
                href={accessToken ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 bg-primary-darker text-white font-bold rounded-xl px-10 py-4 shadow-lg hover:brightness-110 transition-all"
              >
                Tạo CV miễn phí
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-primary/20 bg-surface-container-lowest py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 max-w-6xl mx-auto">
            <div className="col-span-2 md:col-span-1">
              <span className="font-bold text-primary-darker text-xl">BetterCV</span>
              <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                © 2026 BetterCV — AI resume builder cho thị trường Việt Nam & quốc tế.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">Sản phẩm</span>
              <a className="text-xs text-text-secondary hover:text-primary-darker" href="#features">
                Tính năng
              </a>
              <a className="text-xs text-text-secondary hover:text-primary-darker" href="#how-it-works">
                Cách dùng
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">Tài khoản</span>
              <Link className="text-xs text-text-secondary hover:text-primary-darker" href="/login">
                Đăng nhập
              </Link>
              <Link className="text-xs text-text-secondary hover:text-primary-darker" href="/register">
                Đăng ký
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-text-primary">Hỗ trợ</span>
              <a className="text-xs text-text-secondary hover:text-primary-darker" href="#faq">
                FAQ
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
