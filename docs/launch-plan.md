# Friday Launch Plan

Single source of truth for the launch-readiness sprint. The goal: Friday is shippable as a paid SaaS for first subscribers — every user flow verified, marketing site live and on-brand, all backlogged items closed, Playwright E2E green on the money path, and a final prod-ops checklist handed to Matt.

## Branch

- Working branch: `feature/launch-readiness`, cut from `feature/pre-launch-polish` (which has 2 unmerged commits ahead of `main`: pipeline lifecycle view + project page redesign). Branching off `main` would have lost that work. PR will target `main` and include the pre-launch-polish commits as part of the launch bundle.

## Start-of-work ritual

1. Obsidian MCP: read `projects/friday.md`, last 3 `logs/`, `decisions/0003-*.md` (calendar ADR).
2. `git checkout -b feature/launch-readiness` (off pre-launch-polish, see above).
3. `npm install`, `npx prisma generate`, `xattr -w com.dropbox.ignored 1 node_modules`.
4. `npm run dev` (background). Open Chrome DevTools MCP at `localhost:3000`.
5. Test creds in memory `test_credentials.md` — Chrome DevTools MCP cannot do Google OAuth.

## Phases

### Phase A — Verification (read-only)

Walk the full happy path in a real browser via Chrome DevTools MCP. Screenshot every screen. File issues as todos; do NOT fix yet.

A1. Sign up a new freelancer (email/password).
A2. Onboarding: brand color, logo upload, welcome message.
A3. Pipeline stages: rename one, add one, reorder.
A4. Create a Lead, draft a Quote with 2 line items + 30% deposit.
A5. Send the Quote — confirm Resend email fires.
A6. Open portal Quote URL in a second tab, accept it, pay deposit with `4242 4242 4242 4242`.
A7. Confirm: Quote → ACCEPTED, Project ACTIVE, deposit Invoice paid, Lead → WON.
A8. Upload a >5MB file (must use direct Supabase Storage upload, PR #17).
A9. Open Review, drop 3 annotations, reply to one, resolve one, approve review.
A10. Create a non-deposit Invoice, send it, pay it from the portal.
A11. Send a portal message; verify inbound email roundtrip via `reply+<token>@itsfriday.dev`.
A12. Create a Meeting on the calendar.
A13. Edit Settings → confirm brand changes propagate to portal.

### Phase B — Close backlog

B1. "Add to Google Calendar" button on each meeting — `calendar.google.com/calendar/r/eventedit` URL, no OAuth (ADR 003).
B2. One-way ICS feed export per freelancer (`?token=…` on `/api/calendar/ics`).
B3. Auto-format phone inputs on Client, Contact, Lead forms (US format, fall through international).
B4. Display-name nudge on signup; fall back to email in quote/invoice emails + portal.
B5. Wire `QUOTE_DECLINED` activity entry (mirror `QUOTE_ACCEPTED` in `quote-actions.ts`).
B6. Onboarding "Share the client portal" step — completion logic currently wrong when clients already exist; fix.
B7. Portal brand consistency final pass — every portal page uses freelancer's brand color, Logo/Emblem, gradient.

### Phase C — Marketing site

Run `/frontend-design` before starting. After every page, run `/web-design-guidelines`.

C1. Landing polish (`src/app/page.tsx`) — sharper hero, real product screenshots, social-proof placeholder, primary CTA above fold, secondary CTA at bottom.
C2. `/pricing` — placeholder tiers (Free / Pro / Studio), prices TBD, feature comparison, "Start free" CTA.
C3. `/help` — sectioned anchors: Getting started, Brand setup, Your first quote, Getting paid, FAQ.
C4. Footer on all marketing pages: logo, nav, `/terms` + `/privacy` stub pages (3-paragraph placeholder, marked TBD).
C5. Polish at 375 / 768 / 1280px for `/`, `/pricing`, `/help`, `/login`, `/signup`.

### Phase D — UX + a11y audit

D1. Chrome DevTools MCP — visit every dashboard + portal route. Screenshot. Look for missing loading/empty/error states, broken layouts, off-brand colors, inconsistent typography.
D2. Lighthouse on `/`, `/pricing`, `/signup`, `/dashboard`, `/portal/projects/{seeded}`, `/portal/quotes/{seeded}`. Fix anything <85 Perf, <95 A11y, <95 Best Practices.
D3. A11y deep-dive on Review annotation tool — contrast, keyboard nav for pin drops, ARIA on pin markers + resolve/approve controls. Use `chrome-devtools-mcp:a11y-debugging` skill.
D4. Fix every high-severity finding before exiting Phase D. Log medium/low to `projects/friday.md`.

### Phase E — Playwright E2E

E1. `npm install -D @playwright/test`, `npx playwright install chromium`.
E2. Scripts: `"test:e2e": "playwright test"`, `"test:e2e:ui": "playwright test --ui"`.
E3. `tests/e2e/` specs (minimum 8):
    - `signup-onboarding.spec.ts`
    - `lead-to-paid-deposit.spec.ts`
    - `file-upload-large.spec.ts`
    - `review-annotate-approve.spec.ts`
    - `invoice-pay.spec.ts`
    - `portal-magic-link.spec.ts`
    - `portal-message-roundtrip.spec.ts`
    - `calendar-meeting.spec.ts`
E4. All green locally, < 5 min runtime, parallelized.

### Phase F — Production-readiness handoff

F1. Write `docs/launch-checklist.md` with manual ops steps:
    - Disable Vercel Deployment Protection.
    - Swap Stripe test keys → live keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CLIENT_ID`).
    - Re-create Stripe webhook endpoint with live signing secret.
    - Verify Resend inbound webhook URL points at `https://itsfriday.dev/api/email/inbound`.
    - Set `NEXT_PUBLIC_APP_URL=https://itsfriday.dev` in prod env.
    - Confirm DKIM/SPF/MX green in Resend.
    - Spot-check Supabase advisors.
F2. Update vault `projects/friday.md`: status, last_updated.
F3. Write today's `logs/` entry.
F4. Promote cross-project learnings to `patterns/` / `decisions/`.

## DONE checklist

1. Phase A happy path verified in browser with screenshots.
2. Every Phase B backlog item shipped + verified.
3. Marketing site (Phase C) renders cleanly at 375 / 768 / 1280px.
4. Phase D audit done; no open high-severity findings; Lighthouse targets met.
5. Playwright E2E ≥8 specs all green < 5 min.
6. `docs/launch-checklist.md` exists with 7 manual prod-ops items.
7. `projects/friday.md` + today's log updated.
8. `npx next build` passes clean.
9. PR opened `feature/launch-readiness` → `main` with phase-by-phase summary.

## Guardrails (non-negotiable)

- Feature branch only. Never commit to `main`.
- `npx next build` passes before every commit. Type errors block.
- Do NOT pre-split the 5 large files flagged in `projects/friday.md` (review-viewer 645, kanban-board 635, invoices-panel 574, client-detail-client 656, landing 778).
- Do NOT extract abstractions for <3 concrete call sites.
- Brand tokens only — `bg-fire` / `text-gold`. Never raw hex.
- Always `<Logo>` / `<Emblem>` from `@/components/brand`. Never raw SVG or `<img>`.
- shadcn here has NO `asChild` — className directly on triggers or `<Link className={buttonVariants()}>`.
- Chrome DevTools MCP for visual verification before claiming any UI work done.
- After every TSX edit batch, run `/vercel-react-best-practices`.
- For Supabase schema / RLS change, run `/supabase-postgres-best-practices` first.
- For auth touchpoint, `/nextjs-supabase-auth`.
- PAUSE TO ASK MATT if: Prisma migration could lose data; Stripe webhook signature verification involved; pricing-tier amounts or feature gates need a decision; live Stripe keys / prod state required; brand or copy is ambiguous.

## Skills

- `/frontend-design` — start of Phase C, per page as needed.
- `/web-design-guidelines` — after every marketing page or major dashboard edit.
- `/supabase-postgres-best-practices` — any schema/RLS work.
- `/nextjs-supabase-auth` — any auth touchpoint.
- `/vercel-react-best-practices` — after TSX edit batches.
- `chrome-devtools-mcp:a11y-debugging` — Phase D a11y deep-dive.
- `chrome-devtools-mcp:debug-optimize-lcp` — if Lighthouse Performance <85.
- Obsidian MCP — session boundaries.
- Chrome DevTools MCP — all visual verification, Lighthouse, a11y audits.

## Reporting cadence

End of every phase: one-paragraph status — what shipped, what broke, what's next. Don't wait for everything.
