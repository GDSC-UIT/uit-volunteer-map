# Contributing Guide

## Prerequisites

- Node.js 24.22.3 LTS (`.nvmrc`; supported range >=24.22.3 <25)
- npm 11.19.1 (`packageManager`; supported range >=11.19.1 <12)
- Git

## Git Workflow

### Branch Strategy

```
main              ← Production (protected)
  │
develop           ← Integration branch (protected)
  │
feature/*         ← New features
bugfix/*          ← Bug fixes
hotfix/*          ← Urgent fixes for production
```

### Quy trình làm việc

```bash
# 1. Clone repo (lần đầu)
git clone <repo-url>
cd uit-volunteer-map
npm install

# 2. Luôn bắt đầu từ develop mới nhất
git checkout develop
git pull origin develop

# 3. Tạo branch mới
git checkout -b feature/ten-tinh-nang
# hoặc: git checkout -b bugfix/ten-loi

# 4. Code và commit thường xuyên
git add .
git commit -m "feat: add map component"

# 5. Push branch lên remote
git push origin feature/ten-tinh-nang

# 6. Tạo Pull Request trên GitHub
#    - Base: develop
#    - Compare: feature/ten-tinh-nang

# 7. Sau khi PR được merge, xóa branch local
git checkout develop
git pull origin develop
git branch -d feature/ten-tinh-nang
```

### Commit Message Convention

Format: `type: message`

| Type | Mô tả |
|------|-------|
| `feat` | Tính năng mới |
| `fix` | Sửa lỗi |
| `refactor` | Refactor code |
| `docs` | Documentation |
| `test` | Thêm/sửa tests |
| `chore` | Config, dependencies |

Ví dụ:
```
feat: add campaign map view
fix: resolve login redirect issue
docs: update API documentation
```

### Code Review

- Mỗi PR cần ít nhất 1 approval
- CI phải pass (tests, lint, typecheck)
- Resolve tất cả comments trước khi merge

## Getting Started

Create `packages/backend/.env` from `.env.example` if it does not already exist,
and set a private `JWT_SECRET`. Create `packages/frontend/.env` from its `.env.example`
if needed. Preserve existing environment files and databases. CI uses the exact
Node/npm versions above; select them with your version manager before installing.
Verify `node --version` and `npm --version` match, then use `npm ci`.

```bash
# 1. Install dependencies
npm ci # or npm install

# 2. Setup database migrations and initial seed data
npm run migration:run
npm run seed

# 3. Development Workflow

# Terminal 1: Backend development server (builds shared first)
npm run dev:backend  # http://localhost:5000

# Terminal 2: Frontend development server (builds shared first)
npm run dev:frontend # http://localhost:3001

# Optional terminal 3 when changing shared sources:
npm run dev:shared

# npm run dev executes workspace scripts sequentially. Use separate terminals.
```

Backend binds to `127.0.0.1` by default; deployments exposing a container port
must explicitly set `HOST=0.0.0.0` and protect that port in their deployment.
Production requires a private random `JWT_SECRET` of at least 32 characters and
explicit comma-separated `CORS_ORIGINS` containing exact frontend origins. No
wildcards, paths or credentials. Development defaults allow ports 3001 on localhost
and 127.0.0.1; update the list when choosing another frontend port.
Origin-less clients still need the existing route authentication/authorization.

Login defaults to 10 failed/in-flight attempts per socket IP per 15 minutes and
returns HTTP 429 with `Retry-After`. Successful logins and server errors release
their reserved attempt. The bounded in-memory budget resets at process restart;
it is not shared across replicas. `trust proxy` remains false: reverse-proxied
clients share their proxy's budget. Before multi-instance production, configure a
trusted proxy topology and shared edge/application rate policy; do not blindly
trust `X-Forwarded-For`. Settings are in the backend environment example.

On refresh/Back/focus, the client verifies the current account through `/api/verify`.
Cached user roles never grant access. An expired token clears session/query cache
even when idle; logout does the same even offline. Initial restore fails closed
on an unavailable API, while a transient refresh failure preserves an already
verified session until expiry. Server authorization still runs on each request.

## Project Structure

```
packages/
├── frontend/         # React + Vite + Tailwind
│   └── src/
│       ├── routes/       # Page components
│       ├── components/   # Reusable components
│       ├── layouts/      # Layout wrappers
│       ├── contexts/     # React contexts
│       └── hooks/        # Custom hooks
├── backend/          # Express + TypeScript
│   └── src/
│       ├── routes/       # API routes
│       ├── middleware/   # Express middleware
│       └── schemas/      # Zod validation schemas
└── shared/           # Shared types & constants
```

## Development Workflow

### Adding a New API Endpoint

1. Define schema in `backend/src/schemas/`:
```typescript
// schemas/user.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

2. Create route in `backend/src/routes/`:
```typescript
// routes/user.ts
import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createUserSchema } from '../schemas/user.js';

const router = Router();

router.post('/', validate(createUserSchema), (req, res) => {
  // req.body is typed as CreateUserInput
});

export { router as userRouter };
```

3. Register in `backend/src/index.ts`:
```typescript
import { userRouter } from './routes/user.js';
app.use('/api/users', userRouter);
```

### Adding a New Page

1. Create page in `frontend/src/routes/`:
```typescript
// routes/UsersPage.tsx
export default function UsersPage() {
  return <div>Users</div>;
}
```

2. Add to router in `frontend/src/routes/index.tsx`:
```typescript
import UsersPage from '@/routes/UsersPage';

// Inside router config
{ path: 'users', element: <UsersPage /> }
```

### Protected Routes

Wrap routes that require auth:
```typescript
{
  element: <ProtectedRoute />,
  children: [
    { path: 'dashboard', element: <DashboardPage /> },
  ],
}

// Admin only
{
  element: <ProtectedRoute requiredRole="admin" />,
  children: [...],
}
```

### Shared Types

Add types in `shared/src/types.ts`, they're available in both packages:
```typescript
// Backend or Frontend
import { User, ApiResponse } from '@uit-volunteer-map/shared';
```

## Testing

```bash
# Run all tests once (CI mode)
npm test

# Watch mode (development)
cd packages/frontend && npm run test
cd packages/backend && npm run test

# With coverage (frontend only)
cd packages/frontend && npm run test:coverage
```

### Writing Tests

Frontend (React Testing Library):
```typescript
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import Component from './Component';

it('renders correctly', () => {
  render(<Component />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

Backend (Supertest):
```typescript
// route.test.ts
import request from 'supertest';
import app from '../index.js';

it('returns 200', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
});
```

## Code Style

- Use TypeScript strict mode
- Prefer named exports
- Use path aliases (`@/` for frontend src)
- Backend imports need `.js` extension (ESM requirement)

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Sequential workspace runner; use separate development terminals above |
| `npm run dev:shared` | Watch and recompile shared package |
| `npm run dev:backend` | Start backend in development mode |
| `npm run dev:frontend` | Start frontend in development mode |
| `npm run build` | Build all packages |
| `npm run migration:run` | Run pending migrations |
| `npm run seed` | Seed initial roles |
| `npm test` | Run all unit tests (once) |
| `npm run test:smoke` | Run reusable compiled runtime smoke test |
| `npm run typecheck` | TypeScript check all packages |
| `npm run lint` | Lint all packages |
| `npm run clean` | Remove node_modules & dist |

### Compiled runtime smoke check

Run `npm run test:smoke` from the repository root. It builds the current shared
and backend source once, runs compiled migrations and seeds on an isolated SQLite
database in the system temporary directory, starts the compiled server and checks
`/api/health`. Child processes and temporary files are cleaned up before success
or failure is reported. The existing developer database is never selected.

The runner uses the npm CLI supplied by npm, with Node and argument arrays on
Windows and Unix-like systems. Invoke it through the npm command, not directly
with `node scripts/smoke-runtime.mjs`. Build, migration, seed and health waits are
bounded; failures include subprocess output and return a nonzero exit code.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| user@example.com | user123 | user |
