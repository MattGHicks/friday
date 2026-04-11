---
name: friday-conventions
description: >
  Friday project conventions and technical constraints. Use when working in the
  Friday repo — covers dark-first palette, brand tokens, font system, shadcn/ui
  gotchas, Prisma 7 adapter pattern, Next.js 16 proxy.ts, and workflow rules.
---

# Friday Conventions

## Design System
- Dark-first near-black palette: bg #0F0F0F, cards #141414, sidebar #080808, inputs #1C1C1C, hover #242424
- Brand gradient: fire #E55A3A to gold #F0A830 to cream #F5EDD0. Used on wordmark, primary buttons, active nav. Never as large bg fills.
- Surface depth: surface-0 #080808 through surface-4 #242424
- Fonts: Epilogue for headings (font-display), DM Sans for body (font-body), JetBrains Mono for code (font-code)
- Motion: 200ms ease-out transitions. Card hover: -translate-y-0.5 + shadow lift.

## shadcn/ui
- This version uses base-ui primitives. NO asChild support.
- Apply className directly on triggers (DropdownMenuTrigger, SheetTrigger, etc.)
- Use Link with className={buttonVariants()} instead of Button asChild wrapping Link

## Next.js 16
- Uses proxy.ts not middleware.ts. Exported function must be named proxy.
- Proxy must skip /_next/, /api/, and paths with file extensions early.

## Prisma 7
- Requires adapter: @prisma/adapter-pg. Cannot instantiate PrismaClient without adapter option.
- Generated client at src/generated/prisma/ (gitignored). Import from @/generated/prisma/client.
- Must run npx prisma generate after clone or schema changes.
- DATABASE_URL = transaction pooler port 6543. DIRECT_URL = session pooler port 5432 for migrations.

## Workflow
- Feature branches only. Never push directly to main.
- Run npx next build before marking any ticket done.
- Commit messages end with Co-Authored-By: Claude.
- Every push to main triggers a Vercel build. Minimize unnecessary deploys.
