# Developer Onboarding

Welcome to BetterCV! Here's everything you need to get productive.

## Project Structure

This is an **npm workspaces monorepo** with three apps and two shared packages.

| Workspace | Purpose | Port |
|-----------|---------|------|
| `apps/web` | Next.js 14 frontend | 3000 |
| `apps/api` | NestJS 10 backend API | 4000 |
| `apps/admin` | Admin panel (scaffold) | 3001 |
| `packages/shared` | Shared TypeScript types & DTOs | — |
| `packages/template-engine` | CV template HTML renderer | — |

## Running Commands

```bash
# Run in a specific workspace
npm --workspace apps/api run <script>

# Or use root shortcuts
npm run dev:web    # Start frontend
npm run dev:api    # Start backend
npm run db:migrate # Run Prisma migrations
```

## Backend Patterns

### Adding a New Endpoint

1. Create/update DTO in `modules/<feature>/dto/`
2. Add service method in `modules/<feature>/<feature>.service.ts`
3. Add controller route in `modules/<feature>/<feature>.controller.ts`
4. Use `@CurrentUser()` decorator instead of `@Req()`
5. Use `@UseGuards(AuthGuard("jwt"))` for protected routes

### Common Decorators

```typescript
// Get full user payload
@CurrentUser() user: JwtPayload

// Get just the Supabase ID
@CurrentUser("sub") supabaseId: string

// Restrict to specific roles
@Roles("ADMIN", "PRO")
```

### Supabase ID → Internal User ID

All services that need the internal user ID should call:
```typescript
private async resolveUserId(supabaseId: string): Promise<string> {
  const user = await this.prisma.user.findUnique({ where: { supabaseId } });
  if (!user) throw new ForbiddenException("User not found");
  return user.id;
}
```

## Frontend Patterns

### API Calls

Use `apiFetch` from `lib/api.ts`:
```typescript
const cvs = await apiFetch<Cv[]>("/cvs");
```

### Auth State

```typescript
const { accessToken, user, setAuth, clear } = useAuthStore();
```

### Supabase Auth

```typescript
import { createSupabaseClient } from "../../lib/supabase";

const supabase = createSupabaseClient();
await supabase.auth.signInWithPassword({ email, password });
```

## Database

- **ORM**: Prisma 5
- **Schema**: `apps/api/prisma/schema.prisma`
- **Migrations**: `npm run db:migrate`
- **Seed**: `npm run db:seed` (plans, templates, safety rules)

## Key Business Rules

1. **AI Quota**: Users have monthly token limits based on plan tier
2. **Soft Delete**: CVs use `isDeleted` flag, not hard delete
3. **Version History**: Every CV update creates a snapshot
4. **Safety Rules**: AI inputs are checked against regex blocklist
5. **Role Sync**: Stripe webhook updates user role when subscription changes
