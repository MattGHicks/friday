# Friday

> A branded client portal for freelance designers — design review, invoicing, and file delivery in one calm space.

## Status
- **Stage:** building
- **Deployed:** no
- **Auto-deploy:** yes → push to `main` deploys to Vercel

## What This Is
Friday replaces the messy stack of Notion + Google Drive + email threads + HoneyBook with a single, beautiful client portal. Freelance designers get a branded space where clients can check project status, review designs with pin-drop comments, download deliverables, and pay invoices. Key differentiator: visual design review with image annotation.

## Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes + Server Actions
- **Database:** Supabase (PostgreSQL) + Prisma ORM
- **Auth:** Supabase Auth (magic links for clients, email/OAuth for freelancers)
- **Payments:** Stripe Connect (Standard) — no platform fee
- **File Storage:** Supabase Storage (S3-backed, CDN)
- **Realtime:** Supabase Realtime (live comments, status updates)
- **Email:** Resend (transactional notifications)
- **Hosting:** Vercel

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
    (auth)/           # Auth routes (login, signup, magic link)
    (dashboard)/      # Freelancer dashboard (requires auth)
    (portal)/         # Client-facing portal (subdomain-routed)
    api/              # API routes (webhooks, Stripe, etc.)
  components/         # Shared UI components
    ui/               # shadcn/ui base components
  lib/                # Utilities, types, Supabase client, Stripe helpers
prisma/
  schema.prisma       # Database schema
  migrations/         # Prisma migrations
public/               # Static assets
docs/                 # Product spec, brand bible
```

## Key Conventions
- **Styling:** Tailwind utility classes. Use the brand palette from the brand bible (Golden #E8A838, Midnight #1A1A2E, Warm White #FAFAF7, Sand #F0EBE3)
- **Typography:** Satoshi for headings, Inter for body, JetBrains Mono for data/code
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

## Active Work
- [ ] Project setup and initial scaffolding

## Off Limits
- Don't push to `main` directly — auto-deploy is on
- Don't change Prisma schema without a migration file
- No platform transaction fees on payments — Stripe standard rates only
