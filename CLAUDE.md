# Friday

> A branded client portal for freelance designers — design review, invoicing, and file delivery in one calm space.

## Working Rules (Karpathy-style)

These four rules govern how code gets written in this repo. Full context in the Obsidian vault at `skills/karpathy-ai-coding-principles.md`.

1. **Think before coding.** State assumptions, present alternatives, ask clarifying questions. Don't hide confusion.
2. **Simplicity first.** No speculative features, no unrequested flexibility, no error handling for cases that can't happen. Test: "Would a senior engineer say this is overcomplicated?" Don't extract abstractions until 3+ concrete call sites exist.
3. **Surgical changes.** Modify only what the request requires. No drive-by reformatting, no "while I'm here" cleanup, match existing style.
4. **Goal-driven execution.** Before writing code, write a 2–3 bullet success criterion with explicit verification. "Done" requires end-to-end verification, not just green compile.

When an exploration agent reports findings, **verify load-bearing claims directly** before acting on them.

## Status
- **Stage:** pre-launch cleanup (Phase 0). See `projects/friday.md` in the Obsidian vault for current phase + next actions.
- **Deployed:** `itsfriday.dev` on Vercel, auto-deploys from `main`.
- **Supabase:** project ref `izfblnrrxlvzuvxeexod`, custom domain `api.itsfriday.dev`.
- **Active branch:** `main`.

## What This Is
Friday replaces the messy stack of Notion + Google Drive + email threads + HoneyBook with a single, beautiful client portal. Freelance designers get a branded space where clients can check project status, review designs with pin-drop comments, download deliverables, and pay invoices. Key differentiator: visual design review with image annotation.

## Stack
- **Frontend:** Next.js 16.2 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL) + Prisma 7 (with `@prisma/adapter-pg`)
- **Auth:** Supabase Auth (email/OAuth for freelancers; portal magic-link coming in Phase 1)
- **Payments:** Stripe Connect (Standard) — no platform fee
- **File Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **Email:** Resend
- **Drag & Drop:** @dnd-kit
- **Hosting:** Vercel
- **Repo:** github.com/MattGHicks/friday (private)

## Local Dev
```bash
npm install
npx prisma generate      # required after clone or schema changes
npm run dev              # http://localhost:3000
```

Environment variables: copy `.env.example` → `.env.local`. For Vercel-synced vars: `vercel env pull`.

## Development Workflow

Work locally, test thoroughly, push only when ready. Every push to `main` triggers a Vercel build.

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Develop and test locally with `npm run dev`
3. Run `npx next build` to catch type errors before pushing
4. Merge to `main` only when the feature is complete and tested

## Project Structure
```
src/
  app/
    (auth)/                    # login, signup, OAuth
    (dashboard)/               # protected freelancer routes
      dashboard/               # home page, quick actions
      clients/                 # CRUD, detail, CSV import
      projects/                # list, detail (Tasks/Files/Invoices/Activity tabs), kanban, review
      pipeline/                # kanban by stage
      calendar/                # meetings month view
      settings/                # profile, brand, pipeline stages
    portal/[clientId]/         # public client portal (magic-link in Phase 1)
    api/                       # Stripe + PDF routes
    auth/callback/             # OAuth handler
  components/brand/            # <Logo> + <Emblem> SVG components
  components/dashboard/        # sidebar, forms, nav
  components/ui/               # shadcn/ui base
  generated/prisma/            # auto-generated (gitignored)
  lib/
    auth.ts                    # getCurrentUser() — upserts Prisma User from Supabase UUID
    prisma.ts                  # Singleton Prisma client with PrismaPg adapter
    resend.ts                  # sendEmail() helper
    email/                     # invoice-sent, file-uploaded, review-status-changed templates
    supabase/                  # client/server/middleware/admin helpers
  proxy.ts                     # Next.js 16 proxy — session refresh, route protection
prisma/schema.prisma           # 11 models
```

## Key Conventions
- **Styling:** Tailwind utility classes; use tokens (`bg-fire/20`) not raw hex.
- **Typography:** Epilogue (display), DM Sans (body), JetBrains Mono (data/code) via `next/font/google`, CSS vars `--font-display`, `--font-body`, `--font-code`.
- **Brand palette:** `--color-fire` (`#E55A3A`), `--color-gold` (`#F0A830`), `--color-cream` (`#F5EDD0`). Surface scale `--color-surface-0..4` (`#080808` → `#242424`). Tailwind: `bg-fire`, `text-gold`, `from-fire`, etc.
- **Brand gradient:** fire → gold → cream. Utilities: `.text-gradient-brand`, `.bg-gradient-brand`, `.bg-gradient-brand-vertical`. Motion: `animate-fade-up` + `.delay-{75..500}`.
- **Logos:** Always use `<Logo>` or `<Emblem>` from `@/components/brand/` — never raw text or `<img>`. Both use `useId()` for safe multi-instance gradient IDs.
- **shadcn/ui:** this version uses base-ui primitives — **no `asChild` support**. Apply className directly on triggers, or use `<Link className={buttonVariants()}>`.
- **Types:** colocated or `src/lib/types.ts` — no `any`.
- **Auth:** freelancer routes under `(dashboard)/`, client routes under `portal/`. Route groups invisible in URLs: dashboard home is `/dashboard`, clients is `/clients`.
- **Motion:** 200ms ease-out, no bounce. Card hover: `-translate-y-0.5` + shadow lift.

## Design Principles
Dark-first near-black. Warm light against darkness — "golden hour on a Friday afternoon." Mobile-responsive portal. The UI itself is a selling point.

## Brand Voice
Short sentences, fragments fine. Confident, warm, never corporate. No "leverage"/"synergy"/"empower." Lowercase casual, proper in formal (invoices, contracts). See `docs/friday-brand-bible.md`.

## Obsidian Vault Workflow

The authoritative current status, phase plan, and session history for this project live in the Obsidian vault. This CLAUDE.md is static conventions.

**At session start:**
- Read `projects/friday.md` in the vault for current status + next action
- Check the most recent file in `logs/` for context on the last session
- If the vault is >2 days stale, do a catch-up update first

**At session end:**
- Update `projects/friday.md` with what changed, blockers, next action
- Write a session log to `logs/YYYY-MM-DD.md`
- Promote reusable learnings: cross-project → `skills/`, reusable solution → `patterns/`, big decision → `decisions/`

**Cross-project context:** query the vault via Obsidian MCP for patterns, past decisions, and related project state.

## Installed Agent Skills
Live in `.agents/skills/` (universal) with symlinks in `.claude/skills/` (Claude Code).

| Skill | Use when |
|-------|----------|
| `find-skills` | Discovering/installing new skills |
| `frontend-design` | Starting a new UI page/component (aesthetic direction) |
| `web-design-guidelines` | Auditing UI code against Vercel's guidelines |
| `supabase-postgres-best-practices` | Database queries, schema, RLS |
| `nextjs-supabase-auth` | Auth flows with Next.js App Router + Supabase SSR |
| `vercel-react-best-practices` | Post-edit React component review |

## Infrastructure
- **App domain:** `itsfriday.dev` (Vercel, Vercel nameservers)
- **Supabase domain:** `api.itsfriday.dev` → CNAME → `izfblnrrxlvzuvxeexod.supabase.co`
- **Auth callback:** `https://api.itsfriday.dev/auth/v1/callback` (Google + GitHub OAuth)
- **Vercel Deployment Protection:** currently ON — disable before public launch.

## Important Notes (actually load-bearing)

- **Next.js 16:** Uses `proxy.ts`, not `middleware.ts`. Exported function must be named `proxy`.
- **Prisma 7:** Requires adapter (`@prisma/adapter-pg`). Generated client lives in `src/generated/prisma/` (gitignored) — import from `@/generated/prisma/client`.
- **Prisma generate is required at build time.** Build script is `prisma generate && next build`.
- **Prisma connections:** `DATABASE_URL` = transaction pooler (port 6543) for runtime. `DIRECT_URL` = session pooler (port 5432) for migrations. Host is `aws-1-us-east-1`.
- **Proxy static asset skip:** Must skip `/_next/`, `/api/`, and paths with `.` (file extensions) early — otherwise assets redirect to /login and pages render unstyled.
- **shadcn/ui `asChild`:** not supported in this version. Apply className directly on triggers.
- **SVG brand components:** `useId()` contains `:` — strip with `.replace(/:/g, "")` for valid XML IDs.
- **User ID strategy:** `User.id = Supabase auth.users UUID`. Set explicitly on creation, not generated.
- **Server action FormData prefixing:** calling `await serverAction(arg0, formData)` from client code prefixes fields (`title` → `1_title`). Fix: pass plain strings, or use `action={serverAction}` directly on `<form>`.
- **Supabase Storage:** use `createAdminClient()` (service role) for server-side uploads. Bucket `project-files` (public). Path: `{userId}/{projectId}/{timestamp}-{sanitized-filename}`.
- **Activity logging:** import `logActivity` from `./log-activity`. Wraps in try/catch — never throws. JSON metadata cast: `metadata as Prisma.InputJsonValue`.
- **Portal access (pre-magic-link):** `/portal/[clientId]` public, proxy skips `/portal`. clientId is a cuid used as access token — **beta only, replace in Phase 1**.
- **Supabase email confirmation:** disabled for dev. Re-enable before prod launch.
- **UI verification:** use Chrome DevTools MCP (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`) to screenshot and visually verify before asking user to test.

## Off Limits
- Don't push directly to `main` — feature branches, merge when tested.
- Don't change Prisma schema without `prisma db push` or a migration.
- No platform transaction fees — Stripe standard rates only.
- Minimize Vercel deploys — each push to `main` costs. Test locally first, `npx next build` before pushing.
