# Campaign and team responsive validation

Date: 15 November 2026 (Asia/Bangkok).
Branch: `feat/ux-campaign-team-responsive`, based on `feat/ux-shared-accessibility` at `7b723bcab8ce79f1a8eb0b84b0126554404c2906`.

## Published accessibility stack

[PR #65](https://github.com/GDSC-UIT/uit-volunteer-map/pull/65), **fix(ui): improve shared accessibility and keyboard interactions**, targets `feat/ux-responsive-foundations`. The five accessibility commits were inspected and pushed unchanged; their merge base is `b8c0226`. Reused the existing successful 10-test, lint/build, 50-group browser and 48-screenshot evidence because no accessibility source had changed. [CI run 180](https://github.com/GDSC-UIT/uit-volunteer-map/actions/runs/43734779815) completed successfully. PR #64 and #65 were not merged. The earlier report's local-only wording records its original handoff, before this publication.

## Sources and preserved identity

Read [audit](ux-audit-v1.md), [proposal](ux-improvement-proposal.md), current React components and installed UI/UX Pro Max guidance. Inspected original Figma renders for [map/statistics 1595:36834](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=1595-36834) and [team 1048:33131](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=1048-33131). These are desktop visual references; mobile reflow is an adaptation. Preserved the shipped map artwork, flowers/pin timeline, portrait frames, warm canvas, campaign logo, typography, card gradient, section order and desktop overlapping leader gallery. UI/UX Pro Max informed reflow, visible controls and touch targets; it did not replace the visual identity. Its previously observed Python search incompatibility was avoided by reading its guidance directly.

No prototype files were read or modified. No dependency, API, backend, database, marker identity, map fetch/loading or persistence change was made.

## Resolved findings

- **UX-008, remaining responsive portion:** map viewport and artwork now share one 1280:1080 ratio. Leaflet fills the inset parent instead of using 80vw/80vh and receives ResizeObserver size invalidation without panning. Year selection is in normal flow. Statistics stack below the map below 1280px; timeline gutters, heading sizes, metadata and photo/link layout reflow on smaller screens. Team gallery scales its slots, portraits stack below 480px, descriptions/titles wrap, and activity cards have shrinkable text containers.
- **UX-014:** leader gallery uses a fluid main image plus two side slots below 1024px; desktop retains the overlapping 440/260px composition. Commander controls fit, activity cards use fewer columns, gallery edit has a visible labeled target, and 44px edit/delete controls live in a permanent action row without covering the primary post link. Existing handlers and route destinations are preserved.

These resolve scoped layout/access defects; missing real data, map assets, persistence and post routes remain separate findings.

## Changes and commits

| Commit | Scope |
|---|---|
| `dda8607` | Campaign map/frame/statistics, resize notification, year layout, timeline, shared card wrapping and responsive styles. |
| `faa05e3` | Public team gallery/portraits and mobile leader gallery/action placement. |
| `211592c` | Keep map viewport and zoom controls above campaign decoration. |
| Report/evidence commit | This report, screenshots and reproducible browser scripts; obtain its hash from branch history. |

Changed components: `CampaignPage`, `MapView` (dimensions/resize only), `Statistic`, `TimeSelect`, `TeamItem`, `PostItem`, `TeamPage`, `MyTeamPage`, and `index.css`. Three small implementation commits plus documentation; shared commits were not rewritten. Phase 2 remains local, with no push or PR.

## Checks

| Check | Result |
|---|---|
| Frontend tests | **PASS 10/10**, five files. Existing React act warning remains in draft test. Browser interactions provide the targeted responsive behavior coverage; no CSS-class-only tests added. |
| Frontend lint | **PASS**. |
| `npm run build:frontend` | **PASS**, including shared TypeScript and frontend TypeScript/Vite. Existing >500kB chunk warning; final JS ~605.27kB, gzip ~189.21kB. |
| `git diff --check` | **PASS**. |
| Focused browser checks | **PASS at all five viewports:** 375×900, 768×900, 1024×900, 1440×900 and 375×667. |

[Browser results](../../output/playwright/ux-campaign-team-responsive/verification.json) check actual map/frame/statistics/text/card bounds, loaded artwork and aspect ratio, reachable zoom/year controls, container resize, long Vietnamese timeline/team titles (temporary DOM fixtures), public gallery/portrait bounds, all leader action bounds, pointer hit testing, keyboard delete-dialog activation/Escape/focus restoration, formation/commander dialogs and unchanged edit destination. Existing data adapters return mock records; leader uses synthetic role state with an invalid token. No upload, publish, save or delete was submitted.

Document width is not sufficient proof of visibility: baseline also reported no horizontal overflow because ancestors hide it. Final checks measure content itself. Leaflet's intentionally movable internal pan canvas is excluded from scrollWidth assertions; its visible container and controls are checked. Desktop gallery's intentional side-panel overlap is measured on each child rather than treating parent scrollWidth as failure. Resize checking confirms continued container fit; live geographic marker correctness is not claimed.

During visual verification, the opaque frame layer initially hid map controls and an overly rounded viewport could clip zoom. The campaign decoration layer could also overlap the desktop zoom control; the frame now has an explicit layer above that decoration. These were corrected before the final captures/checks: artwork now sits behind Leaflet and the inset has modest corners. This does not alter geographic loading or marker behavior.

## Screenshots

**38 PNG captures** from real Chrome at local Vite port 3015 (15 before, 15 after, 5 scrolled timeline and 3 focused detail captures). Baseline is the unchanged accessibility head before source edits. Matching before/after captures cover campaign, public team and synthetic leader at every requested width and short mobile height. Viewport dimensions are encoded in filenames; full-page images are taller than the viewport. Timeline scroll animation intentionally hides offscreen cards in full-page captures, so supplemental after timeline viewport captures show the actual scrolled content. Dynamic animation, remote images and asynchronous mock-list timing can differ; no pixel-diff claim. Public team initial captures show the gallery/portraits before delayed activity records; populated cards are covered by the focused checks.

### Campaign

| Viewport | Before | After |
|---|---|---|
| 375×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-campaign-375x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-campaign-375x900.png) |
| 768×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-campaign-768x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-campaign-768x900.png) |
| 1024×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-campaign-1024x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-campaign-1024x900.png) |
| 1440×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-campaign-1440x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-campaign-1440x900.png) |
| 375×667 | [Before](../../output/playwright/ux-campaign-team-responsive/before-campaign-375x667.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-campaign-375x667.png) |
### Team

| Viewport | Before | After |
|---|---|---|
| 375×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-team-375x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-team-375x900.png) |
| 768×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-team-768x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-team-768x900.png) |
| 1024×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-team-1024x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-team-1024x900.png) |
| 1440×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-team-1440x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-team-1440x900.png) |
| 375×667 | [Before](../../output/playwright/ux-campaign-team-responsive/before-team-375x667.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-team-375x667.png) |
### Leader

| Viewport | Before | After |
|---|---|---|
| 375×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-leader-375x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-leader-375x900.png) |
| 768×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-leader-768x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-leader-768x900.png) |
| 1024×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-leader-1024x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-leader-1024x900.png) |
| 1440×900 | [Before](../../output/playwright/ux-campaign-team-responsive/before-leader-1440x900.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-leader-1440x900.png) |
| 375×667 | [Before](../../output/playwright/ux-campaign-team-responsive/before-leader-375x667.png) | [After](../../output/playwright/ux-campaign-team-responsive/after-leader-375x667.png) |

Focused final captures: [mobile map](../../output/playwright/ux-campaign-team-responsive/after-map-375.png), [desktop map](../../output/playwright/ux-campaign-team-responsive/after-map-1440.png), [populated mobile activities](../../output/playwright/ux-campaign-team-responsive/after-team-activities-375.png).

Scrolled timeline examples: [375×667](../../output/playwright/ux-campaign-team-responsive/after-timeline-375x667.png), [768](../../output/playwright/ux-campaign-team-responsive/after-timeline-768x900.png), [1440](../../output/playwright/ux-campaign-team-responsive/after-timeline-1440x900.png).

Reproduction: run Vite on port 3015 and open an isolated Playwright CLI Chrome session. Run [capture.cjs](../../output/playwright/ux-campaign-team-responsive/capture.cjs) through `playwright-cli run-code --filename ...`; initial URL `?capture=before` or `?capture=after` chooses filenames. Only use before on the recorded base revision. Run [verify.cjs](../../output/playwright/ux-campaign-team-responsive/verify.cjs) for checks. Scripts operate only on local browser state. [Baseline geometry](../../output/playwright/ux-campaign-team-responsive/before.json) and [final geometry](../../output/playwright/ux-campaign-team-responsive/after.json) record document width, with the caveat above.

## Remaining dependencies

- Missing GeoJSON and pre-existing map console errors remain; no live map data/marker acceptance. Year selection retains its existing client-only behavior. This package changes layout/resize notification only.
- Existing mock adapters, unscoped activity data, placeholder gallery/commander content, unsupported post destinations, formation save, publishing and backend persistence remain. Edit links keep their previous destinations; validating href is not proof those routes work.
- Physical phones/virtual keyboards, Safari/Firefox and real authenticated flows are unverified. Chrome 375×667 is viewport simulation.
- Existing offscreen timeline fading, general reduced-motion work, bundle warning, React test warning and remote image failures remain. Decorative overflow hiding remains on background artwork; final content bounds were verified independently.
- Pre-existing untracked audit/proposal/evidence and all prototype files were preserved and excluded from commits.
- Next task: verify the map asset/data and post-route contracts, then address release-blocking discovery/detail integration and honest loading/error states. Keep the shared accessibility stack based on PR #64 until its integration is ready.
