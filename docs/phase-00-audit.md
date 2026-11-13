# Phase 00 — v1.0 repository audit

Audit date: 2026-11-12 (Asia/Bangkok). Planning only; the release plan is proposed, not approved. See [v1 release plan](v1-release-plan.md) for scope, issue-sized tasks and release gates.

## 1. Current project status

**Verdict: a substantial team implementation with passing existing checks, but not yet a reproducible, integrated v1.0.** Production startup fails, primary frontend data remains mocked, and important authorization boundaries are incomplete.

- Audited checkout: `develop`, `95032e455506b805d27065483a5452428cd563da`, matching the fetched remote. Initial working tree was clean. No checkout, branch deletion/reset, application edit, migration edit, commit, push, merge or deployment was performed.
- Inventoried all 192 tracked files, manifests/lockfile, eight entities, twelve migrations, two seed modules, all routes/services/schemas, frontend routes/pages/API/hooks/components, seven test files and GitHub templates/workflow. Binary design assets were inventoried, not visually reviewed. No applicable `AGENTS.md` was found.
- Stack is already sufficient: React 19, TypeScript, Vite, Tailwind, TanStack Query, Leaflet, Express, Zod, TypeORM and SQLite. Retain it.
- Git fetch and `ls-remote --heads` verified thirteen live remote branches. Cached remote refs include deleted remote branches; these were preserved. GitHub reported exactly seven open PRs, #56–#62. PR metadata and associated CI runs were read through the GitHub connector.

| Area | Implemented evidence | Remaining integration |
|---|---|---|
| Authentication | Real Axios login/logout, bcrypt verification, JWT signing/verification, Admin/Leader role checks; `frontend/src/api/auth.ts`, `contexts/AuthProvider.tsx`, `backend/src/service/authService.ts`, `middleware/auth.ts` | Active-account checks, session expiry handling and account-role changes are incomplete. Guest is anonymous, not a stored third role. |
| Campaigns | Backend CRUD and 21 route tests; `backend/src/routes/campaign.ts`, `service/campaignService.ts` | Guest reads blocked; Leader writes allowed; frontend reads mocked and Admin page static. |
| Teams | Public reads, Admin create/delete, owner checks for Leader update/attachments; `backend/src/routes/team.route.ts`, `service/teamService.ts` | Campaign filtering/current Leader team resolution absent; membership and designated-leader relations can disagree; Admin UI static. |
| Posts/media | Public reads, authenticated writes, photo metadata, thumbnails, soft delete; `backend/src/routes/post.ts`, `service/postService.ts`; Cloudinary upload helper and picker UI | No post ownership enforcement; list/detail shapes differ; publish/delete controls do not persist; no integrated ordering flow. |
| Map | Leaflet boundaries/annotations, zoom layers, hover/click callbacks; `frontend/src/components/layouts/MapView.tsx` | Required GeoJSON absent; no persisted spatial marker contract or marker-to-post identity mapping. |
| Shared/CI | Shared types/constants, strict TypeScript, four CI jobs; `shared/src/*`, `.github/workflows/ci.yml` | Shared runtime packaging broken; backend lint configuration misses TS; no migration/start/role-journey gate. |

Paths in the tables above are relative to `packages/`, except `.github/*`.

## 2. Evidence-backed technical issues

Confirmed by execution means exercised during this audit. Source-confirmed means directly visible in inspected code; it does not imply a live exploit or browser acceptance test.

| ID / priority | Finding and consequence | Evidence |
|---|---|---|
| F01 / P0 | **Built server does not start.** `npm start` exits 1 with `ERR_MODULE_NOT_FOUND` for `packages/shared/src/types.js`. Shared exports point at `src/index.ts`, whose exports reference `.js`; the shared package has no build script. | Execution: `logs/phase00/start.log`; `packages/shared/package.json:6`, `packages/shared/src/index.ts:2`, root `package.json:12`. |
| F02 / P0 | **All three domain API modules simulate requests.** Their delays return `mockCampaigns`, `mockTeams`, `mockPosts`, so a populated UI does not demonstrate DB integration. | `packages/frontend/src/api/campaign.ts:3`, `api/team.ts:1`, `api/post.ts:1`; domain hooks call these modules. |
| F03 / P0 | **Campaign authorization contradicts Guest/Admin workflows.** Router-wide auth blocks Guest GETs and grants Leaders all campaign writes. Existing tests explicitly expect these policies. #58 and #59 independently change them. | `packages/backend/src/routes/campaign.ts:18`; `routes/campaign.test.ts:111`, `:219`. Source-confirmed. |
| F04 / P0 | **Post object authorization is missing.** A Leader can select another team/author on create/update and mutate another team's post or photos: routes pass only IDs/body to services, never the current user. Team update/attachments already provide a reusable ownership pattern. | `packages/backend/src/routes/post.ts:72`, `:76`, `:111`, `:136`, `:161`; `service/postService.ts:67`, `:104`; contrast `service/teamService.ts:194`. Source-confirmed; no exploit against the existing DB was attempted. |
| F05 / P0 | **Soft-deleted accounts can still authenticate; signed tokens retain old privileges.** Login queries username without `isDeleted`; middleware trusts JWT role without reloading the account. Missing `JWT_EXPIRES_IN` has no enforced default/validation. | `packages/backend/src/service/authService.ts:14`, `:36`; `middleware/auth.ts:28`; `service/accountServices.ts:121`. Source-confirmed. |
| F06 / P0 | **The map is not reproducible or correctly associated with posts.** `index.json` lists 35 boundary files; all are absent, as is `annotations.geojson`. `.gitignore` excludes every GeoJSON. Marker selection renders `posts[0]`, regardless of selected identity. No coordinate columns exist in current entities; shared `VolunteerLocation` is unused. | `packages/frontend/src/components/layouts/MapView.tsx:147`, `:191`, `:276`; `public/data/index.json`; `.gitignore:145`; `pages/CampaignPage.tsx:41`; `packages/backend/src/entities/Post.ts`. Source/filesystem-confirmed; browser rendering not executed. |
| F07 / P0 | **Cross-campaign/team scoping and DTO contracts are missing.** CampaignPage loads all teams/posts; backend ignores `?teamId=` on post list, has no team-by-campaign route and omits campaign identity from team list. Post list includes thumbnail/team/author summaries while detail returns the entity without loading photos. Shared Team/Post interfaces do not describe all actual responses. | `packages/frontend/src/pages/CampaignPage.tsx:20`; `packages/backend/src/routes/post.ts:25`, `:48`; `service/postService.ts:16`, `:55`; `routes/team.route.ts`; `service/teamService.ts:15`; `packages/shared/src/types.ts`. |
| F08 / P0 | **Leader and Admin operations are mostly placeholders.** `/leader` supplies no `teamId`, while MyTeamPage reads that param. Post publish only closes the popup; delete logs to console; team-edit popups only close. Admin team/account pages render fixed arrays; campaign management is also static on develop. Home links use `/campaign/xtn`, not a numeric API identity. | `packages/frontend/src/routes/index.tsx`; `pages/leader/MyTeamPage.tsx:13`, `:56`, `:66`; `pages/admin/*.tsx`; `components/ui/popups/FormationEditOverall.tsx`, `FormationEditRole.tsx`, `post/PostDetailPopup.tsx`; `pages/HomePage.tsx`. |
| F09 / P0 | **Production and development DB paths diverge.** Source runtime and migration CLI use `src/data/database.sqlite`; compiled runtime resolves `dist/data/database.sqlite`. Startup does not execute migrations. A successful compile cannot establish a ready production database. | `packages/backend/src/db/data-source.ts:18`, `typeorm.config.ts:18`, `src/index.ts:7`. Source-confirmed; the existing SQLite file was not used for diagnostics. |
| F10 / P1 | **Backend ESLint silently misses TypeScript.** `files: ['**/*.{ts}']` yields `undefined` from `eslint --print-config src/service/accountServices.ts`; root lint exits zero despite uncovered TS. | `packages/backend/eslint.config.js:7`; explicit print-config execution. Frontend lint and all typechecks did execute. |
| F11 / P1 | **Migration bootstrap passes, historical populated upgrade is unsafe.** All twelve migrations succeed on `:memory:`, with no pending migrations, FK violations or schema drift. TypeORM's normal migration runner fails the fourth migration against a disposable DB populated after the first three: `NOT NULL constraint failed: temporary_Post.CreatedAt`. The table-copy query does not backfill newly required timestamps. An earlier direct-call probe failed at a FK-protected table drop; using the normal runner established the relevant upgrade failure. Do not infer production upgrade safety from the empty bootstrap. | `logs/phase00/migrations.log`, `populated-migration.log`; `packages/backend/src/db/migrations/1769193138220-fix_Campaign_Photo_Post_Team.ts:15`, `:16`. Historical deployed DB versions and full rollback safety are unverified. |
| F12 / P1 | **Multi-step writes can partially persist.** Post+photos, team+attachments and team+member soft deletion run separate saves without a transaction. Team create sets `Team.leader` without setting `User.team`; ownership/listing uses `User.team`. Account creation requires an existing team, while team creation requires an existing Leader user. | `packages/backend/src/service/postService.ts:73`, `:86`; `service/teamService.ts:159`, `:170`, `:179`, `:201`; `service/accountServices.ts:71`; `schemas/team.ts`, `schemas/account.ts`. |
| F13 / P1 | **Account/error response hygiene is inconsistent.** Account detail returns the entity, including password hash. Account list has an uncaught async Express 4 handler; other routes mix envelopes/statuses and expose raw errors. Invalid numeric IDs and dates are inconsistently validated. | `packages/backend/src/service/accountServices.ts:48`; `routes/account.route.ts`; `middleware/errorHandler.ts`; `schemas/campaign.ts`; `schemas/post.ts`. Runtime impact of every malformed-input path is unverified. |
| F14 / P1 | **Session/cache and deployment configuration need tightening.** Auth restoration trusts local storage; the Axios interceptor discards HTTP status, never expires the session; logout does not clear TanStack caches. `cors()` allows any origin, login has no rate limiting, and env configuration is not validated at startup. | `packages/frontend/src/contexts/AuthProvider.tsx`, `contexts/QueryProvider.tsx`, `api/client.ts`; `packages/backend/src/app.ts:25`, `routes/auth.ts`. Keep JWT and existing auth design; harden concrete boundaries. |
| F15 / P1 | **Dependency advisories require targeted triage.** Full audit: 51 affected-package entries (4 low / 13 moderate / 28 high / 6 critical). Production-filtered audit: 24 (2 / 5 / 14 / 3). These are advisory matches, not proven application exploits. Critical full-tree entries include handlebars, mysql2, proxy-addr, tar, typeorm and vitest. | `logs/phase00/npm-audit.json`, `npm-audit-production.json`; `package-lock.json`. `npm ls` confirms unused code-generator tooling brings TypeORM 0.2.45 and Axios 0.21.4 alongside runtime TypeORM 0.3.28 / frontend Axios 1.13.4. Some fixes suggest major changes; no automatic fix was applied. |
| F16 / P1 | **Setup/runtime promises drift.** README is entirely placeholders; documented port 3000 differs from Vite 3001; documented email accounts differ from migration usernames; Node >=18 conflicts with installed Vitest 4, Router 7 and jsdom 27 requirements. There is no frontend env example. | `README.md`; `CONTRIBUTING.md:5`, `:92`, `:256`; `packages/frontend/vite.config.ts:15`; `package.json:24`; lockfile engines. Root dev uses sequential npm workspace scripts containing long-running watchers; the two-terminal commands are the existing safe fallback (source-derived, not runtime-tested). |
| F17 / P1–P2 | **Coverage and presentation claims exceed evidence.** Only three frontend hook tests; backend tests use synchronized in-memory schemas, not migrations. No committed browser journeys, production-start or asset-existence checks. Statistics are hardcoded (268/9/4), year selection is local UI state only. Main bundle is 598.70 kB minified / 186.37 kB gzip. Duplicate image assets exist in background/icons/public. | Seven `*.test.*` files, Vitest configs; `packages/frontend/src/components/layouts/Statistic.tsx:53`, `TimeSelect.tsx:4`; build output. Full responsive/accessibility/performance review remains unverified. |

### Existing PR defects and duplication

- **#56 / #60:** both add `post.test.ts` and `team.route.test.ts` independently; #56 additionally mixes UI states, toast, lockfile changes and three `.DS_Store` files. Neither is an ancestor of the other. Select one test foundation and preserve useful assertions from both; do not overwrite one with the other or apply both commits unchanged.
- **#58 / #59:** both change campaign authorization/tests. Land one backend policy implementation; port only #59's frontend/API/hooks work afterward. #58's role matrix does not add post ownership.
- **#57:** adds `Photo.Order` without a migration although synchronization is disabled. Upload/reorder routes have no auth/ownership, operate globally rather than within a post, rely on an uncreated relative `uploads/` directory, validate MIME metadata only and register in `index.ts` after `app.ts`'s error handler. App-import tests cannot see these routes. Cloudinary is already implemented in the frontend. Hold this PR; do not add a second storage path for v1.
- **#61:** adds a second frontend Team DTO instead of resolving shared contracts. `getByCampaign` returns every team when campaignId is missing in the response. MyTeamPage still reads an absent route parameter and its publish/delete handlers remain placeholders. Reuse API/hooks and UI bindings after contract/current-team fixes.
- **#62:** introduces two post clients (`api/post.ts` and `api/postApi.ts`); the first hardcodes `http://localhost:5000` and the second uses `/api`. The active client resolves `{success:false}` responses rather than throwing, so failed mutations can invoke success UI paths. `getByTeam` sends a query parameter the backend ignores. Post detail expects photos that backend detail does not load. Also adds ad hoc DB/account scripts with fixed demo passwords/account logging. Port only relevant client/hooks/pages onto the existing Axios client, using explicit request DTOs and real error handling.
- **`feat/connect-api`:** valuable Axios-based read integration, team-by-campaign and post-by-team routes, richer reads and seed data; but uses incompatible DTOs (`photos: string[]`, `leader`/`viceLeaders`/`images` versus current shared shapes), adds ViceLeader role and a text location column, hardcodes campaign ID 2, still opens `posts[0]` for map selection, and lacks six develop commits including login fixes. No whole-branch merge. Seed contents include real-looking names/remote images; rights/consent and use as demo fixtures are unverified.

## 3. Branch/PR integration matrix

All numbers are from fetched commit ancestry, not title similarity. `D-only / B-only` is `git rev-list --left-right --count origin/develop...origin/<branch>`. Files count the branch's changes from its common ancestor with develop, not the eventual merged tree. All seven PRs were open and reported mergeable when queried; mergeable is not integrated correctness.

| Live remote branch | Head | D-only / B-only | Feature files | Disposition |
|---|---|---:|---:|---|
| develop | 95032e4 | 0 / 0 | 0 | Integration base. |
| main | 15ddd6d | 215 / 1 | 0 | Unique commit is the historical #31 merge; common ancestor af222a5. Main-to-develop tree diff is 121 files, +20,934/-751. Never start v1 feature work from main. |
| campaign-api-connect | 4177ca8 | 0 / 1 | 5 | #59: reuse frontend work after canonical backend authorization. |
| feat/connect-api | 612cf1f | 6 / 11 | 35 | Selectively port read filtering/seed ideas; reconcile DTOs, omit ViceLeader; no PR found among open PRs. Common ancestor 38b8071. |
| feat/image-upload-ordering | d820eff | 0 / 2 | 7 | #57: hold; schema/auth/storage gaps. |
| feat/post-api-connect | 24647cb | 0 / 2 | 13 | #62: revise/port; do not import duplicate client/account scripts. |
| feature/Loading_Errors_EmptyStates | e6e223b | 0 / 3 | 15 | #56: port reusable states/toast and reconcile duplicate tests; omit OS files/unrelated lock churn. |
| feature/core-crud-apis | 547d3a0 | 0 / 1 | 2 | #60: focused test source; reconcile with #56, extend missing boundaries. |
| feature/role-auth | 1c2c892 | 0 / 1 | 7 | #58: preferred role-policy source; extend ownership/inactive-account cases. |
| feature/team-api-connect | 53de974 | 0 / 2 | 7 | #61: selectively port after DTO/filter/current-team work. |
| feature/leader-logout-api | c62bad1 | 3 / 0 | 0 | Already contained; no integration needed. |
| fix/login | cacaaea | 1 / 0 | 0 | Already contained; preserve. |
| refactor/mini-task | e3acb3d | 48 / 0 | 0 | Already contained. |

| PR | Current base | PR-reported commits/files | Actual extra commits/files over develop | Associated CI run |
|---|---|---:|---:|---|
| [#56](https://github.com/GDSC-UIT/uit-volunteer-map/pull/56) | main | 218 / 131 | 3 / 15 | [25563564471](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25563564471), success |
| [#57](https://github.com/GDSC-UIT/uit-volunteer-map/pull/57) | develop | 2 / 7 | 2 / 7 | [25568600447](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25568600447), success |
| [#58](https://github.com/GDSC-UIT/uit-volunteer-map/pull/58) | develop | 1 / 7 | 1 / 7 | [25571360873](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25571360873), success |
| [#59](https://github.com/GDSC-UIT/uit-volunteer-map/pull/59) | develop | 1 / 5 | 1 / 5 | [25572450932](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25572450932), success |
| [#60](https://github.com/GDSC-UIT/uit-volunteer-map/pull/60) | main | 216 / 123 | 1 / 2 | [25606590795](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25606590795), success |
| [#61](https://github.com/GDSC-UIT/uit-volunteer-map/pull/61) | main | 217 / 122 | 2 / 7 | [25607306237](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25607306237), success |
| [#62](https://github.com/GDSC-UIT/uit-volunteer-map/pull/62) | develop | 2 / 13 | 2 / 13 | [25786719411](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/25786719411), success |

These are retrieved historical PR-triggered workflow conclusions, not locally rerun branch tests or evidence that the combined changes work. Individual job logs and fork/production environments were not audited.

Preserved stale remote-tracking refs (absent from live heads): `chore/setup-db-seed`, `feature/Admin-Login-UI`, `feature/admin-ui`, `feature/backgroundlayout`, `feature/leader-ui`, `fix/loginpage`; all are ancestors of develop. All existing local branches are also ancestors of develop, including local `feature/leader-ui` at 9e9c2a9 (ahead of its stale tracking ref, already integrated). Local `main` remains at 8970f27, 83 commits behind live main. No branch cleanup is proposed as release-critical work.

Reproduce comparisons without checking out feature branches:

```text
git ls-remote --heads origin
git rev-list --left-right --count origin/develop...origin/<branch>
git merge-base origin/develop origin/<branch>
git diff --name-status origin/develop...origin/<branch>
git log --oneline origin/develop..origin/<branch>
git diff --name-status origin/main origin/develop
```

## 4. Prioritized backlog

The [release plan](v1-release-plan.md) defines the MVP, P0/P1/P2 tasks, dependencies, acceptance criteria, effort, integration order and release checklist. P0 means a core journey/security/reproducibility blocker; P1 means a required quality gate before v1 unless its feature is explicitly deferred; P2 is post-v1 polish.

## 5. Executed baseline

Environment: Windows PowerShell, Node **v24.11.1**, npm **11.6.2**, develop **95032e4**. CI uses Ubuntu / Node 20; that environment was not reproduced locally. Commands ran at repository root. Four checks ran concurrently after successful install; timings therefore include resource contention.

| Command | Actual result | Duration | Diagnosis / evidence |
|---|---|---:|---|
| `npm ci` (sandbox) | Failed, exit -4048 | 20.31 s | EPERM creating nested node_modules directory; `logs/phase00/npm-ci.log`. |
| `npm ci` (authorized unrestricted retry) | **Passed**, exit 0; added 700 packages, audited 704 | 81.34 s | Deprecated packages and 51 advisory entries; `npm-ci-retry.log`. Lockfile unchanged. |
| `npm run lint` | **Passed**, exit 0 | 19.13 s | Both workspace scripts invoked, but backend TS configuration ineffective (F10); `lint.log`. Shared has no lint script. |
| `npm run typecheck` | **Passed**, exit 0 | 19.09 s | Backend, frontend, shared; `typecheck.log`. |
| `npm test` (sandbox) | Failed, exit 1; backend 55 failures, frontend 3 passes | 21.65 s | Backend Supertest loopback connections denied with `EACCES`; `test.log`. |
| `npm test` (authorized unrestricted retry) | **Passed**, exit 0; backend 55/55 in 6 files, frontend 3/3 in 1 file | 8.64 s | All 58 existing tests executed successfully; `test-retry.log`. |
| `npm run build` | **Passed**, exit 0 | 24.81 s | Backend tsc, frontend tsc/Vite; warning for 598.70 kB JS chunk; `build.log`. Shared has no build step. |
| `npm start` (additional smoke) | **Failed**, exit 1 | 5.61 s | Shared `.js` exports unresolved before DB initialization; `start.log`. |
| All compiled migrations in disposable `:memory:` DB | **Passed**, exit 0 | Not timed | 12 applied, no pending, `PRAGMA foreign_key_check=[]`, zero entity-schema drift queries; `migrations.log`. |
| Historical populated migration fixture | **Failed**, exit 1 | Not timed | TypeORM `runMigrations()` applies first three to a disposable SQLite file; after inserting a campaign/post and reopening, remaining migrations fail at fourth migration's missing CreatedAt backfill; `populated-migration.log`. Existing DB and migration CLI were not used. |
| `npm audit --json` / `npm audit --omit=dev --json` | Both exit 1 | Not timed | Full 51 / production-filtered 24 advisory entries. Exploit reachability requires triage. |

All log paths after the first are relative to ignored `logs/phase00/`. Disposable diagnostic scripts are there too. No migrations, seeders or diagnostic writes were run against the existing SQLite file. The build changed only generated line endings in tracked `vite.config.d.ts`; those were restored after inspecting the diff. Final deliverable changes are documentation only.

Unverified: combined feature-branch build/tests, browser role journeys, real Cloudinary uploads/preset policy, existing DB upgrade/restore, deployed environment, real user-data suitability, configured GitHub branch protection and vulnerability exploitability. A green build is not a release sign-off.

## 6. Recommended first implementation task

**R01: make a clean build produce a runnable backend with one explicit database location.** Start a small `codex/release-runtime` branch from current develop only after implementation is authorized. Compile/export shared JavaScript before backend build, make runtime/migration/seed DB paths agree without relocating existing data implicitly, validate environment, and add a disposable migration/start smoke check. Acceptance: fresh install -> documented migrations/seed -> build -> start -> healthy API under the selected supported Node version, with no reliance on TypeScript source execution.

Do not begin this task during Phase 00. The source audit and proposed plan are the deliverables of this phase.
