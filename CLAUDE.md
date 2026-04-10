# Friday

> A branded client portal for freelance designers — design review, invoicing, and file delivery in one calm space.

## Status
- **Stage:** MVP complete — full freelancer dashboard + client portal deployed to Vercel
- **Deployed:** yes → Vercel (auto-deploys from `main`)
- **Auto-deploy:** yes → push to `main` deploys to Vercel
- **Supabase:** connected (project ref: izfblnrrxlvzuvxeexod, MCP configured, custom domain: api.itsfriday.dev)
- **Active branch:** `main`

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
      layout.tsx      # Dashboard shell: sidebar + mobile nav
      dashboard/page.tsx  # Dashboard home — greeting, 3 stat cards, empty CTA
      clients/page.tsx    # Client grid page (server component)
      clients/clients-page-client.tsx  # Client component (add/edit sheet state)
      clients/actions.ts  # createClient, updateClient, deleteClient server actions
      clients/[id]/page.tsx          # Client detail — header, projects grid
      clients/[id]/client-detail-client.tsx  # Client detail client component
      projects/page.tsx              # Projects list (all projects across clients)
      projects/projects-page-client.tsx
      projects/actions.ts            # createProject, updateProject, deleteProject
      projects/[id]/page.tsx         # Project detail — Board/Files/Invoices tabs
      projects/[id]/actions.ts       # createCard, updateCard, deleteCard, moveCard, createColumn, deleteColumn
      projects/[id]/kanban-board.tsx # Kanban board with dnd-kit drag-and-drop
      projects/[id]/kanban-board-loader.tsx  # SSR wrapper (ssr: false) — fixes dnd-kit hydration
      projects/[id]/file-actions.ts  # uploadFile, deleteFile (Supabase Storage)
      projects/[id]/files-panel.tsx  # File upload dropzone + file list with review/download/delete
      projects/[id]/invoice-actions.ts  # createInvoice, updateInvoiceStatus
      projects/[id]/invoices-panel.tsx  # Invoice list + create form with live totals
      projects/[id]/review-actions.ts   # getOrCreateReview, addAnnotation, addReply, toggleAnnotationResolved, updateReviewStatus
      projects/[id]/review/[fileId]/page.tsx  # Review page (server, loads file + annotations)
      projects/[id]/review/[fileId]/review-viewer.tsx  # Interactive annotation viewer (client)
      projects/[id]/log-activity.ts     # logActivity() helper — call from any server action, never throws
      projects/[id]/activity-panel.tsx  # Timeline feed component, server component
      projects/[id]/project-header-actions.tsx  # Quick status dropdown + Edit button in project header
      settings/page.tsx         # Settings (server component, loads user profile)
      settings/settings-client.tsx  # Settings form — name, brand color, welcome message
      settings/actions.ts       # updateSettings server action
    portal/           # Client-facing portal — NO auth required (client ID is access token)
      layout.tsx                          # Minimal layout: friday wordmark + max-w-4xl content + footer
      [clientId]/page.tsx                 # Client portal home — project list with status + invoices
      [clientId]/projects/[projectId]/page.tsx  # Project view: board columns, deliverables, files, invoice line items
    api/              # API routes (webhooks, Stripe, etc.) — not built yet
    auth/callback/route.ts  # Supabase OAuth callback handler
    not-found.tsx     # Branded 404 page
    layout.tsx        # Root layout with fonts + metadata
    page.tsx          # Placeholder landing page
    globals.css       # Tailwind v4 theme — near-black dark palette, fire/gold/cream brand tokens, surface scale, gradient utilities, animations
    icon.svg          # SVG favicon — auto-detected by Next.js App Router as /icon.svg route
  components/
    brand/
      emblem.tsx      # React SVG component for F icon mark (transparent, gradient, useId() safe)
      logo.tsx        # React SVG component for full FRIDAY wordmark (transparent, gradient, useId() safe)
    dashboard/
      sidebar.tsx         # Collapsible sidebar (256px / 64px icon-only)
      sidebar-nav.tsx     # Nav items with gradient fire→gold active indicator
      mobile-nav.tsx      # Mobile hamburger + Sheet overlay
      user-menu.tsx       # Avatar + dropdown (sign out)
      client-card.tsx     # Client card with initials avatar, dropdown actions
      client-form.tsx     # Add/edit client sheet slide-over with useActionState
      project-form.tsx    # Add/edit project sheet slide-over with useActionState
    ui/               # shadcn/ui components (button, input, card, etc.)
  generated/prisma/   # Auto-generated Prisma client (gitignored, run `npx prisma generate`)
  lib/
    auth.ts           # getCurrentUser() — upserts Prisma User from Supabase auth
    prisma.ts         # Singleton Prisma client with PrismaPg adapter
    utils.ts          # shadcn/ui cn() utility
    supabase/
      client.ts       # Browser Supabase client
      server.ts       # Server Component Supabase client
      middleware.ts   # Session refresh + route protection (called from proxy.ts)
      admin.ts        # Service role client for server-side storage ops (bypasses RLS)
  proxy.ts            # Next.js 16 proxy — refreshes sessions, protects routes
prisma/
  schema.prisma       # Full MVP database schema (13 models, all enums)
prisma.config.ts      # Prisma config (loads .env.local, uses DIRECT_URL for migrations)
public/
  brand/
    emblem.svg        # Transparent background emblem (static use: emails, embeds)
    logo-full.svg     # Transparent background full wordmark (static use)
docs/
  friday-mvp-spec.md  # Full product spec with 8-week build plan
  friday-brand-bible.md  # Brand voice, colors, typography, positioning
```

## Key Conventions
- **Styling:** Tailwind utility classes. Use Tailwind tokens not raw hex. Prefer opacity variants (`bg-fire/20`) over hardcoded colors.
- **Typography:** Epilogue for headings (`font-display` / `--font-display`), DM Sans for body (`font-body` / `--font-body`), JetBrains Mono for data/code (`font-mono` / `--font-code`).
- **Brand color tokens:** `--color-fire` (`#E55A3A`), `--color-gold` (`#F0A830`), `--color-cream` (`#F5EDD0`), `--color-sage`, `--color-coral`. Tailwind: `bg-fire`, `text-gold`, `from-fire`, `to-gold`, etc.
- **Gradient utilities:** `.text-gradient-brand` (gradient text), `.bg-gradient-brand` (horizontal fire→gold→cream), `.bg-gradient-brand-vertical` (used for nav indicator). Also `animate-fade-up` + `.delay-{75,150,225,300,400,500}` for staggered entry animations.
- **Logo components:** Always use `<Logo>` or `<Emblem>` from `@/components/brand/` — never raw text or `<img>` tags for the wordmark. Both use `useId()` for safe multi-instance SVG gradient/clipPath IDs.
- **Components:** shadcn/ui base, extend don't override. Note: this shadcn version uses base-ui primitives — **no asChild support**. Apply className directly on triggers, or use `<Link className={buttonVariants()}>` instead of `<Button asChild><Link>`.
- **Types:** All types in `src/lib/types.ts` or colocated — no `any`
- **DB:** All schema changes go through `prisma db push` (dev) or a Prisma migration (prod) — never edit prod DB directly
- **Auth:** Supabase Auth — freelancer routes under `(dashboard)/`, client routes under `(portal)/`
- **Route paths:** Route groups are invisible in URLs. Clients is at `/clients`, not `/dashboard/clients`. Dashboard home is at `/dashboard`.
- **Motion:** Subtle transitions (200ms ease-out), no bouncy animations. Card hover: `-translate-y-0.5` + shadow lift.

## Design Principles
- **Dark-first, near-black.** `:root` background `#0F0F0F`, cards `#141414`, sidebar `#080808`. No warm-brown — pure dark with warm light.
- **Brand gradient: fire → gold → cream** — `#E55A3A` → `#F0A830` → `#F5EDD0`. Used on: wordmark, primary buttons, active nav indicator, hero elements. Never as large background fills.
- **Surface depth hierarchy** — sidebar (`#080808`) → bg (`#0F0F0F`) → cards (`#141414`) → inputs (`#1C1C1C`) → hover (`#242424`). Tailwind tokens: `surface-0` through `surface-4`.
- **Epilogue** for display/headings (`--font-display`), **DM Sans** for body (`--font-body`), JetBrains Mono for code/data (`--font-code`).
- Clean, dramatic, warm light against darkness — "golden hour on a Friday afternoon"
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

## Infrastructure
- **App domain:** `itsfriday.dev` (Vercel, registered via Vercel, nameservers: Vercel)
- **Supabase domain:** `api.itsfriday.dev` → CNAME → `izfblnrrxlvzuvxeexod.supabase.co` (custom domain addon)
- **Supabase auth callback:** `https://api.itsfriday.dev/auth/v1/callback`
- **Google OAuth client:** project `i-t-s-f-r-i-d-a-y` in Google Cloud Console — redirect URI: `https://api.itsfriday.dev/auth/v1/callback`
- **GitHub OAuth app:** `friday` in github.com/settings/developers — callback: `https://api.itsfriday.dev/auth/v1/callback`
- **NEXT_PUBLIC_SUPABASE_URL:** `https://api.itsfriday.dev` (both local and Vercel)
- **Vercel Deployment Protection:** currently ON — disable in Project Settings → Deployment Protection when ready to go public

## What's Done
- [x] GitHub repo created (private)
- [x] Next.js 16 scaffold with TypeScript, Tailwind v4, Turbopack
- [x] shadcn/ui initialized (button, input, label, card, separator, avatar, badge, dropdown-menu, sheet, dialog, tooltip, textarea)
- [x] All dependencies installed (Prisma, Supabase, Stripe, Resend, dnd-kit, zod, react-hook-form, lucide-react, date-fns)
- [x] Full Prisma schema written (13 models) and pushed to Supabase
- [x] Supabase project connected (MCP configured for direct management)
- [x] Vercel linked (auto-deploys from `main` via GitHub)
- [x] **Dark-first near-black palette** in globals.css — fire/gold/cream brand tokens, surface scale, gradient utilities (see Full UI overhaul entry below)
- [x] Fonts configured (Epilogue, DM Sans, JetBrains Mono via next/font)
- [x] Agent skills installed (6 skills)
- [x] **Auth system complete:** signup, login, logout (email/password)
- [x] **Route protection:** middleware redirects unauthenticated → /login, authenticated → /dashboard
- [x] **User sync:** Prisma User upserted from Supabase auth UUID on each dashboard request
- [x] **Dashboard sidebar:** collapsible sidebar (256px/64px), golden active indicator, mobile Sheet overlay, Settings nav item
- [x] **Dashboard home:** time-aware greeting, 3 stat cards (clickable → clients/projects), recent activity feed, overdue invoice warning
- [x] **Client CRUD:** create, list (card grid + search filter), edit (sheet slide-over), delete (confirmation dialog) — all with ownership verification
- [x] **Client detail page:** header with avatar/contact info, project grid with add/edit/delete, "Copy portal link" button
- [x] **Project management:** create/edit/delete projects per client, projects list page with search filter
- [x] **Kanban board:** drag-and-drop columns and cards (dnd-kit), add/edit/delete cards and columns, default columns created on project creation, "Set up board" empty state, overdue due dates shown in coral, column delete confirmation when has cards
- [x] **Quick status change:** dropdown on project header to change status in one click (logs activity)
- [x] **File uploads:** Supabase Storage upload dropzone + file list with download/delete/review links, MIME type icons, public URLs
- [x] **File deliverable toggle:** star button per file marks it as client deliverable (shown in portal Deliverables section)
- [x] **Invoice system:** create invoices with line items + live totals, DRAFT→SENT→PAID status workflow, mark paid button, overdue date indicator, delete draft invoices, summary stats (total/outstanding/paid)
- [x] **Design review:** image annotation with numbered pin-drop comments, threaded replies, resolve/unresolve, approve/request changes review status — at `/projects/[id]/review/[fileId]`
- [x] **Activity log:** `logActivity()` helper hooked into file uploads, invoice status changes, review actions, project creation, status changes; timeline feed at `?tab=activity`
- [x] **Project page polish:** Quick status dropdown + Edit button in project header, Board/Files/Invoices/Activity tabs
- [x] **Client portal:** shareable `/portal/[clientId]` — read-only project list with status, files, invoices; project detail with board columns, deliverables, all files, invoice line items; portal footer; welcome message from settings
- [x] **Settings page:** update display name, brand color (with color picker), welcome message for portal; account info (plan, member since)
- [x] **Branded 404 page:** with friday wordmark and "Back to dashboard" link
- [x] Build clean, 13 routes (+ not-found), TypeScript passing
- [x] **Google + GitHub OAuth:** both providers working — `oauthSignIn` server action in `(auth)/actions.ts`, shared `OAuthButtons` component in `(auth)/oauth-buttons.tsx`
- [x] **Production domain:** `itsfriday.dev` added as Vercel project domain (Production environment)
- [x] **Supabase custom domain:** `api.itsfriday.dev` — CNAME + TXT verified, activated
- [x] **Vercel env vars:** all pushed to production (DATABASE_URL, SUPABASE keys, Stripe, Resend)
- [x] **Full UI overhaul:** near-black palette (surface-0 through surface-4), fire/gold/cream gradient brand system, gradient primary button with glow, dark glass cards, gradient text + animated gradient utilities, staggered `animate-fade-up` page entry animations
- [x] **Font system updated:** Epilogue (display/headings) + DM Sans (body) replacing Plus Jakarta Sans + Inter; configured via `next/font/google` with CSS variable names `--font-display` / `--font-body`
- [x] **Official brand logos integrated:** `<Emblem>` and `<Logo>` React SVG components in `src/components/brand/`; transparent-background static assets in `public/brand/`; SVG favicon at `src/app/icon.svg` (auto-detected by Next.js App Router)

## What's Next
- [ ] Stripe — payment link on client portal invoice; re-enable Supabase email confirmation for production
- [ ] Email via Resend — notify client when invoice sent / file uploaded
- [ ] Client portal auth — magic links via Supabase (currently client ID = access token, MVP acceptable)
- [ ] Landing page — replace placeholder `/` with a real marketing page (use `text-gradient-brand`, `animate-fade-up`, `<Logo>` — consistent with new brand system)

## Important Notes
- **Next.js 16:** Uses `proxy.ts` instead of `middleware.ts` (renamed convention). The exported function must be named `proxy`, not `middleware`.
- **Prisma 7:** Requires an adapter (`@prisma/adapter-pg`). Cannot instantiate `new PrismaClient()` without passing `{ adapter }`. The generated client lives in `src/generated/prisma/` (gitignored) — import from `@/generated/prisma/client`, not `@/generated/prisma`.
- **Prisma generate:** Must run `npx prisma generate` after cloning or after schema changes, before the build will pass. On Vercel, the build script is `prisma generate && next build` — the generated client is gitignored and must be generated at build time.
- **Prisma connections:** `DATABASE_URL` = transaction pooler (port 6543, pgbouncer, for runtime). `DIRECT_URL` = session pooler (port 5432, for migrations/DDL). Host is `aws-1-us-east-1` (not `aws-0`).
- **Prisma schema errors:** `.error.issues[0].message` (not `.errors`) for zod validation messages.
- **Middleware static assets:** Must skip `/_next/`, `/api/`, and paths with `.` (file extensions) early — otherwise CSS/JS/images get redirected to /login and the page renders completely unstyled.
- **shadcn/ui asChild not supported:** This version uses base-ui primitives. Apply className directly on `DropdownMenuTrigger`, `SheetTrigger`, `TooltipTrigger`, etc. Use `<Link className={buttonVariants()}>` instead of `<Button asChild><Link>`.
- **Brand colors as CSS vars:** `--color-fire` (`#E55A3A`), `--color-gold` (`#F0A830`), `--color-cream` (`#F5EDD0`), `--color-sage`, `--color-coral`. Surface scale: `--color-surface-{0..4}` = `#080808` / `#0F0F0F` / `#141414` / `#1C1C1C` / `#242424`. Tailwind tokens: `bg-fire`, `text-gold`, `from-fire`, `to-cream`, `bg-surface-2`, etc.
- **Tailwind opacity variants:** Use `bg-fire/20` etc. — these work without any explicit opacity config in Tailwind v4.
- **SVG brand components:** `<Emblem>` and `<Logo>` live in `src/components/brand/`. Both are React client components using `useId()` to generate unique gradient/clipPath IDs — required to prevent SVG ID collisions when rendered multiple times on a page. The `useId()` value contains `:` characters which are invalid in XML IDs; strip with `.replace(/:/g, "")`.
- **Brand asset static files:** `public/brand/emblem.svg` and `public/brand/logo-full.svg` are transparent-background SVGs for use in emails/embeds. The original Figma exports had a dark `<rect class="cls-2" fill="#111"/>` background — this was stripped so the clipPath+gradient approach renders on any background.
- **Figma MCP screenshot rate limit:** View-seat accounts hit tool call limits on `get_screenshot`. Fall back to Chrome DevTools MCP (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__take_screenshot`) for visual verification.
- **User ID strategy:** Prisma User.id = Supabase auth.users UUID. Set explicitly on creation, not auto-generated. This means no separate supabaseId field needed.
- **Supabase email confirmation:** Disabled for dev (Auth → Providers → Email → "Confirm email" off). Re-enable for production.
- **Testing UI:** Always use Chrome DevTools MCP (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`) to take a screenshot and visually verify before asking the user to test.
- **Server action FormData prefixing bug:** When calling `await serverAction(arg0, formData)` directly from client code, Next.js prefixes field names with the argument index (`title` → `1_title`). Fix: pass plain string args instead of FormData, or use `action={serverAction}` directly on a `<form>` element (no wrapper function).
- **Supabase Storage:** Use `createAdminClient()` (service role, bypasses RLS) for server-side uploads. Bucket: `project-files` (public). Storage path pattern: `{userId}/{projectId}/{timestamp}-{sanitized-filename}`.
- **Review button on image files:** Only shows for `mimeType.startsWith("image/")`. Links to `/projects/[id]/review/[fileId]`.
- **Activity logging:** Import `logActivity` from `./log-activity` in any server action. It wraps in try/catch — never throws. Prisma JSON metadata must be cast: `metadata as Prisma.InputJsonValue`.
- **OAuth providers:** Google + GitHub both enabled. Credentials go into Supabase dashboard (Auth → Providers) — NOT into Next.js env vars. The app only calls `signInWithOAuth({ provider })`.
- **Vercel project domains:** Must be added via Vercel dashboard (Settings → Domains) — the CLI OAuth token doesn't have domain management API scope. `vercel alias` creates static per-deployment aliases that don't auto-update on new deploys.
- **Vercel DNS management:** `vercel dns add <domain> <subdomain> <type> <value> --scope <team>` — works instantly since itsfriday.dev uses Vercel nameservers. Used for Supabase custom domain CNAME + ACME TXT challenge.
- **Supabase custom domain setup:** requires (1) CNAME `api` → `[ref].supabase.co` and (2) TXT `_acme-challenge.api` → value from Supabase dashboard. After activation, update `NEXT_PUBLIC_SUPABASE_URL` in both `.env.local` and Vercel env vars.
- **Vercel env vars on new projects:** don't auto-populate — push manually: `while IFS='=' read -r key value; do printf '%s' "$value" | vercel env add "$key" production --force; done < .env.local`
- **GitHub OAuth client IDs:** can start with letter O (not zero) — always copy-paste from the dashboard, never retype.
- **oauthSignIn action:** uses `NEXT_PUBLIC_APP_URL` for the redirectTo — correct for both dev and prod without changes.
- **Client portal:** Routes at `/portal/[clientId]` — public (no auth). Middleware skips paths starting with `/portal`. Access token = client cuid (hard to guess, not cryptographically secure — acceptable for MVP).
- **Portal URL from dashboard:** Client detail page has "Copy portal link" button — copies `window.location.origin + "/portal/" + clientId`.

## Off Limits
- Don't push directly to `main` — use feature branches, merge when tested
- Don't change Prisma schema without running `prisma db push` or a migration
- No platform transaction fees on payments — Stripe standard rates only
- Minimize Vercel deploys — each push to `main` costs. Test locally first, build before pushing.
