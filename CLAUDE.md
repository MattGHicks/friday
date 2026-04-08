# Friday

> A branded client portal for freelance designers — design review, invoicing, and file delivery in one calm space.

## Status
- **Stage:** building — scaffold complete, no Supabase/Vercel linked yet
- **Deployed:** no (Vercel not linked yet)
- **Auto-deploy:** will be yes → push to `main` deploys to Vercel (once linked)

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
npm run dev       # http://localhost:3000
```

Environment variables needed: copy `.env.example` → `.env.local`
For Vercel-synced vars: `vercel env pull`

## Project Structure
```
src/
  app/                # Next.js App Router pages
    (auth)/           # Auth routes (login, signup, magic link) — empty, not built yet
    (dashboard)/      # Freelancer dashboard (requires auth) — empty, not built yet
    (portal)/         # Client-facing portal (subdomain-routed) — empty, not built yet
    api/              # API routes (webhooks, Stripe, etc.) — empty, not built yet
    layout.tsx        # Root layout with fonts + metadata
    page.tsx          # Placeholder landing page
    globals.css       # Tailwind v4 theme with Friday brand colors
  components/
    ui/button.tsx     # shadcn/ui Button (only component installed so far)
  generated/prisma/   # Auto-generated Prisma client (gitignored, run `npx prisma generate`)
  lib/
    prisma.ts         # Singleton Prisma client with PrismaPg adapter
    utils.ts          # shadcn/ui cn() utility
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Component Supabase client
      middleware.ts    # Session refresh helper (called from proxy.ts)
  proxy.ts            # Next.js 16 proxy (replaces middleware.ts) — refreshes Supabase sessions
prisma/
  schema.prisma       # Full MVP database schema (13 models, all enums)
prisma.config.ts      # Prisma config (reads DATABASE_URL from env)
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
- [x] shadcn/ui initialized
- [x] All dependencies installed (Prisma, Supabase, Stripe, Resend, dnd-kit, zod, react-hook-form, lucide-react, date-fns)
- [x] Full Prisma schema written (13 models: User, Client, Project, Column, Card, File, Review, Annotation, Invoice, Contract, Message, Activity, Notification)
- [x] Supabase client utilities (server, browser, middleware/proxy)
- [x] Brand theme applied in globals.css (Friday palette, dark mode support)
- [x] Fonts configured (Plus Jakarta Sans, Inter, JetBrains Mono via next/font)
- [x] Route group directories created: (auth), (dashboard), (portal), api
- [x] Build passing
- [x] Agent skills installed (6 skills: find-skills, frontend-design, web-design-guidelines, supabase-postgres-best-practices, nextjs-supabase-auth, vercel-react-best-practices)

## What's Next
- [ ] Create Supabase project + add credentials to `.env.local`
- [ ] `vercel link` to connect project to Vercel
- [ ] `npx prisma migrate dev` to apply schema to database
- [ ] Auth system: freelancer signup/login (Supabase Auth)
- [ ] Dashboard shell: sidebar nav, layout, responsive scaffold
- [ ] Client CRUD: create/list/edit clients

## Important Notes
- **Next.js 16:** Uses `proxy.ts` instead of `middleware.ts` (renamed convention). The exported function must be named `proxy`, not `middleware`.
- **Prisma 7:** Requires an adapter (`@prisma/adapter-pg`). Cannot instantiate `new PrismaClient()` without passing `{ adapter }`. The generated client lives in `src/generated/prisma/` (gitignored) — import from `@/generated/prisma/client`, not `@/generated/prisma`.
- **Prisma generate:** Must run `npx prisma generate` after cloning or after schema changes, before the build will pass.
- **Brand colors as CSS vars:** Available as `--color-golden`, `--color-sunset`, `--color-sage`, `--color-midnight`, `--color-sand`, `--color-coral`, `--color-warm-white` in addition to the shadcn semantic vars (primary = Golden, background = Warm White, foreground = Midnight, etc.)

## Off Limits
- Don't push to `main` directly once auto-deploy is on
- Don't change Prisma schema without a migration file
- No platform transaction fees on payments — Stripe standard rates only
