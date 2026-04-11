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

## What the Release Engineer Does

1. Push the branch to GitHub:
   ```bash
   git push origin feature/branch-name
   ```

2. Create a PR via `gh pr create`

3. Post a comment on the Paperclip ticket with the PR link AND a ready-to-run local test command:
   ```
   PR: https://github.com/MattGHicks/friday/pull/XX

   To test locally, run this in your terminal:
   git fetch origin && git checkout feature/branch-name && npm run dev
   ```
   Replace `feature/branch-name` with the actual branch name.

4. Set the ticket to `in_review`. Done — do not merge.

## What the Human Does

1. Copies the command from the ticket, runs it in their terminal
2. Tests at `http://localhost:3000`
3. Merges the PR on GitHub (or requests changes)
4. Main auto-deploys to production via Vercel
5. QA Engineer verifies production

## Why This Matters

Vercel preview deploys are disabled for feature branches (they waste build minutes and fail on incomplete work). Local testing is instant and free. Only merges to `main` trigger a Vercel deploy.
