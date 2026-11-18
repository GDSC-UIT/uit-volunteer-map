# Local v1 release candidate — readiness handoff

Date: **2026-11-19**. Working branch: `feat/v1-release-candidate`, continuing R14 → R15 → R16. This is the completed **local MVP candidate**, not a published release or a production approval. No push, PR, merge, tag or deployment was performed.

Candidate closure source commits: `c5d841c` (read-only database readiness) and `5bbec46` (footer navigation and integrated gates). Final assertions reference exact source `5bbec46316ea31982f49c1dbbc66a0acc4ddcbc4`; the last commit adds documentation/evidence only.

## Completed implementation

| Workstream | Local result and evidence |
|---|---|
| R01–R04 runtime, access, ownership and read contracts | Current compiled shared/backend, fixed DB configuration, actual account/role checks, server-derived actor, scoped campaign/team/post reads. Covered by the combined backend suite and migrated API chain; see [R03](handoffs/R03.md), [R04](handoffs/R04.md), [R13](handoffs/R13.md). |
| R05–R06 Guest/data/map | Real API-backed reads, reloadable links, ordered galleries, validated persisted coordinates and two distinct keyboard-selectable map markers with packaged/provenanced geometry. [R05](handoffs/R05.md), [R06](handoffs/R06.md), current browser gate. |
| R07–R10 Admin/Leader/media lifecycle | Campaign/account/team provisioning and coherent assignment, Leader login/own-team publishing/edit/delete, cross-team denials and transactional media rollback. [R07](handoffs/R07.md), [R08](handoffs/R08.md), [R09](handoffs/R09.md), [R10](handoffs/R10.md). |
| R11–R14 release foundations | Migration/seed/backup/recovery tooling, dependency triage, runtime pins, real lint/session/error/origin/login policy and reproducible CI/browser gates. [R11](handoffs/R11.md), [R12](handoffs/R12.md), [R13](handoffs/R13.md), [R14](handoffs/R14.md). |
| R15 core acceptance | Exact API metrics, stationary/controllable homepage carousel with existing packaged photographs, no inert year control, working dashboard links, responsive team navigation, labeled forms, native modal keyboard/focus and logout isolation. [R15 evidence/screenshots](handoffs/R15.md). |
| R16 bounded performance | Deferred route pages, loading/error/reload recovery, initial JS entry reduced by about **34%**, without increasing the warning threshold. Cold homepage and failed-chunk recovery verified in the real browser. [R16](handoffs/R16.md). |
| Final readiness/navigation closure | Health checks actual initialized/reachable DB and current registered migration ledger; returns **503** before initialization/migrations and **200** after all 15 migrations. Probe is read-only and does not create a ledger, run migrations or expose driver details. Homepage campaign anchors move scroll/focus correctly, including navigation from another page. |

R17 advanced analytics/editorial work remains intentionally deferred by the v1 boundary. No additional product feature or fabricated metric was introduced to fill a placeholder. No broad duplicate-asset purge, HTML prototype or unrelated code change was performed.

## Final executed acceptance

Environment: Windows, **Node 24.22.3 / npm 11.19.1 / Playwright 1.65.1**, matching the checked-in pins. The installed dependency graph is unchanged since R14's successful clean install; that evidence is reused. Current production business dependency versions, migration files and map identity/loading code were not changed by this completion.

- **443 tests PASS: 318 backend + 125 frontend.** New readiness cases cover disconnected/query-failure, missing/unknown/duplicate/malformed ledger and complete current state; R15 adds carousel timing and absent/zero/current metric cases. No tests/rules were disabled.
- Current lint, all workspace typechecks, full build and source/built map/homepage asset checks PASS. Final build measurements are recorded in the [candidate summary](../output/verification/release-candidate/results.json).
- Current compiled runtime smoke PASS: real migration chain (15), seed, DB-aware healthy HTTP 200 and owned-process/DB cleanup. R14's successful populated upgrade, backup/WAL/restore and historical recovery rehearsal is reused because those backend/migration/tool sources are unchanged.
- Current migrated API gate PASS: real file-backed DB, restart and repeated seed; full provisioning chain; scoped filters, current role/expiry/deactivation and unchanged DB on denied writes; natural unique-photo failure rolls back related writes.
- Guest → Admin → newly provisioned Leader → Guest publishing/reload/edit/delete and focused keyboard/mobile acceptance PASS at **375×667 and 1440×900**. The actual HTML/app/API/provider code runs; no API/provider response mocks or real upload are used. Optional existing Google Fonts are blocked for offline rendering; packaged artwork is real.
- Current readiness gate observes **503 → 503 → 200** across uninitialized DB, initialized/unmigrated DB and migrated DB, and compares schema before/after the probe to assert no ledger/schema writes.
- Current failed-JavaScript-asset check shows a safe focused error page and successfully reloads the actual restored chunk. Application API failures/uncaught errors are absent outside explicitly asserted bad-credential requests; deliberate asset failures are recorded separately.
- Owned browsers/servers/disposable DB/runtime downloads removed; developer DB/WAL/SHM unchanged. Protected untracked files and prototypes retained. The final results include script hashes and source revision.

Evidence: [tests](../output/verification/release-candidate/tests.log), [lint](../output/verification/release-candidate/lint.log), [typechecks](../output/verification/release-candidate/typecheck.log), [build](../output/verification/release-candidate/build.log), [assets](../output/verification/release-candidate/assets.log), [compiled smoke](../output/verification/release-candidate/smoke.log), [journey log](../output/verification/release-candidate/journeys.log), [readiness/API/browser assertions](../output/playwright/release-candidate/results.json).

Replay uses the exact commands in [README](../README.md). `npm run test:journeys` builds by default and owns its test data/services; select `RELEASE_EVIDENCE_DIR=output/playwright/release-candidate` for this evidence folder. CI runs the same gates on published PRs and saves only its current-run artifacts. No remote/Linux CI result is claimed for this unpushed candidate.

## Production promotion requirements

These decisions need the real deployment configuration/operator/maintainer; local demo acceptance does not supply them:

1. **Database inventory and restore owner.** Identify the real DB path/ledger/schema, take a verified backup and select the tested supported upgrade/recovery path in [the migration guide](../packages/backend/MIGRATIONS.md). No deployed DB was accessed here. Health 503 signals an unavailable/uninitialized/non-current DB; it never repairs or upgrades one.
2. **Production identities and secrets.** Rotate/deactivate legacy bootstrap credentials and provision the intended private Admin identity before exposure. Opt-in demo passwords/data are only for isolated non-production use. Set a private random JWT secret (32+ characters), explicit frontend `CORS_ORIGINS`, API URL/proxy and intentional backend HOST binding.
3. **Media provider.** Verify the actual Cloudinary unsigned preset/file/folder limits and provider orphan-cleanup procedure. No live preset/upload was validated. Database rollback does not remove an external provider object.
4. **Hosting and request policy.** Configure deep-route fallback and hashed static assets. Choose the trusted proxy topology and shared throttling policy before multiple replicas; the current bounded login budget is process-local and uses socket IP.
5. **Rights and risk decision.** Confirm application/artwork redistribution rights; no root license grant was invented. Review the retained [R12 advisory triage](handoffs/R12.md) and make an explicit release decision for remaining findings. This handoff makes no new audit-clean or blanket accessibility/security certification.
6. **Review and publish authorization.** Review the local candidate, run actual remote CI on the eventual integration result, then explicitly authorize publishing/merging/tagging/deployment. No existing shared commit was rewritten and no PR was merged here.

No further R01–R15 core implementation task is being deferred as a substitute for these deployment decisions. Optional post-v1 work remains separate from the completed local MVP.
