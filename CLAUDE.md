# Friday

> A branded client portal for freelance designers — design review, invoicing, and file delivery in one calm space.

## Status
- **Stage:** building — auth system complete, starting dashboard + client CRUD
- **Deployed:** yes → Vercel (auto-deploys from `main`)
- **Auto-deploy:** yes → push to `main` deploys to Vercel
- **Supabase:** connected (project ref: izfblnrrxlvzuvxeexod, MCP configured)

## What This Is
Friday replaces the messy stack of Notion + Google Drive + email threads + HoneyBook with a single, beautiful client portal. Freelance designers get a branded space where clients can check project status, review designs with pin-drop comments, download deliverables, and pay invoices. Key differentiator: visual design review with image annotation.

## Stack
- **Frontend:** Next.js 16.2 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL) + Prisma 7 ORM (with @prisma/adapter-pg)
- **Auth:** Supabase Auth (magic links for clients, email/OAuth for freelancers)
- **Payments:** Stripe Connect (Standard) — no platform fee
- **File Storage:** Supabase Storage (S3-backed, CDN)
- **Realtime:** Supabase Realtime (live comments, status updates)
- **Email:** Resend (transactional notifications)
- **Drag & Drop:** @dnd-kit (for kanban board)
- **Hosting:** Vercel
- **Repo:** github.com/MattGHicks/friday (private)

## Local Dev
```bash
npm install
npx prisma generate   # required after clone or schema changes
npm run dev            # http://localhost:3000
```

Environment variables needed: copy `.env.example` → `.env.local`
For Vercel-synced vars: `vercel env pull`

## Development Workflow

> **Work locally, test thoroughly, push only when ready.**
>
> Every push to `main` triggers a Vercel build (costs money). Minimize unnecessary deploys.
>
> 1. **Create a feature branch** for any non-trivial work: `git checkout -b feature/feature-name`
> 2. **Develop and test locally** with `npm run dev` — verify everything works
> 3. **Run `npx next build`** to catch type errors before pushing
> 4. **Merge to `main`** only when the feature is complete and tested
> 5. Push triggers auto-deploy to Vercel
>
> **Branch naming:** `feature/description`, `fix/description`
> **Commits to `main`:** should be merge commits from tested feature branches

## Project Structure
```
src/
  app/                # Next.js App Router pages
    (auth)/           # Auth routes — login, signup (working)
      actions.ts      # Server actions: signup, login, logout
      layout.tsx      # Centered auth layout with Friday wordmark
      login/page.tsx  # Login form (email/password)
      signup/page.tsx # Signup form (email/password)
    (dashboard)/      # Freelancer dashboard (protected, requires auth)
      layout.tsx      # Dashboard shell: top-nav with user email + sign out
      dashboard/page.tsx  # Dashboard home (placeholder)
    (portal)/         # Client-facing portal (subdomain-routed) — not built yet
    api/              # API routes (webhooks, Stripe, etc.) — not built yet
    auth/callback/route.ts  # Supabase OAuth callback handler
    layout.tsx        # Root layout with fonts + metadata
    page.tsx          # Placeholder landing page
    globals.css       # Tailwind v4 theme with Friday brand colors
  components/
    ui/               # shadcn/ui: button, input, label, card, separator
  generated/prisma/   # Auto-generated Prisma client (gitignored, run `npx prisma generate`)
  lib/
    auth.ts           # getCurrentUser() — upserts Prisma User from Supabase auth
    prisma.ts         # Singleton Prisma client with PrismaPg adapter
    utils.ts          # shadcn/ui cn() utility
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Component Supabase client
      middleware.ts    # Session refresh + route protection (called from proxy.ts)
  proxy.ts            # Next.js 16 proxy — refreshes sessions, protects routes
prisma/
  schema.prisma       # Full MVP database schema (13 models, all enums)
prisma.config.ts      # Prisma config (loads .env.local, uses DIRECT_URL for migrations)
docs/
  friday-mvp-spec.md  # Full product spec with 8-week build plan
  friday-brand-bible.md  # Brand voice, colors, typography, positioning
```

## Key Conventions
- **Styling:** Tailwind utility classes. Use the brand palette from the brand bible (Golden #E8A838, Midnight #1A1A2E, Warm White #FAFAF7, Sand #F0EBE3)
- **Typography:** Plus Jakarta Sans for headings (--font-heading), Inter for body (--font-sans), JetBrains Mono for data/code (--font-mono). Satoshi was originally planned but isn't on Google Fonts; Plus Jakarta Sans is the brand bible fallback.
- **Components:** shadcn/ui base, extend don't override
- **Types:** All types in `src/lib/types.ts` or colocated — no `any`
- **DB:** All schema changes go through Prisma migrations — never edit prod DB directly
- **Auth:** Supabase Auth — freelancer routes under `(dashboard)/`, client routes under `(portal)/`
- **Motion:** Subtle transitions (150-300ms ease-out), no bouncy animations

## Design Principles
- Light mode primary (Warm White backgrounds), dark mode supported
- Clean, minimal, warm — "golden hour on a Friday afternoon"
- The UI itself is a selling point — design quality IS the product
- Mobile-responsive (client portal must work perfectly on phone)
- Fast — optimize for perceived performance

## Brand Voice (in UI copy)
- Short sentences. Fragments fine.
- Confident, warm, never corporate
- No jargon: no "leverage", "synergy", "empower"
- Lowercase energy in casual contexts, proper in formal (invoices, contracts)
- See docs/friday-brand-bible.md for full guidelines

## Installed Skills
Skills live in `.agents/skills/` (universal) with symlinks in `.claude/skills/` (Claude Code). Installed via `npx skills add`. To find more: `npx skills find <keyword>`.

| Skill | Source | Purpose |
|-------|--------|---------|
| **find-skills** | vercel-labs/skills | Discover and install new skills on the fly |
| **frontend-design** | anthropics/skills | Distinctive, production-grade UI — avoids generic AI aesthetics. Establishes aesthetic direction before coding. |
| **web-design-guidelines** | vercel-labs/agent-skills | Audits UI code against Vercel's Web Interface Guidelines for design + a11y compliance |
| **supabase-postgres-best-practices** | supabase/agent-skills | Postgres optimization: indexing, RLS, connection pooling, schema design |
| **nextjs-supabase-auth** | sickn33/antigravity-awesome-skills | Auth patterns for Next.js App Router + Supabase SSR (@supabase/ssr) |
| **vercel-react-best-practices** | vercel-labs/agent-skills | React component quality: hooks, accessibility, performance, TypeScript patterns |

**When to use each:**
- Starting a new UI page/component → `frontend-design` first for aesthetic direction, then `web-design-guidelines` to audit
- Writing database queries or schema changes → `supabase-postgres-best-practices`
- Building auth flows → `nextjs-supabase-auth`
- After editing React components → `vercel-react-best-practices` for quality review
- Need a new capability → `find-skills` to search the ecosystem

## What's Done
- [x] GitHub repo created (private)
- [x] Next.js 16 scaffold with TypeScript, Tailwind v4, Turbopack
- [x] shadcn/ui initialized (button, input, label, card, separator)
- [x] All dependencies installed (Prisma, Supabase, Stripe, Resend, dnd-kit, zod, react-hook-form, lucide-react, date-fns)
- [x] Full Prisma schema written (13 models) and pushed to Supabase
- [x] Supabase project connected (MCP configured for direct management)
- [x] Vercel linked (auto-deploys from `main` via GitHub)
- [x] Brand theme applied in globals.css (Friday palette, dark mode support)
- [x] Fonts configured (Plus Jakarta Sans, Inter, JetBrains Mono via next/font)
- [x] Agent skills installed (6 skills)
- [x] **Auth system complete:** signup, login, logout (email/password)
- [x] **Route protection:** middleware redirects unauthenticated → /login, authenticated → /dashboard
- [x] **User sync:** Prisma User upserted from Supabase auth UUID on each dashboard request
- [x] **Dashboard shell:** top-nav with user email + sign out (no sidebar yet)
- [x] Build passing, auth flow tested end-to-end

## What's Next
- [ ] Dashboard sidebar nav + responsive layout
- [ ] Client CRUD: create/list/edit/delete clients
- [ ] Project management: create projects per client
- [ ] Kanban board: drag-and-drop columns and cards (dnd-kit)
- [ ] File upload system

## Important Notes
- **Next.js 16:** Uses `proxy.ts` instead of `middleware.ts` (renamed convention). The exported function must be named `proxy`, not `middleware`.
- **Prisma 7:** Requires an adapter (`@prisma/adapter-pg`). Cannot instantiate `new PrismaClient()` without passing `{ adapter }`. The generated client lives in `src/generated/prisma/` (gitignored) — import from `@/generated/prisma/client`, not `@/generated/prisma`.
- **Prisma generate:** Must run `npx prisma generate` after cloning or after schema changes, before the build will pass.
- **Prisma connections:** `DATABASE_URL` = transaction pooler (port 6543, pgbouncer, for runtime). `DIRECT_URL` = session pooler (port 5432, for migrations/DDL). Host is `aws-1-us-east-1` (not `aws-0`).
- **Brand colors as CSS vars:** Available as `--color-golden`, `--color-sunset`, `--color-sage`, `--color-midnight`, `--color-sand`, `--color-coral`, `--color-warm-white` in addition to the shadcn semantic vars (primary = Golden, background = Warm White, foreground = Midnight, etc.)
- **User ID strategy:** Prisma User.id = Supabase auth.users UUID. Set explicitly on creation, not auto-generated. This means no separate supabaseId field needed.
- **Supabase email confirmation:** Disabled for dev (Auth → Providers → Email → "Confirm email" off). Re-enable for production.

## Off Limits
- Don't push directly to `main` — use feature branches, merge when tested
- Don't change Prisma schema without running `prisma db push` or a migration
- No platform transaction fees on payments — Stripe standard rates only
- Minimize Vercel deploys — each push to `main` costs. Test locally first, build before pushing.
