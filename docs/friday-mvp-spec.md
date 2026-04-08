# Friday — MVP Product Spec & Build Plan

**The lightweight client portal for freelance designers who are done overpaying for tools built for wedding photographers.**

---

## Product Vision

Friday is a branded client portal and project management tool built specifically for freelance designers and developers. It replaces the messy stack of Notion + Google Drive + email threads + HoneyBook with a single, beautiful app that makes you look professional and keeps clients in the loop without constant check-in emails.

**One-liner pitch:** "It's Friday. Every day."

**Target user:** Solo freelance designers, web developers, copywriters, and small creative studios (1-5 people) managing 3-15 active clients at a time.

---

## Competitive Positioning

| Feature | HoneyBook ($29-129/mo) | Dubsado ($28-44/mo) | Bonsai ($9/mo) | Plutio ($19/mo) | **Friday ($14-29/mo)** |
|---------|----------------------|---------------------|----------------|-----------------|--------------------------|
| Branded client portal | Essentials+ only | Yes | Basic | Yes | **Yes (all plans)** |
| Visual design review | No | No | No | No | **Yes — pin comments on images** |
| Project status board | No | Basic | No | Yes | **Yes — per-client Kanban** |
| File sharing/versioning | Basic | Basic | Basic | Yes | **Yes — organized by project** |
| Simple invoicing | Yes + 3% fee | Yes | Yes | Yes | **Yes — Stripe only (no platform fee)** |
| Contracts/e-sign | Yes | Yes | Yes | Yes | **Yes — simple templates** |
| Setup time | 1-2 hours | Weeks | 30 min | 1-2 hours | **Under 15 minutes** |
| Built for designers | No (event-based) | No (event-based) | Partial | Generic | **Yes — visual-first** |

**Key differentiators:**
1. Visual design review with annotation (nobody else does this in a client portal)
2. No platform transaction fees — just standard Stripe rates
3. Designed BY a designer FOR designers — the UI itself is a selling point
4. 15-minute setup to first client invite
5. Half the price of HoneyBook with more post-booking functionality

---

## MVP Feature Spec (v1.0)

### Phase 1 — Core Portal (Weeks 1-3)

#### 1.1 Authentication & Onboarding
- Freelancer sign-up with email/password (Supabase Auth)
- Google OAuth option
- Onboarding wizard: name, logo upload, brand color, subdomain choice
- Client invite system: freelancer enters client email → client gets magic link access (no password needed)

#### 1.2 Branded Client Portal
- Each freelancer gets: `yourname.itsfriday.dev` (subdomain)
- Client-facing dashboard showing:
  - Active projects with status
  - Recent activity / updates
  - Outstanding invoices
  - Files ready for download
- Freelancer's logo, brand colors, and custom welcome message
- Clean, minimal UI — the portal IS the brand impression

#### 1.3 Project Management
- Create projects per client (name, description, timeline, status)
- Simple Kanban board per project: **Intake → In Progress → Review → Revisions → Complete**
- Columns are customizable (add/rename/reorder)
- Each card = a deliverable or task with:
  - Title and description
  - Status
  - Due date
  - File attachments
  - Activity log
- Client sees: project status board (read-only view of where things stand)
- Freelancer sees: full management view with drag-and-drop

#### 1.4 File Sharing & Deliverables
- Upload files to any project (drag-and-drop)
- Organized by project with version history
- "Deliverables" section: final files marked for client download
- File types: images, PDFs, ZIPs, Figma links, any URL
- Storage: Supabase Storage (S3-backed)
- Free tier: 2GB per account | Pro: 10GB

### Phase 2 — Review & Communication (Weeks 3-5)

#### 2.1 Visual Design Review ⭐ (Key Differentiator)
- Upload design images/screenshots to a review board
- Client clicks anywhere on the image to drop a pin + comment
- Threaded replies on each pin
- Mark comments as resolved
- Version comparison: upload v2, see it side-by-side with v1
- Annotation tools: pin marker, rectangle highlight, freeform arrow
- Status per review: **Pending Review → Changes Requested → Approved**

**Technical approach:**
- Canvas-based annotation layer over uploaded images
- Store pin coordinates + comments in Supabase
- Real-time updates via Supabase Realtime subscriptions
- Image storage in Supabase Storage with CDN

#### 2.2 Activity Feed & Notifications
- Per-project activity timeline (who did what, when)
- Email notifications to clients on:
  - New file uploaded
  - Status change
  - Review requested
  - Invoice sent
- Email notifications to freelancer on:
  - Client left feedback / comment
  - Invoice paid
  - Contract signed
- In-app notification bell
- Email digest option (daily summary vs. real-time)

#### 2.3 Messaging (Simple)
- Per-project message thread (not a full chat app)
- Freelancer and client can exchange messages
- File attachments in messages
- Replaces the "checking in on status" emails

### Phase 3 — Billing & Contracts (Weeks 5-7)

#### 3.1 Invoicing
- Create invoices: line items, quantities, rates, tax
- Send invoice to client via portal + email
- Client pays directly via Stripe Checkout (credit card or ACH)
- **No platform fee** — freelancer connects their own Stripe account (Stripe Connect)
- Invoice statuses: Draft → Sent → Viewed → Paid → Overdue
- Automatic payment reminders (3 days before due, on due date, 3 days overdue)
- Invoice PDF generation for records
- Dashboard showing: total outstanding, total paid this month, overdue

#### 3.2 Proposals & Contracts (Simple)
- Template-based proposals: project scope, timeline, deliverables, pricing
- Client views in portal and clicks "Approve"
- Simple e-signature capture (typed name + timestamp + IP = legally sufficient for freelance work)
- Contract templates: basic freelance agreement, NDA, project scope
- Signed contracts stored in project files automatically

#### 3.3 Quick Quotes
- One-page quote generator: scope + price + expiration date
- Client can accept/decline in portal
- Accepted quote auto-converts to project

### Phase 4 — Polish & Launch Prep (Weeks 7-8)

#### 4.1 Dashboard & Analytics (Freelancer)
- Revenue overview: this month, last month, YTD
- Active projects count
- Outstanding invoices total
- Client list with last activity date
- Simple charts (monthly revenue trend)

#### 4.2 Settings & Customization
- Profile: name, bio, logo, brand color, timezone
- Email templates: customize notification copy
- Subdomain management
- Stripe connection management
- Data export (CSV of clients, invoices, projects)

#### 4.3 Mobile Responsiveness
- Full responsive design (not a native app — responsive web)
- Client portal must work perfectly on phone (clients check on mobile)
- Freelancer dashboard optimized for desktop, functional on tablet

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 14+ (App Router) | You know it cold. SSR for portal pages, RSC for dashboard |
| **Styling** | Tailwind CSS + shadcn/ui | Fast, consistent, professional look |
| **Backend/API** | Next.js API Routes + Server Actions | Keep it simple, no separate backend |
| **Database** | Supabase (PostgreSQL) | Auth, DB, Storage, Realtime — all in one |
| **Auth** | Supabase Auth | Magic links for clients, email/OAuth for freelancers |
| **Payments** | Stripe Connect (Standard) | Freelancers connect own Stripe, no platform fee |
| **File Storage** | Supabase Storage | S3-backed, CDN, signed URLs for private files |
| **Realtime** | Supabase Realtime | Live updates on review comments and project status |
| **Email** | Resend | Transactional emails, notifications |
| **Hosting** | Vercel | Deploy on push, edge functions, analytics |
| **ORM** | Prisma | Type-safe DB queries, migrations |
| **Image Annotation** | Custom Canvas component | Lightweight, no heavy dependencies |

**Estimated infrastructure cost at launch:** ~$30-50/month (Supabase Pro + Vercel Pro + Resend starter + domain)

---

## Database Schema (Core Tables)

```
users (freelancers)
├── id, email, name, avatar_url, brand_color, logo_url
├── subdomain (unique), stripe_account_id
├── plan (free | pro), created_at

clients
├── id, freelancer_id (FK), email, name, company
├── avatar_url, phone, notes, created_at

projects
├── id, freelancer_id (FK), client_id (FK)
├── name, description, status (enum)
├── start_date, due_date, created_at

project_columns (kanban)
├── id, project_id (FK), name, position

project_cards (tasks/deliverables)
├── id, column_id (FK), project_id (FK)
├── title, description, due_date, position

files
├── id, project_id (FK), uploaded_by
├── name, url, size, type, version, created_at
├── is_deliverable (boolean)

reviews (design review boards)
├── id, project_id (FK), file_id (FK)
├── status (pending | changes_requested | approved)
├── created_at

review_annotations
├── id, review_id (FK), author_id, author_type
├── x, y (pin coordinates as % of image)
├── comment, is_resolved, parent_id (threading)

invoices
├── id, project_id (FK), client_id (FK), freelancer_id (FK)
├── line_items (jsonb), subtotal, tax, total
├── status (draft | sent | viewed | paid | overdue)
├── due_date, paid_at, stripe_payment_intent_id

contracts
├── id, project_id (FK), client_id (FK)
├── title, content (rich text), template_id
├── signed_at, signer_name, signer_ip

messages
├── id, project_id (FK), sender_id, sender_type
├── content, created_at

activity_log
├── id, project_id (FK), actor_id, actor_type
├── action (enum), metadata (jsonb), created_at

notifications
├── id, user_id, user_type
├── type (enum), message, read_at, created_at
```

---

## Build Timeline (8-Week Sprint)

### Week 1: Foundation
- [ ] Project setup: Next.js + Supabase + Prisma + Tailwind + shadcn/ui
- [ ] Auth system: freelancer signup/login, Supabase Auth config
- [ ] Database schema: initial migration with core tables
- [ ] Layout: dashboard shell, sidebar nav, responsive scaffold
- [ ] Basic CRUD: create/list/edit clients

### Week 2: Project Management Core
- [ ] Project CRUD: create, edit, archive projects
- [ ] Kanban board: drag-and-drop columns and cards (dnd-kit)
- [ ] Card detail view: title, description, due date, attachments
- [ ] Project status flow with visual indicators

### Week 3: Client Portal & File Sharing
- [ ] Subdomain routing (middleware-based)
- [ ] Client magic link auth flow
- [ ] Client portal pages: dashboard, project view, files
- [ ] File upload system: drag-and-drop, organized by project
- [ ] Deliverables section: mark files for client download
- [ ] Brand customization: logo, color, welcome message

### Week 4: Visual Design Review ⭐
- [ ] Review board: upload images for client feedback
- [ ] Canvas annotation layer: click-to-pin comments
- [ ] Threaded comments on pins
- [ ] Resolve/unresolve comments
- [ ] Review status flow: pending → changes requested → approved
- [ ] Real-time updates via Supabase Realtime

### Week 5: Messaging & Notifications
- [ ] Per-project message thread
- [ ] Activity feed (auto-generated from actions)
- [ ] Email notification system (Resend integration)
- [ ] Notification preferences
- [ ] Client email notifications: review requested, file uploaded, invoice sent

### Week 6: Invoicing & Payments
- [ ] Stripe Connect onboarding flow
- [ ] Invoice builder: line items, tax, notes
- [ ] Invoice sending: portal view + email notification
- [ ] Stripe Checkout integration for client payments
- [ ] Payment status tracking + webhooks
- [ ] Automatic payment reminders (Vercel Cron)
- [ ] Invoice PDF generation

### Week 7: Contracts & Proposals
- [ ] Contract template system
- [ ] Proposal builder: scope, timeline, pricing
- [ ] Client approval/e-signature flow
- [ ] Signed document storage
- [ ] Quick quote → project conversion

### Week 8: Polish, Analytics & Launch Prep
- [ ] Freelancer dashboard: revenue charts, project stats
- [ ] Settings page: profile, branding, Stripe, exports
- [ ] Mobile responsiveness pass (especially client portal)
- [ ] Error handling and edge cases
- [ ] Landing page (marketing site)
- [ ] Stripe billing for Friday itself (subscription management)
- [ ] Beta invite system

---

## Pricing Model

### Free Tier (Validation)
- 2 active clients
- 1 active project per client
- 500MB storage
- Friday branding on portal ("Powered by Friday")
- Basic invoicing (manual send)

### Solo — $14/month
- Unlimited clients
- Unlimited projects
- 2GB storage
- Custom branding (logo + colors)
- Visual design review
- Invoicing with auto-reminders
- Contract templates
- Remove Friday branding

### Pro — $29/month
- Everything in Solo
- Custom subdomain (yourname.itsfriday.dev)
- 10GB storage
- Priority support
- Revenue analytics dashboard
- Multiple contract templates
- Client activity insights
- API access (future)

### Revenue Projections (Conservative)
| Milestone | Users | MRR | Timeline |
|-----------|-------|-----|----------|
| Beta launch | 20 free users | $0 | Month 1 |
| First paying users | 10 Solo + 5 Pro | $285 | Month 2-3 |
| Early traction | 50 Solo + 20 Pro | $1,280 | Month 4-6 |
| Sustainable | 150 Solo + 50 Pro | $3,550 | Month 8-12 |
| Growth | 400 Solo + 150 Pro | $9,950 | Month 12-18 |

At 400 Solo + 150 Pro users = ~$10K MRR = sellable asset at 35-40x = **$350K-400K valuation**

---

## Go-to-Market Strategy

### Pre-Launch (During Build)
1. **Build in public** on X/Twitter — share progress screenshots, design decisions, feature previews
2. **Landing page with waitlist** — collect emails from day 1
3. **Reddit presence**: r/freelance, r/web_design, r/graphic_design, r/UI_Design — answer questions, mention the pain naturally
4. **"I canceled HoneyBook" content** — blog post or Twitter thread about why you left and what you're building instead (this will resonate hard right now)

### Launch (Week 8-10)
1. **Product Hunt launch** — schedule for a Tuesday, prepare assets
2. **Indie Hackers post** — "I built the client portal I wish existed as a freelance designer"
3. **Designer communities**: Dribbble, Figma Community, Behance, Design Twitter
4. **Free tier as funnel** — let people try it with 2 clients, upgrade when they need more
5. **Lifetime deal consideration** — 50 LTD slots at $199 (one-time) to generate early cash + testimonials

### Ongoing Growth
- SEO content: "HoneyBook alternatives for designers", "best client portal for freelancers", "design review tools"
- Integration partnerships: Figma plugin (send frames to Friday for review)
- Referral program: "Give a friend 1 month free, get 1 month free"
- YouTube content: "How I manage 10+ design clients as a solo freelancer"

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Feature creep | Strict MVP scope — ship the 8-week version, iterate based on paying user feedback |
| Too many competitors | Positioning is everything — "for designers" not "for everyone." The visual review feature is the moat |
| Low initial traffic | Build in public starts day 1. HoneyBook frustration content is timely. Free tier removes friction |
| Stripe Connect complexity | Start with Standard accounts (simplest). Freelancers manage their own Stripe |
| Scope too big for 8 weeks | Phase 1-2 (portal + review) is the real MVP. Invoicing can launch as v1.1 if needed |
| Churn | Design review + client portal creates workflow lock-in. Hard to leave once clients are using it |

---

## What Makes This Winnable For You Specifically

1. **You are the user.** You run DigitalFish. You canceled HoneyBook. You know the pain.
2. **Your design skills are the moat.** In a market selling to designers, UI quality IS the product. You can make every competitor look dated.
3. **Your tech stack is the stack.** Next.js + Supabase + Prisma + Stripe is literally what this needs.
4. **Claude Code compresses the timeline.** An 8-week solo build is realistic with AI-assisted development.
5. **The timing is perfect.** HoneyBook's price hike exodus is happening NOW. People are actively searching for alternatives.
6. **The math works small.** You don't need 10,000 users. 200 paying users at $20/mo avg = $4K MRR = meaningful income.

---

*Document created: April 7, 2026
*Brand: Friday — itsfriday.dev**
*Version: 1.0 — MVP Spec*
