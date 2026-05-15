# Database Overview

This document describes the tables in the CV Builder database, based on
`apps/api/prisma/schema.prisma`.

## Core Identity & Access
- `User`: Account record with email, hashed password, full name, and role. Owns CVs,
  subscriptions, tokens, and usage.
- `RefreshToken`: Stored hash for JWT refresh tokens with expiration and user relation.
- `StripeCustomer`: Maps a `User` to a Stripe customer id.

## Plans & Billing
- `Plan`: Defines plan tier (FREE/PRO/PREMIUM), name, monthly AI quota, Stripe price id.
- `Subscription`: Active or historical plan assignment for a user, including Stripe ids.
- `Invoice`: Minimal invoice tracking for payments (amount, currency, status).

## CV & Templates
- `Cv`: A CV record owned by a user. Holds locale and optional template reference.
- `CvSection`: Individual CV sections (profile, summary, experience, etc.) with JSON content.
- `CvVersion`: Version history snapshots for a CV (JSON snapshot).
- `TemplateCategory`: Category taxonomy (Tech/Business/Design).
- `Template`: Template schema JSON + activation flag and category reference.
- `ShareLink`: Public read-only token for sharing a CV, with optional expiry.

## AI Orchestration
- `Prompt`: Prompt registry key (e.g., `cv_generate`).
- `PromptVersion`: Versioned prompt content with active flag.
- `AiRequest`: Stored prompt inputs for auditability.
- `AiResponse`: Stored outputs and token counts.
- `AiUsage`: Per-request usage ledger for quotas.
- `SafetyRule`: Regex-based input blocklist for safety checks.

## Enums
- `UserRole`: `GUEST`, `FREE`, `PRO`, `PREMIUM`, `ADMIN`
- `PlanTier`: `FREE`, `PRO`, `PREMIUM`
- `CvSectionType`: `PROFILE`, `SUMMARY`, `EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`
