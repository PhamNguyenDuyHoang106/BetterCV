# Architecture

## System Overview

BetterCV is a **monorepo-based AI SaaS** built with Clean Architecture principles.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js Web   │────▶│  NestJS API     │────▶│ Supabase        │
│   (Port 3000)   │     │  (Port 4000)    │     │ PostgreSQL      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │  OpenAI API     │             │
        │               └─────────────────┘             │
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        └──────────────▶│ Supabase Auth   │◀────────────┘
                        │ Supabase Storage│
                        └─────────────────┘
```

## Backend Architecture (NestJS)

```
src/
├── main.ts                 → Bootstrap with CORS, pipes, filters
├── app.module.ts           → Root module importing all feature modules
├── core/                   → Cross-cutting concerns
│   ├── decorators/         → @CurrentUser, @Roles
│   ├── filters/            → HttpExceptionFilter (global)
│   ├── guards/             → RolesGuard (global APP_GUARD)
│   └── interceptors/       → LoggingInterceptor (global)
├── database/               → PrismaService + DatabaseModule (global)
└── modules/
    ├── auth/               → Supabase JWT verification, user sync
    ├── user/               → User CRUD operations
    ├── cv/                 → CV CRUD, sections, versions, share links
    ├── ai/                 → OpenAI integration, quota, safety, streaming
    ├── billing/            → Stripe checkout, portal, webhooks
    ├── export/             → PDF (Puppeteer) + DOCX generation, Supabase Storage
    ├── template/           → Template listing
    ├── share/              → Public share link resolution
    └── health/             → Health check endpoint
```

## Authentication Flow

1. User signs up/in via **Supabase Auth** (client-side)
2. Supabase returns a JWT access token
3. Frontend calls `POST /api/auth/sync` to create/link user in Prisma DB
4. All subsequent API calls include `Authorization: Bearer <supabase-jwt>`
5. Backend validates JWT via `SupabaseJwtStrategy` (Passport)
6. `@CurrentUser()` decorator extracts `{ sub, email, role }` from JWT

## Data Flow

1. **CV Creation**: Frontend → `POST /api/cvs` → PrismaService → PostgreSQL
2. **AI Generation**: Frontend → `POST /api/ai/generate` → Safety Rules → Quota Check → OpenAI API → Store Request/Response → Return
3. **Export**: Frontend → `POST /api/exports/pdf` → Fetch CV + Template → Render HTML → Puppeteer PDF → Upload to Supabase Storage → Return URL
4. **Billing**: Frontend → `POST /api/billing/checkout` → Stripe Checkout Session → Redirect → Stripe Webhook → Sync Subscription → Update Role

## State Management (Frontend)

- **Zustand** store for auth state (token + user profile)
- **react-hook-form** for all form state
- **Local state** (useState) for page-specific data
- **SSR-safe** hydration pattern (checks `typeof window`)
