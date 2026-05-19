# Setup Guide

## Prerequisites

- **Node.js** ≥ 18.18
- **npm** ≥ 9
- A **Supabase** project (free tier works)
- **Stripe** account (for billing — optional for dev)
- **OpenAI** API key (for AI features — optional for dev)

## Step 1: Clone & Install

```bash
git clone <repo-url> bettercv
cd bettercv
npm install
```

## Step 2: Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
   - JWT Secret → `SUPABASE_JWT_SECRET`
3. Go to **Settings → Database** and copy:
   - Connection string → `DATABASE_URL`
4. Go to **Storage** and create a bucket named `cv-exports` (set to public)

## Step 3: Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values from Step 2.

## Step 4: Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial data (plans, templates, safety rules)
npm run db:seed
```

## Step 5: Start Development

```bash
# Terminal 1 — Backend
npm run dev:api

# Terminal 2 — Frontend
npm run dev:web
```

- Frontend: http://localhost:3000
- API: http://localhost:4000/api
- Health: http://localhost:4000/api/health

## Step 6: Create Storage Bucket

In Supabase Dashboard → Storage:
1. Create bucket: `cv-exports`
2. Set it to **Public** (for PDF/DOCX download URLs)
3. Add policy: Allow `INSERT` for authenticated users

## Optional: Docker

```bash
cd infrastructure/docker
docker compose up --build
```

## Optional: Stripe Setup

1. Get API keys from [Stripe Dashboard](https://dashboard.stripe.com)
2. Create two products with prices (Pro and Premium)
3. Set up webhook endpoint: `https://your-api.com/api/billing/webhook`
4. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
