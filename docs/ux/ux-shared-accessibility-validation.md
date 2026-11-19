# UIT Volunteer Map — Shared accessibility validation

Implementation/browser evidence: **14 November 2026**. Finalization: **15 November 2026 (Asia/Bangkok)**.

Branch: `feat/ux-shared-accessibility`. Base: `feat/ux-responsive-foundations` at `b8c0226794ca84ca5a6723c81fee0ab2f9fc8b70`. Frontend-only implementation; no dependency, backend, API contract or database changes. Phase 2 remains local; no push, PR or merge.

## Phase 1 finalization

[PR #64 — fix(ui): improve responsive login, navigation and admin layouts](https://github.com/GDSC-UIT/uit-volunteer-map/pull/64) targets `develop`, remains open and unmerged. It contains **five commits**, not four: `392a558`, `665c4bf`, `1f9c59c`, `96b22eb` implement the changes; `b8c0226` adds the validation report and evidence. The original report's four-row table covered implementation only. The PR description explicitly reconciles this and explains that the report's no-push statement described its original handoff.

Phase 1 source/evidence were reviewed and reused without rerunning its unchanged tests. The branch was pushed without rewriting commits. [CI run 178](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/43559568242) succeeded: **Lint, Test, Type Check and Build**. Status rechecked on 15 November. Phase 1 remains frozen at the base above.

## Inputs and visual preservation

Read the existing [audit](ux-audit-v1.md), [proposal](ux-improvement-proposal.md), [responsive validation](ux-responsive-foundations-validation.md) and React frontend. The first two documents are pre-existing untracked work and are intentionally not added by this workstream.

Inspected [original Figma page 311:770](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=311-770) metadata and the full [delete confirmation 1556:36789](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=1556-36789) design context/render. Existing React styling remains the implementation baseline: warm confirmation surfaces, amber actions, red popup bars, blue login, original logos/artwork and typography are retained. Mobile editor/guest columns stack to make existing content reachable. Destructive button wording is explicit, with safe initial focus.

Applied the installed UI/UX Pro Max skill at `C:/Users/Paul/.gemini/config/skills/ui-ux-pro-max/SKILL.md`. Its search CLI failed with a Python f-string compatibility error; the skill and accessibility/interaction CSV guidance were read directly. No generated replacement palette or type system was adopted. `prototypes/ux-v1/` was neither read nor modified, and no HTML prototype was created.

## Resolved findings and implementation

| Finding | Implemented behavior |
|---|---|
| **UX-011** | `FloatingInput` retains stable associated labels and adds autocomplete, name, required, invalid/error descriptions. Login identifies username/current password and associates its announced failure with both fields. Formation/editor fields, year selector and account search have names. Global two-tone keyboard focus supplements existing control styling. |
| **UX-023** | Shared native `Dialog` provides an accessible name, browser top layer/background isolation, initial focus, Tab/Shift+Tab containment, Escape, focus restoration and body scroll locking. All seven popup components use it. Delete/logout start on Hủy; deleted item is identified. Dialog bounds use dynamic viewport height and internal scrolling. |
| **UX-015** | Image tiles are native keyboard-operable buttons with filename, pressed state and selection order. Selected check/order badges and the visible count agree. The selection limit has an announced explanation. |
| **UX-016** | Both selection stages expose Hủy; choose also has Quay lại. Invalid files are identified. Recoverable upload errors preserve local files, selected order and successful upload URLs; retries send only unsuccessful files. Preview URLs are released on unmount. Late upload completion cannot reopen the editor after closing. |
| **UX-024** | Dark blue/gray labels replace low-contrast light-gray/cyan label text; active field border uses dark blue. Amber completion/publish actions use dark foregrounds. Seasonal maroon strengthens active navigation, statistics and event location text. Picker, header and error text preserve readable contrast. |
| **UX-027** | Document language is Vietnamese. Home/campaign receive meaningful h1s; background layout supplies one main landmark outside the footer, without nested campaign main. Fallback/authorization screens gain main landmarks. Meaningful logos/images and icon-only controls are named; decorative pins/frames/backgrounds/hearts are silenced. |

The upload/editor pair stays mounted while changing steps so Back retains the existing draft title/body and selected images. The character count now reflects content and its existing 3000-character UI limit. This supports error recovery; it adds no server-side drafts or publishing capability. Existing unfinished publish, formation save, share, logout-state and management integration behavior is not represented as fixed.

## Validation

| Check | Result |
|---|---|
| `npm run test:run -w @uit-volunteer-map/frontend` | **PASS: 10 tests / 5 files** (3 existing auth tests, 7 new behavior tests). jsdom stubs native dialog methods; it does not prove browser inertness. |
| `npm run lint -w @uit-volunteer-map/frontend` | **PASS**. |
| `npm run build:frontend` | **PASS**, including shared build and frontend TypeScript/Vite compilation. Existing >500 kB bundle warning remains. |
| `git diff --check` | **PASS**. |
| Browser matrix | **42 grouped checks passed** across 375×900, 768×900, 1024×900, 1440×900, 375×667 and 375×400. Includes login, five reachable popup types, keyboard selection/count/limit, step focus, forward/reverse trapping, Escape, restoration, background focus isolation and dialog bounds. |
| Recovery browser checks | **4 grouped checks passed** at 375×667 and the other three requested widths. Simulated first-file success/second-file failure; retry sends only the second file. Back preserves text and images and causes no duplicate uploads. Editor keyboard containment, bounds and restoration passed. |
| Guest detail browser checks | **4 grouped checks passed** at 375×667 and the other three widths. Mounted the actual component with a synthetic long post, because existing map data failures prevent its normal trigger. Verified name, slider, image alternatives, focus, Escape and bounds. Campaign has one main and one h1. |
| Contrast | Eight explicit foreground/background source-color pairs pass 4.5:1; see [calculated results](../../output/playwright/ux-shared-accessibility/contrast.json). This is targeted calculation, not a whole-page conformance scan. |

Browser evidence was captured in isolated Chrome against Vite on `http://127.0.0.1:3014`, not a prototype. The 375×400 case is a reduced viewport-height simulation, not a physical virtual-keyboard test. Existing untracked files remain excluded. The small final fallback/hover-card semantics/color changes are source/check validated; they do not alter the browser-tested dialog or form paths.

All leader sessions used synthetic local role state and an invalid token. Backend API requests were intercepted; real Cloudinary requests were blocked. Recovery checks replaced only the frontend upload transport in browser memory; the real UI and batch/retry logic executed. **No real uploads, publishing, deletion, logout, database or shared-data mutation was performed.**

The draft retention unit test can emit a React `act` warning under the current jsdom/React test stack while passing; the same draft/Back behavior also passed in Chrome. Browser console includes pre-existing missing GeoJSON errors and deliberately intercepted login failures. No clean-backend or real map-data claim is made.

## Focused independent review

One independent read-only review covered keyboard, focus lifecycle, small-screen overflow, semantics and behavior changes. Four confirmed issues were fixed before final browser verification:

1. Unlayered dialog color overrode the dark picker's white text: removed the shell foreground override.
2. Background main initially nested the campaign main: replaced the inner wrapper and added the campaign h1.
3. Formation minimum height overrode viewport bounds on short screens: replaced it with a constrained preferred height; 375×400 passed.
4. Changing image-picker stages removed the focused button: focus now moves to a persistent count/instructions element on stage changes.

No additional confirmed cache/draft regression was reported. Review was followed by the focused browser matrix, not repeated broad audits.

## Screenshots and reproduction

**48 screenshots** are included. Filenames explicitly distinguish synthetic role state, simulated upload/error behavior and the guest component harness. They are current-state verification captures, not new before/after evidence for Phase 1.

| Surface | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| Login failure | [375px](../../output/playwright/ux-shared-accessibility/login-simulated-error-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/login-simulated-error-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/login-simulated-error-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/login-simulated-error-1440x900.png) |
| Formation editor | [375px](../../output/playwright/ux-shared-accessibility/formation-synthetic-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/formation-synthetic-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/formation-synthetic-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/formation-synthetic-1440x900.png) |
| Commander editor | [375px](../../output/playwright/ux-shared-accessibility/commander-synthetic-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/commander-synthetic-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/commander-synthetic-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/commander-synthetic-1440x900.png) |
| Delete confirmation | [375px](../../output/playwright/ux-shared-accessibility/delete-synthetic-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/delete-synthetic-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/delete-synthetic-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/delete-synthetic-1440x900.png) |
| Image picker | [375px](../../output/playwright/ux-shared-accessibility/picker-select-synthetic-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/picker-select-synthetic-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/picker-select-synthetic-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/picker-select-synthetic-1440x900.png) |
| Selection limit | [375px](../../output/playwright/ux-shared-accessibility/picker-limit-synthetic-375x900.png) | [768px](../../output/playwright/ux-shared-accessibility/picker-limit-synthetic-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/picker-limit-synthetic-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/picker-limit-synthetic-1440x900.png) |
| Partial upload failure | [375px](../../output/playwright/ux-shared-accessibility/upload-failure-simulated-375x667.png) | [768px](../../output/playwright/ux-shared-accessibility/upload-failure-simulated-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/upload-failure-simulated-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/upload-failure-simulated-1440x900.png) |
| Retained draft | [375px](../../output/playwright/ux-shared-accessibility/editor-draft-simulated-375x667.png) | [768px](../../output/playwright/ux-shared-accessibility/editor-draft-simulated-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/editor-draft-simulated-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/editor-draft-simulated-1440x900.png) |
| Guest detail harness | [375px](../../output/playwright/ux-shared-accessibility/guest-component-simulated-375x667.png) | [768px](../../output/playwright/ux-shared-accessibility/guest-component-simulated-768x900.png) | [1024px](../../output/playwright/ux-shared-accessibility/guest-component-simulated-1024x900.png) | [1440px](../../output/playwright/ux-shared-accessibility/guest-component-simulated-1440x900.png) |

Short-screen examples: [formation 375×400](../../output/playwright/ux-shared-accessibility/formation-synthetic-375x400.png), [picker 375×667](../../output/playwright/ux-shared-accessibility/picker-select-synthetic-375x667.png), [selection limit 375×400](../../output/playwright/ux-shared-accessibility/picker-limit-synthetic-375x400.png). Dialog geometry and screenshots were inspected, including mobile and desktop views.

Machine-readable evidence: [matrix (42)](../../output/playwright/ux-shared-accessibility/browser-matrix.json), [recovery (4)](../../output/playwright/ux-shared-accessibility/browser-recovery.json), [guest harness (4)](../../output/playwright/ux-shared-accessibility/browser-guest.json).

Reproduce with local Vite on port 3014 and an isolated Playwright CLI Chrome session. Run the snippets sequentially with `playwright-cli -s=ux-accessibility run-code --filename <path>`: [matrix](../../output/playwright/ux-shared-accessibility/verify.cjs), then [recovery](../../output/playwright/ux-shared-accessibility/verify-recovery.cjs), then [guest harness](../../output/playwright/ux-shared-accessibility/verify-guest.cjs). Open the local page first. The later scripts reuse the first script's request blocks and synthetic session. Five local SVG fixtures accompany them. The guest harness uses Vite's React dependency modules and is for this development environment only.

## Commit history

Phase 2 has **four implementation commits plus this report/evidence commit**. The documentation commit's own hash is deliberately not embedded in its contents; retrieve it with `git log feat/ux-responsive-foundations..feat/ux-shared-accessibility`.

| Commit | Scope |
|---|---|
| `ef2e682` | Native shared dialog, popup migration, safe focus/scroll lifecycle and dialog tests. |
| `2e5ca5a` | Keyboard image picker, recoverable uploads, retained draft and interaction tests. |
| `3f34e9a` | Labeled forms, autocomplete, contrast, headings, landmarks and image/control alternatives. |
| `eef5d1d` | Fallback page landmarks and readable fallback/event text. |

No Phase 1 commit was modified after branching. No Phase 2 push, PR, merge, force-push or dependency installation was performed.

## Remaining limitations and next workstream

- Physical phones, real virtual keyboards, Safari/Firefox and screen readers are not certified. Native dialog behavior was exercised in Chrome only; no WCAG-wide conformance claim.
- Cancel prevents later UI completion and releases previews, but the existing upload API has no abort contract: an already-sent request can continue. Real partial uploads and network cancellation remain unverified.
- Existing API adapters, missing GeoJSON, guest post routing/data attribution, real publishing/save behavior, admin controls and logout context synchronization remain separate integration work. No backend contract was changed to conceal these gaps.
- Existing campaign map/statistics/team clipping, leader gallery layout, automatic motion, placeholder branding and account-table semantics remain outside this shared-accessibility scope. The report does not imply all UX findings are resolved.
- The old untracked audit/proposal/evidence and prototype directories were preserved, not included in commits.
- The skill's Python CLI incompatibility and existing production bundle warning remain. These did not block direct skill guidance or frontend validation.

**Recommended next UX task:** responsive campaign/team content (remaining UX-008 and UX-014). Reuse the Phase 1 navigation offsets and this dialog/input behavior; preserve the Figma seasonal artwork while reflowing the existing map/statistics, team timeline and leader gallery. Verify actual child bounds, not just document scrollWidth. Resolve/verify the existing map asset and data contracts before claiming live map or publishing acceptance. Shared loading/error/data work (UX-025 and release-blocking integration findings) should follow a confirmed API contract.

## Changed source files

- `packages/frontend/index.html`
- `packages/frontend/src/components/dropdown/LeaderDropdown.tsx`
- `packages/frontend/src/components/layouts/BackgroundLayout.tsx`
- `packages/frontend/src/components/layouts/GuestHeader.tsx`
- `packages/frontend/src/components/layouts/MyTeamPageHeader.tsx`
- `packages/frontend/src/components/layouts/TimeSelect.tsx`
- `packages/frontend/src/components/ui/Dialog.test.tsx`
- `packages/frontend/src/components/ui/Dialog.tsx`
- `packages/frontend/src/components/ui/FloatingInput.test.tsx`
- `packages/frontend/src/components/ui/FloatingInput.tsx`
- `packages/frontend/src/components/ui/PostItem.tsx`
- `packages/frontend/src/components/ui/TeamItem.tsx`
- `packages/frontend/src/components/ui/popups/ConfirmDeletePopup.tsx`
- `packages/frontend/src/components/ui/popups/FormationEditOverall.tsx`
- `packages/frontend/src/components/ui/popups/FormationEditRole.tsx`
- `packages/frontend/src/components/ui/popups/LogoutConfirmPopup.tsx`
- `packages/frontend/src/components/ui/popups/post/EventCard.tsx`
- `packages/frontend/src/components/ui/popups/post/GuestPostOverPlay.tsx`
- `packages/frontend/src/components/ui/popups/post/PostCreatePopup.test.tsx`
- `packages/frontend/src/components/ui/popups/post/PostCreatePopup.tsx`
- `packages/frontend/src/components/ui/popups/post/PostDetailPopup.test.tsx`
- `packages/frontend/src/components/ui/popups/post/PostDetailPopup.tsx`
- `packages/frontend/src/index.css`
- `packages/frontend/src/pages/CampaignPage.tsx`
- `packages/frontend/src/pages/HomePage.tsx`
- `packages/frontend/src/pages/LoginPage.tsx`
- `packages/frontend/src/pages/NotFoundPage.tsx`
- `packages/frontend/src/pages/TeamPage.tsx`
- `packages/frontend/src/pages/admin/AccountManagementPage.tsx`
- `packages/frontend/src/pages/admin/TeamManagementPage.tsx`
- `packages/frontend/src/pages/leader/MyTeamPage.tsx`
- `packages/frontend/src/routes/ProtectedRoute.tsx`
- `packages/frontend/src/styles/statistic.css`
- `packages/frontend/src/test/dialog.ts`
