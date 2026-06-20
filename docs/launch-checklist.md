# Friday Launch Checklist

Manual production-ops items Matt does himself before going public. Each item has a `Done?` checkbox to tick off as you go.

## 1. Vercel Deployment Protection

- [ ] Vercel dashboard → friday project → **Settings → Deployment Protection**
- [ ] Set Production deployments to **Public** (currently behind protection per CLAUDE.md)
- [ ] Confirm `https://itsfriday.dev/` resolves anonymously in an incognito window

## 2. Stripe — test → live keys

In Vercel **Settings → Environment Variables** (Production scope):

- [ ] `STRIPE_SECRET_KEY` — replace with `sk_live_…`
- [ ] `STRIPE_PUBLISHABLE_KEY` — replace with `pk_live_…` (Build + Runtime — it's `NEXT_PUBLIC_*`)
- [ ] `STRIPE_CLIENT_ID` — Connect OAuth client id (live mode)
- [ ] `STRIPE_WEBHOOK_SECRET` — temporarily leave; we'll regenerate in step 3

Redeploy production after the keys are swapped so the env vars take effect.

## 3. Stripe webhook — re-create with live signing secret

- [ ] Stripe Dashboard → **Developers → Webhooks** (in **live** mode)
- [ ] **Add endpoint**: `https://itsfriday.dev/api/stripe/webhooks`
- [ ] Subscribe to: `checkout.session.completed`, `account.updated` (Stripe Connect)
- [ ] Copy the signing secret → paste into Vercel env as `STRIPE_WEBHOOK_SECRET`
- [ ] Redeploy production
- [ ] Smoke test: run a real $1 payment from a personal card and confirm the invoice flips `PAID` in the dashboard

## 4. Resend inbound email webhook

- [ ] Resend Dashboard → **Webhooks**
- [ ] Confirm there's an active webhook pointed at `https://itsfriday.dev/api/email/inbound`
- [ ] Event types: at minimum `email.received` (Resend's inbound parse event)
- [ ] If it's pointed at a staging URL, edit → swap to production
- [ ] Send a test reply to a portal message and confirm it lands in the project's message thread

## 5. App URL env

- [ ] Vercel env: `NEXT_PUBLIC_APP_URL=https://itsfriday.dev` (Build + Runtime, Production scope)
- [ ] Audit all server-side `process.env.NEXT_PUBLIC_APP_URL ?? "https://itsfriday.dev"` fallbacks — should match
- [ ] Redeploy production

## 6. Resend DKIM / SPF / MX

- [ ] Resend Dashboard → **Domains → itsfriday.dev**
- [ ] Confirm DKIM, SPF, and MX records all show ✅
- [ ] If anything is yellow/red: copy the missing record into Vercel DNS (since Vercel manages itsfriday.dev nameservers) and wait for propagation
- [ ] Send a test email from `hello@itsfriday.dev` to a Gmail address and check the headers — `dkim=pass` and `spf=pass`

## 7. Supabase advisors clean

- [ ] Supabase Dashboard → friday project → **Reports → Advisors**
- [ ] Confirm 0 ERROR-severity lints (RLS coverage on all Prisma tables — see `decisions/002-friday-rls-strategy` in vault)
- [ ] If WARN lints appear: open each, decide whether to fix now or document as accepted

---

## Deferred to follow-up work

Items in the original launch plan that didn't make this PR. Capture them so they aren't forgotten:

### Phase E — Playwright E2E suite (NOT shipped)

The launch plan called for 8+ Playwright specs covering signup-onboarding, lead-to-paid-deposit, file-upload-large, review-annotate-approve, invoice-pay, portal-magic-link, portal-message-roundtrip, and calendar-meeting. **This was not delivered in this PR.** Reasons:

- Writing reliable Playwright specs against this stack (Stripe Checkout, real Supabase auth, Resend, magic-link portals) requires careful test fixtures, seeded data, dev-token auth helpers (already exist in `scripts/dev-tokens.mjs`), and stable selectors.
- Doing it inside the launch sprint risked shipping flaky tests that would block future PRs.
- The work is well-scoped: ~1-2 dedicated sessions to build the fixture layer + write specs.

**Next action:** open a fresh branch `feature/e2e-suite` and tackle Playwright separately. Use `scripts/dev-tokens.mjs` as the auth bypass for both freelancer and portal client sessions.

### Phase D — Lighthouse color-contrast findings (design judgment)

Landing page Lighthouse: Accessibility 93 (target 95). The two failures:

1. **`landmark-one-main`** — FIXED in this PR (wrapped sections in `<main>`).
2. **`color-contrast`** — multiple elements inside the embedded product-mockup hit 2–4:1 ratios on dark-on-dark text (`text-cream/10`, `text-cream/30` against `#141414`). These are deliberate visual-hierarchy choices in the mockup, not body copy. Fixing them requires a design pass — either bump opacity values across the mockup or accept the trade-off and document it.

Pricing / Help / Terms / Privacy do not have the same issue (no product mockups).

### Phase B6 — onboarding "share portal" fix

Shipped: the step now counts a sent quote or invoice as a portal share, in addition to the explicit `firstPortalInviteSentAt` flag. If you find a case where it's still wrong, that's a follow-up.

### Marketing site C1 — landing polish

The landing already has hero, product mock, features section, three-step explainer, testimonials, and final CTA. Meaningful "polish" beyond that is a design pass — sharper hero copy, real product screenshots replacing the in-DOM mockups, social-proof logos when they exist. Not blocking launch.
