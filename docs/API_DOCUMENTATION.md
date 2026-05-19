# API Documentation

Base URL: `http://localhost:4000/api`

## Authentication

All authenticated endpoints require: `Authorization: Bearer <supabase-jwt-token>`

---

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/sync` | ✅ | Sync Supabase user to local DB |
| GET | `/auth/me` | ✅ | Get authenticated user profile |

### POST /auth/sync
```json
// Request
{ "fullName": "John Doe" }

// Response
{ "id": "cuid", "email": "john@example.com", "fullName": "John Doe", "role": "FREE" }
```

---

## CVs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/cvs` | ✅ | Create a new CV |
| GET | `/cvs` | ✅ | List user's CVs |
| GET | `/cvs/:id` | ✅ | Get CV with sections |
| PUT | `/cvs/:id` | ✅ | Update CV metadata |
| DELETE | `/cvs/:id` | ✅ | Soft-delete a CV |
| POST | `/cvs/:id/sections` | ✅ | Create/update a CV section |
| GET | `/cvs/:id/versions` | ✅ | List version history |
| POST | `/cvs/:id/share` | ✅ | Create share link |

### POST /cvs
```json
// Request
{ "title": "My CV", "locale": "en", "templateId": "optional-id" }

// Response
{ "id": "cuid", "title": "My CV", "locale": "en", ... }
```

### POST /cvs/:id/sections
```json
// Request
{ "type": "EXPERIENCE", "content": { "items": [...] }, "order": 3 }
// For updates, include "id" field

// Response — the created/updated section
```

---

## AI

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/generate` | ✅ | Generate CV from profile |
| POST | `/ai/generate/stream` | ✅ | Generate CV (SSE stream) |
| POST | `/ai/rewrite` | ✅ | Rewrite a CV section |
| POST | `/ai/rewrite/stream` | ✅ | Rewrite section (SSE stream) |
| POST | `/ai/score` | ✅ | Score CV against JD |
| POST | `/ai/keywords` | ✅ | Extract keywords/gaps |
| POST | `/ai/jd/analyze` | ✅ | Analyze job description |

### POST /ai/generate
```json
// Request
{ "locale": "en", "userProfile": { ... }, "jobDescription": "..." }

// Response — AI-generated JSON structure
```

---

## Billing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/billing/checkout` | ✅ | Create Stripe checkout session |
| POST | `/billing/portal` | ✅ | Create Stripe billing portal |
| POST | `/billing/webhook` | ❌ | Stripe webhook (signature verified) |

### POST /billing/checkout
```json
// Request
{ "priceId": "price_xxx", "successUrl": "https://...", "cancelUrl": "https://..." }

// Response
{ "url": "https://checkout.stripe.com/..." }
```

---

## Export

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/exports/pdf` | ✅ | Export CV as PDF |
| POST | `/exports/docx` | ✅ | Export CV as DOCX |

### POST /exports/pdf
```json
// Request
{ "cvId": "cuid" }

// Response
{ "url": "https://supabase-storage-url/..." }
```

---

## Templates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/templates` | ❌ | List active templates |
| GET | `/templates/:id` | ❌ | Get template details |

---

## Share

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/share/:token` | ❌ | Get shared CV by token |

---

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Health check |

```json
// Response
{ "status": "ok" }
```

---

## Error Response Format

All errors return:
```json
{
  "statusCode": 403,
  "message": "Error description",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "path": "/api/cvs"
}
```
