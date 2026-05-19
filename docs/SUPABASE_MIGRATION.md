# Supabase Migration Guide

## Overview

BetterCV has been migrated from a custom PostgreSQL + JWT + S3 stack to Supabase.

| Before | After |
|--------|-------|
| Custom JWT (bcrypt + issueTokens) | Supabase Auth |
| Custom refresh token rotation | Supabase session management |
| AWS S3 storage | Supabase Storage |
| Direct PostgreSQL connection | Supabase PostgreSQL (via Prisma) |

## What Changed

### Authentication

**Removed:**
- `bcrypt` password hashing
- Custom `issueTokens()` method
- `RefreshToken` database model
- Custom login/register/refresh/logout endpoints
- Custom `JwtStrategy` (Passport)

**Added:**
- `SupabaseJwtStrategy` — validates Supabase-issued JWTs
- `POST /auth/sync` — syncs Supabase user to Prisma database
- `supabaseId` field on `User` model
- Frontend uses `@supabase/ssr` for auth

### Storage

**Removed:**
- `@aws-sdk/client-s3` dependency
- `@aws-sdk/s3-request-presigner` dependency
- S3Client configuration
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`, `S3_PUBLIC_URL` env vars

**Added:**
- `@supabase/supabase-js` for storage
- `SUPABASE_STORAGE_BUCKET` env var
- Uses `supabase.storage.from(bucket).upload()` and `.getPublicUrl()`

### Database

- **Prisma ORM is preserved** — just point `DATABASE_URL` to Supabase PostgreSQL
- `User.passwordHash` is now nullable (for Supabase Auth users)
- `User.supabaseId` added as `@unique` field
- `RefreshToken` model removed
- Added cascade deletes on all foreign keys
- Added comprehensive `@@index` declarations

### Environment Variables

**Removed:**
```
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL
S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION, S3_PUBLIC_URL
```

**Added:**
```
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET
SUPABASE_STORAGE_BUCKET
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Frontend Auth Flow

```
1. User clicks "Sign In"
2. Frontend calls supabase.auth.signInWithPassword()
3. Supabase returns { session: { access_token } }
4. Frontend stores token in Zustand store
5. Frontend calls POST /api/auth/sync (or GET /api/auth/me)
6. Backend validates JWT via SupabaseJwtStrategy
7. Backend creates/finds user in Prisma DB
8. All subsequent API calls use Authorization: Bearer <token>
```

## Data Migration

If migrating existing users:
1. Create Supabase Auth users via Admin API
2. Link them by setting `User.supabaseId` in Prisma
3. The `AuthService.syncUser()` method handles this automatically when existing users sign in with matching email
