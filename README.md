# BetterCV — AI-Powered CV Builder SaaS

> Build, optimize, and export ATS-friendly CVs with AI assistance.

## Architecture

| Layer | Technology | Deployment |
|-------|-----------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS, Zustand | Vercel |
| Backend | NestJS 10, Prisma 5, PostgreSQL | Railway / Render |
| Auth | Supabase Auth | Supabase |
| Storage | Supabase Storage | Supabase |
| AI | OpenAI API (gpt-4o-mini) | — |
| Billing | Stripe | — |

## Monorepo Structure

```
apps/
  web/        → Next.js frontend
  api/        → NestJS backend API
  admin/      → Admin panel (scaffold)
packages/
  shared/     → Shared types & DTOs
  template-engine/ → CV template HTML renderer
infrastructure/
  docker/     → Dockerfiles & compose
docs/         → Project documentation
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your Supabase, Stripe, and OpenAI credentials

# 3. Generate Prisma client
npm run db:generate

# 4. Run database migrations
npm run db:migrate

# 5. Seed the database
npm run db:seed

# 6. Start development
npm run dev:api   # Backend on :4000
npm run dev:web   # Frontend on :3000
```

## Key Features

- **AI CV Generation** — Generate complete CV structures from user profiles
- **AI Rewriting** — Rewrite sections with professional/concise/ATS styles
- **CV Scoring** — Score CVs against job descriptions (0-100)
- **Keyword Analysis** — Identify missing skills from job descriptions
- **Template System** — Tech, Business, Design template categories
- **PDF/DOCX Export** — Export with Puppeteer (PDF) and docx library
- **Share Links** — Read-only public CV sharing with expiry
- **Subscription Billing** — Free/Pro/Premium tiers via Stripe
- **Role-Based Access** — GUEST, FREE, PRO, PREMIUM, ADMIN roles

## Documentation

See the [docs/](./docs/) directory for:
- [Architecture](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Developer Onboarding](./docs/ONBOARDING.md)
- [Supabase Migration](./docs/SUPABASE_MIGRATION.md)

## License

Private — All rights reserved.