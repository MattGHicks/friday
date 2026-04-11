---
name: friday-git-sync
description: >
  ALWAYS use this skill at the start of every heartbeat before doing any work.
  Syncs the local repo with the latest code from GitHub so you have up-to-date
  CLAUDE.md, docs, skills, and source code. Without this, you may be working
  against stale context.
---

# Friday Git Sync

## When to Use

Run this at the **very start** of every heartbeat, before reading any files or starting work.

## Procedure

0. Ensure git can access this repo (required in the Docker container):
   ```bash
   git config --global --add safe.directory /home/matt/projects/friday 2>/dev/null
   ```

1. Pull latest from main:
   ```bash
   cd /home/matt/projects/friday && git pull origin main --ff-only 2>&1
   ```

2. If pull fails due to local changes (uncommitted work from a previous agent run):
   ```bash
   git stash && git pull origin main --ff-only && git stash pop
   ```

3. If there are merge conflicts after stash pop, abandon the stash and work on the clean main:
   ```bash
   git stash drop
   ```

4. After pulling, re-read `CLAUDE.md` to get the latest conventions and project state.

5. If `package.json` changed (check with `git diff HEAD~1 --name-only | grep package.json`):
   ```bash
   npm install && npx prisma generate
   ```

## Why This Matters

Multiple agents and a human developer all push to the same repo. Without pulling first, you risk:
- Working against outdated code that's already been changed
- Missing new conventions added to CLAUDE.md
- Creating merge conflicts by editing files that were already modified
- Using stale skills or docs that have been updated
