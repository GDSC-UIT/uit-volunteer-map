# Proposed v1.0 scope and delivery plan

Status: proposal from the 2026-11-12 Phase 00 audit, awaiting implementation authorization. [Audit and branch evidence](phase-00-audit.md). Estimates are focused engineer-days, including meaningful tests/review fixes, not elapsed calendar promises.

## MVP boundary

Deliver one complete Guest -> Admin -> Leader -> Guest data lifecycle using the existing stack and existing UI.

| Persona | v1.0 acceptance scope |
|---|---|
| Guest | Browse campaigns from SQLite-backed APIs; open the selected campaign's teams/posts and post galleries; open a reproducible map whose markers identify the correct persisted post; see honest loading/error/empty/not-found states. No login for public reads. |
| Leader | Log in; resolve own team from authenticated account, not an arbitrary URL/default; update allowed team details; create/edit/delete own team's posts with image metadata and validated coordinates; refresh/relog and observe persisted data; reject all cross-team mutation attempts. |
| Admin | Manage campaign metadata, teams/Leader assignment and Leader accounts; manage posts; enforce deletion/conflict policy; create a usable campaign/team/leader lifecycle without manual DB editing. No password/hash display. |
| Operator / reviewer | Follow a fresh-clone README to install, configure, migrate, seed, build and run; obtain the same documented demo; execute checks and role journeys; restore a backup. Clearly distinguish demo data from production data. |

Use shared **transport DTOs**, not TypeORM entities or duplicated frontend interfaces. Keep explicit list/detail/create/update contracts only where their actual payloads differ. Retain the current Axios client, TanStack Query keys/providers, route layouts, Zod validation and SQLite/TypeORM services.

For the map, add only the persisted fields the feature needs (validated latitude/longitude and post/team/campaign identity) through a new reviewed migration. A free-text location alone is insufficient for marker positioning. Reuse Leaflet; do not add a geocoding service/GIS backend. Boundary GeoJSON must have a documented legal source, reproducible packaging and integrity checks.

For media, retain the existing Cloudinary integration as the proposed single upload path. Validate configuration, file constraints and preset restrictions; persist URLs/ordering in SQLite. Keep a file through failed publish for retry and document external-upload cleanup limitations. Do not merge #57's local disk storage. Arbitrary server-side media management, private media and a second provider are out of scope. If the existing preset cannot be appropriately constrained, a small server-signed upload endpoint is the concrete fallback, not a storage redesign.

Explicitly defer: ViceLeader role, public sign-up, social features, advanced analytics/dashboard, multi-year archival UX, new map tooling, container/orchestration adoption, distributed services and visual redesign. Hide or label deferred controls. Statistics must be derived from available data or removed/labeled; do not present static numbers as live metrics. Campaign descriptions/basic images are sufficient; featured-activity editorial tooling and role-edit decorative popups can be deferred.

## Issue-sized backlog

P0: core correctness/security/reproducibility blockers. P1: release quality requirements unless the feature is explicitly removed. P2: optional improvements after v1. Dependencies use task IDs. Risk is integration/data risk, not priority.

| ID | Priority / task | Dependencies | Acceptance criteria | Risk | Effort |
|---|---|---|---|---|---:|
| R01 | **P0 — Build/run shared workspace and unify DB configuration** | None | Shared emits/export JS; correct build order; source/compiled migration/seed/runtime use one explicit stable DB path; no automatic move/reset of existing DB; startup validates env; disposable fresh DB can migrate, build, start and answer health. | High: runtime/data path | 1–1.5 d |
| R02 | **P0 — Campaign access and current account validity** | R01 | Anonymous reads 200; missing write token 401; Leader campaign writes 403; Admin valid writes pass. Deleted account cannot log in or use an old token; role changes take effect; expiry configured/validated. Test DB state as well as status. Reuse #58 policy; avoid duplicate #59 backend edit. | High: auth | 1–1.5 d |
| R03 | **P0 — Post ownership and actor identity** | R02 | Admin works across teams; Leader creates/updates/deletes/adds photos only within assigned active team; derive author from authenticated user; reject spoofed author/team transfer and inactive parents; include two-Team positive/negative tests. Reuse existing TeamService owner checks. | High: object authorization | 1–1.5 d |
| R04 | **P0 — Canonical read/filter/current-team contracts** | R02 | Shared DTOs match all responses; campaign selection returns only its teams/posts; team posts filter on backend; post detail loads ordered live photos; authenticated own-team endpoint/data resolution works; malformed/missing IDs give consistent 400/404. Test with two campaigns/teams and differing account/user IDs. Select filtering logic from connect-api without adopting its incompatible DTOs/ViceLeader. | High: cross-layer contracts | 1–1.5 d |
| R05 | **P0 — Replace mocked Guest data using existing UI** | R04 | Campaigns/team/post clients use one Axios base; actual campaign IDs replace `xtn`/hardcoded 2; detail links survive reload; loading/error/empty/retry behave honestly; mutations refetch appropriate lists/detail; browser/component integration demonstrates real responses. Reuse #59/#61/#62 read bindings and #56 states. | Medium | 1–1.5 d |
| R06 | **P0 — Reproducible map and real marker identity** | R04, R05 | Package all required geometry/annotations or a documented minimal boundary set; validate manifest existence and attribution. Add reviewed coordinate migration/validation. Selected campaign's persisted posts produce markers; selecting marker A opens A even if not first; bad/missing coordinates/assets fail safely. Reload and two-marker checks pass. | High: schema/assets | 1.5–2 d |
| R07 | **P0 — Admin campaign/team lifecycle and consistent Leader assignment** | R02, R04 | Port #59 campaign CRUD; wire existing Admin Team UI with create/edit/delete and conflict feedback; assignment keeps `Team.leader` and `User.team` coherent transactionally; existing posts protect campaign deletion with documented 409 or deliberate safe policy. No accidental cascade/data loss. | High: lifecycle | 1.5–2 d |
| R08 | **P0 — Admin Leader-account provisioning** | R02, R07 | Wire existing account UI to list/create/update/deactivate; permit coherent bootstrap/provisioning before assignment (resolve required-team/required-leader cycle); lookup roles by name; enforce permissions; sanitize output; old tokens denied after deactivate. Test create Leader -> assign Team -> log in. | High: identity/lifecycle | 1–1.5 d |
| R09 | **P0 — Leader own-team and persistent post editor** | R03, R04, R07 | `/leader` resolves correct team; team edit saves; publish/edit/delete call API and preserve input on errors; photos displayed in detail; no no-op visible controls; works after refresh and sign-out/sign-in. Reuse #61 and selected #62 hooks/pages; no duplicate clients/ad hoc credential scripts. | High: UI integration | 1.5–2 d |
| R10 | **P1 — One media flow and atomic related writes** | R03, R09 | Constrain existing Cloudinary uploads; no local-disk API; save post+photos/team+attachments transactionally; deterministic persisted photo order and thumbnail; failed DB write leaves no partial DB records. Any new ordering column gets a new migration/backfill. Test invalid file/DB conflict/retry. External orphan cleanup limitation documented. | Medium/high: provider | 1–1.5 d |
| R11 | **P1 — Migration/seed reproducibility and upgrade policy** | R01; R06/R10 before final replay | Fresh DB applies all migrations and idempotent safe demo seed; verify FK integrity/schema drift; demo accounts/teams/posts usable; migration restart is harmless. Historical populated fixture reproduced; decide supported upgrade baseline from real deployment evidence. Preserve historical migrations; use forward migration where possible or a documented backed-up export/transform/import recovery for failing historical paths. Rehearse restore on disposable copies. | High: data | 1–2 d |
| R12 | **P1 — Dependency risk reduction** | R01 | Triage both audit JSONs by actual dependency path/reachability; remove unused model-generator tooling if confirmed unnecessary; targeted compatible patches first, isolated major changes only if required; checks/native SQLite/runtime smoke pass; no unresolved exploitable high/critical risks without an explicit documented release decision. Never `audit fix --force` blindly. | High: native/toolchain | 1–2 d |
| R13 | **P1 — Make lint/setup/session/error handling truthful** | R01, R02, R04 | Fix backend TS glob; resolve actual resulting errors without disabling rules; pin one supported Node/npm range across CI/docs; two-terminal dev startup works; frontend env example; preserve HTTP status in client; session expiry/logout clear user data/cache; sanitize account/errors; handle async failures; restrict deployment origins and rate-limit login. | Medium | 1–1.5 d |
| R14 | **P1 — Integration gates and CV-ready evidence** | R05–R13 | Combine one deduplicated #56/#60 CRUD suite with missing auth/filter/transaction cases; minimal Guest/Admin/Leader browser journeys against real migrated DB; CI builds and smoke-starts output, checks map assets and fresh migrations; README has exact setup/demo limitations/team contributions/license attribution/screenshots; only executed results reported. | Medium | 1.5–2 d |
| R15 | **P1 — Core mobile/keyboard acceptance and honest metrics** | R05, R06, R09 | Main journeys usable at 375 px and desktop; forms/popups labeled, keyboard reachable, focus managed and errors announced; derive stats or hide them; remove/label inert year selector and placeholder routes. Focused acceptance, no redesign. | Medium | 0.5–1 d |
| R16 | **P2 — Asset/bundle cleanup** | R14 | Remove proven unused/duplicate assets, lazy-load heavy routes/map where useful; compare bundle before/after without breaking layouts; keep accessible image alternatives. | Low | 0.5–1 d |
| R17 | **P2 — Editorial/analytics refinements** | v1 released | Implement deferred dashboard/year/featured activity features only against separately accepted requirements and real APIs. | Medium | Estimate after scope |

R01–R15 total approximately **16.5–25 focused engineer-days**, plus maintainer response and external-provider/data decisions. Some tasks can progress in parallel after contract agreement; do not equate parallel work with verified integration. If release time is constrained, reduce visible product scope explicitly instead of shipping mock-backed controls.

## Smallest useful PR sequence

Keep the individual issues above for acceptance and review; group only tightly connected issues. Existing authors' PRs can be retargeted/revised or replaced by focused ports with attribution. All are proposals; no remote PR metadata was changed.

1. **Runtime foundation** — R01 plus the Node/lint/env portion of R13. Proves a built artifact can start. Backend lint findings discovered by the fixed glob stay in this PR only if mechanical; separate substantive behavior fixes.
2. **Authorization and post boundaries** — R02/R03 plus auth-error/session pieces of R13. Reuse #58 and deduplicated #56/#60 tests. Exclude duplicate #59 backend changes. Do not fold DTO/UI changes here.
3. **Read contracts and scoped queries** — R04. Select only useful connect-api routes/services, retain develop login fixes, and settle shared DTOs before frontend integration.
4. **Guest API integration** — R05 plus reusable #56 loading/error/empty UI; port #59 frontend/API/hooks and corrected #61/#62 reads. No `.DS_Store`, duplicate test overwrites or second post client.
5. **Map data and marker binding** — R06. Keep schema/data provenance/marker regression independently reviewable.
6. **Admin management lifecycle** — R07/R08. Campaign/team/account flows share assignment and bootstrap invariants; split only if review exceeds a practical size.
7. **Leader publishing and media persistence** — R09/R10. Reuse the two existing popups and Cloudinary helper; #57 remains held. Preserve unsaved input and implement actual writes.
8. **Release reproducibility and dependency hardening** — R11/R12, with separate commits and full runtime/migration checks. If a dependency fix is needed earlier for a critical reachable issue, move its focused change forward; do not wait for UI work.
9. **Acceptance and documentation** — R14/R15 and remaining R13 cleanup. Run the combined implementation's checks and record screenshots/limits. No new product features.

Then one **release-promotion PR** from the verified develop snapshot to main. Nine implementation PRs are the proposed minimum coherent review units for the current scope; avoid a single multi-branch integration PR. No PR should claim another PR's CI as its own validation.

## Git and release strategy

- Reuse the current clean checkout. For future implementation, branch from freshly fetched develop using `codex/<issue-topic>`; do not advance local main, rewrite team branches or delete stale refs as part of this work.
- Retarget #56/#60/#61 to develop only after authors agree and the exact feature diffs are confirmed. Their current huge PR diffs mostly include develop history. Retargeting alone does not resolve overlapping tests/contracts. Prefer new focused branches/ports if authors' branches should remain untouched.
- Use `git diff origin/develop...<head>` and commit ancestry to select feature patches. Attribute reused commits/authors. A whole cherry-pick is appropriate only when its complete diff is in scope; otherwise port specific reviewed changes into a fresh develop-based branch.
- In particular, never merge connect-api wholesale: it is six develop commits behind and changes 35 files, response shapes, roles, seed data and schema. Preserve cacaaea's login/API base/env fixes and integrated logout behavior.
- Require review per existing CONTRIBUTING/CODEOWNERS guidance and checks on each updated integration result. Actual GitHub protection settings are unverified; confirm them before release. Re-run checks after every conflict resolution or contract-affecting change.
- Once accepted, freeze a specific develop SHA and open the main promotion PR. Historical main's unique merge commit must be preserved by ordinary Git ancestry; no force reset, migration rewrite or blind merge of old feature branches. Revalidate the final merge result. Create annotated `v1.0.0` tag/release and deploy only after explicit authorization.
- Before schema-changing deployment: verified backup, documented target DB path, staged migration rehearsal and tested restore. A Git revert alone is not a database rollback. The failing historical upgrade path must be resolved or excluded by an explicit supported-baseline decision backed by deployed-state evidence.

## Release acceptance checklist

- [ ] Exact source SHA, Node/npm versions and environment examples recorded; fresh clone installs with `npm ci` and leaves tracked files unchanged.
- [ ] Lint actually covers backend/frontend TS; all workspace typechecks, deduplicated tests and build pass on the **combined release candidate**, under CI's supported Node version.
- [ ] Built shared/backend output runs with Node directly; production start reaches DB-aware readiness/health; frontend uses deployed API origin/proxy and deep routes reload.
- [ ] Fresh SQLite migration chain and deterministic demo seed pass twice; schema/FK checks pass; existing DB upgrade path and backup/restore rehearsal documented. No existing migration rewritten casually.
- [ ] Anonymous read, Admin write, Leader own-team and cross-team denial matrix exercised; spoofed author, expired token, deactivated account and changed role tested.
- [ ] Admin creates campaign -> Leader account -> team assignment -> Leader logs in -> creates/edits/deletes post -> Guest sees correct scoped result and gallery after reload.
- [ ] Failed validation/network/upload/DB write shows accurate errors, retains user input, does not produce false success or partial DB data; cache updates and logout isolation verified.
- [ ] Map assets resolve in a fresh build with source/license attribution; markers correspond to persisted coordinates and correct post IDs; two-marker selection regression passes; missing assets/coordinates handled.
- [ ] One configured media path works; provider limits/preset verified; no default production passwords, account dumps, exposed hashes, secrets or unauthenticated upload/reorder endpoint.
- [ ] Full/production dependency audit triaged; reachable high/critical issues resolved or explicitly accepted with evidence. Development-only advisories are not mislabeled as production exploits.
- [ ] Core mobile/keyboard journeys pass; stats and year controls reflect real behavior; mock imports/no-op controls excluded from shipped journeys; P2 exclusions documented.
- [ ] README setup/demo/features/limitations/team credit/screenshots and migration/run/recovery guide match executed behavior; CI links reference exact candidate SHA. No claim of live acceptance based only on isolated PR checks.
- [ ] Reviewer approves candidate and changelog; user explicitly authorizes promotion/tag/publish/deploy actions. Rollback/restore owner is identified before release.

Phase 00 ends with these documents. No implementation, issue creation, PR retargeting, merging or deployment is authorized by this plan alone.
