---
name: friday-context
description: >
  Essential project context for Friday agents. Use at the start of any task
  to understand current priorities, recent decisions, and project state.
  This supplements CLAUDE.md with the "living memory" of the project.
---

# Friday — Project Context

## What Friday Is

A branded client portal for freelance designers. Designers get one place where clients can check project status, review designs with pin-drop comments, download deliverables, and pay invoices. The UI itself is the selling point — design quality IS the product.

## Current Stage: MVP Complete, Pre-Launch

The core app is built and deployed at https://itsfriday.dev (Vercel). 15 routes, 14 Prisma models, all working.

### What's Working End-to-End
- Auth (email/password + Google + GitHub OAuth)
- Client CRUD with company-first display + Contact CRUD
- Project management with kanban board (dnd-kit drag-and-drop)
- File uploads with Supabase Storage + deliverable toggle
- Design review with numbered pin-drop annotations, threaded replies, resolve/approve
- Invoice system (create with line items, DRAFT → SENT → PAID status, manual mark-paid)
- Activity logging (logActivity() helper hooked into all major actions)
- Client portal at /portal/[clientId] (read-only, public, no auth)
- Calendar with meetings (month-view, type-coded pills, side panel)
- CSV contact import (3-step wizard with duplicate detection)
- Settings page (name, brand color, welcome message, pipeline stage manager)
- Landing page (full marketing page with hero, features, how-it-works, CTA)
- Pipeline kanban (drag-and-drop by stage, separate from project list view)

### What's NOT Done (Priority Order)
1. **Stripe Connect** — package installed, ZERO imports in /src. Need: onboarding flow, payment link on portal invoices, webhook handler.
2. **Resend emails** — package installed, ZERO imports in /src. Need: invoice-sent + file-uploaded notifications with Friday-branded templates.
3. **Magic-link portal auth** — currently clientId cuid = access token. Need Supabase magic links.
4. **RLS audit** — Row Level Security policies not verified on any of the 14 tables.
5. **Email confirmation** — disabled for dev, must enable for production.
6. **Error monitoring** — no Sentry or error tracking.
7. **Orphaned models** — Contract, Message, Notification exist in schema but have zero UI or actions.
8. **Empty /api/ directory** — only a .gitkeep, no route handlers (Stripe webhooks will go here).

## Key Technical Decisions

- Next.js 16 uses `proxy.ts` (NOT `middleware.ts`)
- Prisma 7 requires adapter: `@prisma/adapter-pg`
- shadcn/ui has NO `asChild` — use `buttonVariants()` pattern
- Feature branches only — never push to main directly
- Every push to main triggers a Vercel build ($) — minimize deploys
- Run `npx next build` before marking any ticket done
- Server actions return `{ success: true, data }` or `{ success: false, error }` — not throws
- All Prisma queries filtered by `userId` — never return data across users

## Design System (Quick Reference)

- Background: #0F0F0F | Cards: #141414 | Sidebar: #080808
- Brand: fire #E55A3A → gold #F0A830 → cream #F5EDD0
- Headings: Epilogue | Body: DM Sans | Code: JetBrains Mono
- Gradients on wordmark + primary buttons + nav indicator only
- Motion: 200ms ease-out, card hover -translate-y-0.5 + shadow lift

## Brand Voice

Short sentences. Fragments fine. Confident, warm, never corporate. No "leverage", "synergy", "empower". Lowercase energy in casual contexts.

## The Team (Paperclip Agents)

- **CEO** — product vision, scope, ticket creation
- **CTO** — technical plans, PR review, manages team
- **Backend Engineer** — server actions, Prisma, Stripe, auth (renamed from Staff Engineer)
- **Release Engineer** — ships PRs, deploys to Vercel
- **QA Engineer** — build verification, visual QA
- **UX Designer** — brand compliance, visual polish
- **Growth Strategist** — landing page iteration, copy, acquisition

## Goal Hierarchy (Paperclip)

```
Ship Friday to paying freelancers — first 5 users by Q3 2026
├── Close revenue gaps (Stripe + Resend) [SHORT-TERM]
│   ├── Stripe Connect onboarding in Settings
│   ├── Payment link on portal invoices
│   ├── Stripe webhook handler
│   ├── Resend: invoice sent notification
│   └── Resend: file uploaded notification
├── Landing page [ACHIEVED]
├── Launch readiness [SHORT-TERM]
│   ├── RLS audit on all 14 models
│   ├── Magic-link portal auth
│   ├── Enable email confirmation
│   └── Error monitoring
├── Acquire first 5 designers [MEDIUM-TERM]
├── Scale to 50 users / $2k MRR [LONG-TERM]
├── Product expansion (contracts, messaging) [LONG-TERM]
└── Landing page iteration (A/B, testimonials) [LONG-TERM]
```

## Keeping Context Fresh

This file lives in `.agents/skills/friday-context/SKILL.md` and syncs via git. Update and push when priorities shift. All agents pull on next heartbeat.

For detailed conventions, always read `CLAUDE.md` at the repo root.
