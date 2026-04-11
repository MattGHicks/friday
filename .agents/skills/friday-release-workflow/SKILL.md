---
name: friday-release-workflow
description: >
  MANDATORY for all agents that write code (Backend Engineer, UX Designer).
  Defines how finished work gets from a feature branch to production.
  Use this at the END of every task that involves code changes.
---

# Friday Release Workflow

## The Golden Rule

**You NEVER mark a code task as "done".** Only the human board operator marks tasks as done after reviewing the Vercel preview deploy.

## When You Finish Writing Code

Follow these steps EXACTLY:

### Step 1: Verify your work
```bash
npx next build    # must pass with zero errors
npx tsc --noEmit  # must pass
```

### Step 2: Commit to your feature branch
```bash
git add -A
git commit -m "feat(FRI-XX): short description

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 3: Set ticket to "in_review"
Do NOT set it to "done". Set status to `in_review`.

### Step 4: Hand off to Release Engineer
Comment on the ticket:
```
@Release Engineer — feature complete on branch `feature/branch-name`. 
Build passes. Please push to origin and create a PR.
```

### Step 5: STOP
You are done. Do not merge. Do not push to main. Do not mark as done.

## What Happens Next (not your job)

1. Release Engineer pushes the branch to GitHub
2. Release Engineer creates a PR via `gh pr create`
3. Vercel automatically builds a preview deploy for the PR
4. Release Engineer comments the PR link and preview URL on the Paperclip ticket
5. The human board operator tests the preview URL
6. The human merges the PR on GitHub (or requests changes)
7. Main auto-deploys to production via Vercel
8. QA Engineer verifies production

## Why This Matters

Every push to main triggers a Vercel production deploy. The human MUST review changes before they go live. The Vercel preview URL on the PR is how they test without affecting production.
