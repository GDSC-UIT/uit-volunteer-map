# Contributing Guide

## Prerequisites

- Node.js >= 18
- npm >= 9
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
and set a private `JWT_SECRET`. Preserve existing environment files and databases.

```bash
# 1. Install dependencies
npm ci # or npm install

# 2. Setup database migrations and initial seed data
npm run migration:run
npm run seed

# 3. Development Workflow

# Multi-terminal development (recommended when modifying shared code):
# Terminal 1: Watch & auto-rebuild shared package
npm run dev:shared   # or npm run watch:shared

# Terminal 2: Backend development server
npm run dev:backend  # http://localhost:5000

# Terminal 3: Frontend development server
npm run dev:frontend # http://localhost:3001

# npm run dev executes workspace scripts sequentially. Use the terminals above
# to run shared watch, backend and frontend together.
```

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
