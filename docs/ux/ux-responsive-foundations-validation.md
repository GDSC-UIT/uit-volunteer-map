# Responsive Foundations — implementation and validation

Date: **14 November 2026 (Asia/Bangkok)**. Branch: `feat/ux-responsive-foundations`.

Implemented the four approved responsive areas using the existing React components and Tailwind styles. No backend, API, database, auth rules, dependencies, map layout, or unrelated screen redesign was changed. Previously generated HTML prototypes were not read or used.

## Baseline and local commits

GitHub comparison and a fresh fetch confirmed R01 (`b48f9cb`, PR #63) is merged into `develop`. The feature branch starts at `9f2bb21547cc04e939d3ba78dcd093ef859f6772`, the latest `origin/develop` when work began.

| Local commit | Scope |
|---|---|
| `392a558` | Responsive login card/fields; associated labels, keyboard focus and password-reveal naming in the existing field/form. |
| `665c4bf` | Responsive Guest/Public Headers; route-aware campaign section links and measured sticky-header scroll offsets. |
| `1f9c59c` | Footer columns, shrinkable text and wrapping contacts/credits. |
| `96b22eb` | Admin shell, wrapping campaign tabs/toolbars and locally scrollable account grid. |

No push, PR creation, merge, or deployment was performed. Pre-existing untracked UX documents and prototype files were preserved and excluded from implementation commits.

## Resolved findings

| Audit finding | Result |
|---|---|
| **UX-007** | Campaign navigation/login no longer overlap at 375px. The three section links remain visible in a second mobile row, return from Team to the correct campaign section, and respect the current sticky-header height. Logos are navigation links; active links expose current-location state. Public Header retains a readable logo/login arrangement. |
| **UX-008 — footer portion only** | Long email/address/Facebook text stays inside the footer. Columns stack below 1024px and remain three columns at desktop widths; credits can wrap. Other UX-008 campaign/team layout defects are outside this package. |
| **UX-010** | Login uses normal flow and fluid fields. At 375px, fields are 295px wide and begin at x=40px; at 768/1024/1440px they retain the desktop 560px width. Error text expands the card above the fields rather than overlapping them. |
| **UX-021** | Admin navigation stacks above the main panel below 1024px. The main panel is 343px wide at 375px; tabs/search/actions wrap. Account columns remain readable through a labeled, keyboard-scrollable local region, with a mobile scrolling hint. |

Label associations, focus treatment and named password reveal support the scoped login work. This does not claim full resolution of the audit's broader UX-011 accessibility finding.

## Visual reference comparison

Used the [proposal](ux-improvement-proposal.md), [audit](ux-audit-v1.md), original Figma and existing frontend. Applied the installed UI/UX Pro Max guidance on mobile-first reflow, visible focus, associated labels, touch access and readable text. Its generic replacement palette/type choices were excluded.

Inspected high-fidelity Figma context and screenshots for:

- [Login, 451:1893](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=451-1893): retained blue background, rounded white card, two-field hierarchy and desktop field width. Existing dark-blue submit styling is preserved. The current placeholder brand header remains a pre-existing mismatch with Figma; brand replacement is UX-030 and outside this package.
- [Public Header, 433:960](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=433-960): retained blue gradient, shipped logo, desktop spacing and existing login action.
- [Campaign Header, 1595:36835](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=1595-36835): retained yellow surface, campaign logo, display typography and three navigation items. Existing guest login remains; the reference is a logged-in header variant. Only small-screen arrangement and navigation behavior changed.
- [Footer, 1669:39771](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=1669-39771): retained black surface, logo/contact icons, three desktop groups, divider and credits. Column proportions/gaps adjust slightly so contact text fits.
- [Admin campaign frame, 441:1865](https://www.figma.com/design/QVOvciPdNjmXynCl6YM1xV/XTN-2025_UIT-Volunteer?node-id=441-1865): retained neutral canvas, white sidebar/content panels and management hierarchy. Desktop uses the existing 260px sidebar; mobile/tablet reflow replaces the squeezed side-by-side layout.

Reviewed rendered screenshots at all four requested widths. Shipped logos, icons and credit artwork remain in their existing slots with their aspect ratios preserved. No new visual assets or frameworks were introduced. The Figma frames are desktop references; mobile layouts are responsive adaptations, not copies of unverified mobile frames. Existing decorative campaign/map content was not changed.

## Verification results

| Check | Result |
|---|---|
| Existing frontend tests: `npm run test:run -w @uit-volunteer-map/frontend` | **PASS: 3/3 tests, 1 file.** |
| Production frontend build: `npm run build:frontend` | **PASS**, including shared build and frontend TypeScript/Vite compilation. Rechecked after the final source changes. |
| Frontend lint: `npm run lint -w @uit-volunteer-map/frontend` | **PASS** after final source changes. |
| `git diff --check` | **PASS.** |
| Browser interaction checks | **25 grouped checks passed**: login labels/tab order/keyboard reveal/focus/bounds; all three local and Team-to-campaign anchors; header nonoverlap; Public Header login navigation; Home/footer bounds; all three admin pages; local keyboard account-grid scrolling; 375×667 login access. |
| Login failure layout | **4/4 passed** at requested widths. A long HTTP 401 response was intercepted and fulfilled in Playwright; no backend login was submitted. Error remained above fields, input was retained, and no horizontal overflow occurred. Screenshots explicitly identify this as simulated evidence. |

Browser: isolated Playwright-controlled Chrome session against local Vite at `http://127.0.0.1:3013`. Requested captures use **375×900, 768×900, 1024×900 and 1440×900 CSS pixels**. An additional login check uses 375×667. No physical-device, real virtual-keyboard or screen-reader certification is claimed.

| Width | Login field width | Guest Header height | Admin main width | Page horizontal overflow |
|---|---|---|---|---|
| 375 | 295px | 106px, two rows | 343px | None measured on the checked routes. |
| 768 | 560px | 66px | 736px | None measured on the checked routes. |
| 1024 | 560px | 66px | 692px | None measured on the checked routes. |
| 1440 | 560px | 66px | 1108px | None measured on the checked routes. |

Public Header remains 64px high. All scoped header links, login controls, footer contacts and admin shell/toolbars fit within the viewport. The account grid deliberately scrolls inside its own region when necessary. Normal vertical page scrolling remains available.

**Scope caveat:** document width alone is not proof that all campaign content fits. Existing overflow-hidden ancestors still mask map/statistics/team clipping outside the approved header/footer scope. Those defects remain visible in campaign screenshots and are not counted as fixed.

Admin screenshots/interactions use **synthetic client-only role state and an invalid token**. They establish responsive presentation and client navigation only. No real authenticated session, server authorization, CRUD operation, upload, database seed or migration was tested.

## Before/after screenshots

All images below are actual browser captures, not prototypes. **32 baseline + 32 final matrix images**, plus the short-login capture and four simulated-error captures, are included. Baseline captures were taken before editing, from the R01-containing `develop` baseline. Views show the viewport top; footer captures target the footer element. Dynamic hero slides/statistic animation may differ between captures and are outside this package.

| Surface | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| Login | [Before](../../output/playwright/ux-responsive-foundations/before-login-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-login-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-login-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-login-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-login-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-login-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-login-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-login-1440.png) |
| Public Header/Home | [Before](../../output/playwright/ux-responsive-foundations/before-home-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-home-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-home-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-home-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-home-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-home-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-home-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-home-1440.png) |
| Campaign Header | [Before](../../output/playwright/ux-responsive-foundations/before-campaign-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-campaign-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-campaign-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-campaign-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-campaign-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-campaign-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-campaign-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-campaign-1440.png) |
| Team Header | [Before](../../output/playwright/ux-responsive-foundations/before-team-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-team-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-team-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-team-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-team-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-team-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-team-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-team-1440.png) |
| Footer | [Before](../../output/playwright/ux-responsive-foundations/before-footer-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-footer-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-footer-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-footer-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-footer-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-footer-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-footer-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-footer-1440.png) |
| Admin campaigns | [Before](../../output/playwright/ux-responsive-foundations/before-admin-campaigns-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-campaigns-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-campaigns-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-campaigns-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-campaigns-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-campaigns-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-campaigns-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-campaigns-1440.png) |
| Admin teams | [Before](../../output/playwright/ux-responsive-foundations/before-admin-teams-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-teams-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-teams-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-teams-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-teams-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-teams-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-teams-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-teams-1440.png) |
| Admin accounts | [Before](../../output/playwright/ux-responsive-foundations/before-admin-accounts-375.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-accounts-375.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-accounts-768.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-accounts-768.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-accounts-1024.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-accounts-1024.png) | [Before](../../output/playwright/ux-responsive-foundations/before-admin-accounts-1440.png) / [After](../../output/playwright/ux-responsive-foundations/after-admin-accounts-1440.png) |

Additional captures: [375×667 login](../../output/playwright/ux-responsive-foundations/after-login-375x667.png), simulated login errors at [375](../../output/playwright/ux-responsive-foundations/after-login-error-simulated-375.png), [768](../../output/playwright/ux-responsive-foundations/after-login-error-simulated-768.png), [1024](../../output/playwright/ux-responsive-foundations/after-login-error-simulated-1024.png), [1440](../../output/playwright/ux-responsive-foundations/after-login-error-simulated-1440.png).

Machine-readable evidence: [final geometry](../../output/playwright/ux-responsive-foundations/after-metrics.json), [interaction results](../../output/playwright/ux-responsive-foundations/verification-results.json), [simulated-error results](../../output/playwright/ux-responsive-foundations/error-verification-results.json).

Reproduction snippets for Playwright CLI are included: [capture](../../output/playwright/ux-responsive-foundations/capture.cjs), [interaction checks](../../output/playwright/ux-responsive-foundations/verify.cjs), [simulated error checks](../../output/playwright/ux-responsive-foundations/verify-errors.cjs). They target port 3013 and use only synthetic UI state for admin routes. Capture reads `?capture=after` from the initial URL to select its output prefix; run against the appropriate source revision before labeling captures “before”.

## Remaining issues and limits

- Existing map asset failures, map/statistics/team clipping, post routes, data scoping, leader workflows and management persistence remain outside this package. Admin actions/search/logout retain their pre-existing behavior; layout screenshots are not evidence they work against a backend.
- Login placeholder branding, light-label contrast, autocomplete improvements and broader dialog/document accessibility remain deferred under their separate audit findings. This package does not claim complete WCAG conformance.
- Production build retains its existing >500kB chunk warning (final JavaScript approximately 601.72kB, gzip 187.41kB). No bundle refactor was included.
- Browser checks covered Chrome viewports and keyboard interactions; physical phones, Safari, screen-reader use and real authenticated sessions remain unverified.
