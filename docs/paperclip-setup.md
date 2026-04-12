# Paperclip Setup — Friday

## Overview

Friday is managed by [Paperclip](https://github.com/paperclipai/paperclip) — an open-source AI agent orchestration platform running on the T630 homelab server.

- **Paperclip URL:** https://paperclip.mght630.com
- **Deployment:** Docker container on T630 (192.168.4.126)
- **Company:** friday (slug: FRI)
- **Project:** Friday App

## Infrastructure

### Docker Compose

Paperclip runs as two containers:
- `paperclip-paperclip-1` — the Paperclip server (ghcr.io/paperclipai/paperclip:latest)
- `paperclip-paperclip-db-1` — PostgreSQL 17 Alpine

Config at: `/home/matt/projects/paperclip/docker-compose.yml`

### Critical Volume Mounts

The Paperclip container has these bind mounts so agents can access the repo and Claude credentials:

```yaml
volumes:
  - paperclip-data:/paperclip              # Paperclip's own data
  - /home/matt/projects:/home/matt/projects # Shared repo access
  - /home/matt/.claude:/root/.claude        # Claude subscription auth
```

Without these mounts, agents can't access the Friday codebase or authenticate with Claude.

### T630 Runtime

- **Node.js:** 22.22.2 via nvm (required for Next.js 16 / Prisma 7)
- **Claude CLI:** v2.1.81+ (subscription login, not API key)
- **Friday repo clone:** `/home/matt/projects/friday`
- **Git remote:** git@github.com:MattGHicks/friday.git (SSH key in GitHub)

## Org Chart

```
CEO (Opus 4.6) — product vision, scope, ticket creation
├── CTO (Sonnet 4.6) — technical plans, PR review
│   ├── Backend Engineer (Sonnet 4.6) — server actions, Prisma, Stripe, auth
│   ├── Release Engineer (Sonnet 4.6) — ships PRs, Vercel deploys
│   ├── QA Engineer (Sonnet 4.6) — build verification, visual QA
│   └── UX Designer (Sonnet 4.6) — brand compliance, visual polish
└── Growth Strategist (Sonnet 4.6) — landing page, copy, acquisition
```

## Agent IDs

| Agent | ID |
|---|---|
| CEO | e5b64597-d9ba-404c-9f09-96480d06eb42 |
| CTO | feebbb3e-d7a6-4472-ba86-8fa238d5ff1d |
| Backend Engineer | ebf09ae9-42b8-44d4-8ce5-3625b85ec973 |
| Release Engineer | 24b122be-ba9d-4a24-8a95-5881b9f2a4ec |
| QA Engineer | 7afe3fd3-45f8-4509-addc-ef842fd70f27 |
| UX Designer | da55d7e8-0d5c-42f8-bda6-e923d6961567 |
| Growth Strategist | 1bd14731-df5f-49b1-bb6d-4771f01dcf6f |

## Company ID

`4775de13-4682-4c97-9afa-c3faeaff5e27`

## API Reference

Base: `https://paperclip.mght630.com/api`
Auth: Session cookies (browser) or Bearer token (agents)

### Key Endpoints

| Action | Method | Endpoint |
|---|---|---|
| List agents | GET | `/api/companies/{companyId}/agents` |
| Update agent | PATCH | `/api/agents/{agentId}` |
| Sync skills | POST | `/api/agents/{agentId}/skills/sync?companyId={companyId}` |
| List issues | GET | `/api/companies/{companyId}/issues` |
| Create issue | POST | `/api/companies/{companyId}/issues` |
| Update issue | PATCH | `/api/issues/{issueId}` |
| List goals | GET | `/api/companies/{companyId}/goals` |
| Create goal | POST | `/api/companies/{companyId}/goals` |

### Known API Quirks

- `PUT /api/agents/{id}/instructions-bundle/file` — writes to disk but may not persist in UI if the agent was never saved via the UI first. Workaround: delete the file on disk, then save fresh via the UI.
- Skill sync endpoint: `POST /api/agents/{id}/skills/sync?companyId={id}` with body `{desiredSkills: [keys]}`. Skill keys have format `local/{hash}/{name}` or `paperclipai/paperclip/{name}`.
- Reporting structure: PATCH agent with `{reportsToAgentId: "{id}"}` — field name is `reportsToAgentId` on write, `reportsTo` on read.

## Skills (25 total)

### Project-Specific
- `friday-conventions` — design system, tech stack gotchas, workflow rules
- `friday-context` — living project state, priorities, goal hierarchy
- `friday-git-sync` — triggers `git pull` at start of every heartbeat
- `paperclip-api` — Paperclip REST API reference with Friday-specific agent IDs

### GStack (Imported)
careful, review, investigate, ship, land-and-deploy, qa, design-review, benchmark

### Marketing
copywriting, seo-audit, launch-strategy, page-cro, marketing-psychology

### Existing Repo Skills
frontend-design, web-design-guidelines, supabase-postgres-best-practices, nextjs-supabase-auth, vercel-react-best-practices, find-skills

## Context Sync Loop

```
You (Mac) → edit code + CLAUDE.md → git push → GitHub
                                                  ↓
Agent wakes → friday-git-sync → git pull → reads CLAUDE.md → does work
                                                  ↓
Agent pushes feature branch → you pull to Mac when ready
```

## Maintenance

### Updating Agent Instructions
1. Preferred: Edit AGENTS.md via the Paperclip UI (Instructions tab → edit → Save)
2. API PUT works for agents that have been saved via UI at least once
3. For new agents, always save via UI first to initialize the instructions bundle

### Adding Skills
1. Create `SKILL.md` in `.agents/skills/{name}/SKILL.md`
2. Push to GitHub
3. On T630: agents' `git pull` picks it up
4. In Paperclip UI: Skills → refresh (scan icon) → assign to agents via Skills tab

### Docker Container Updates
```bash
cd /home/matt/projects/paperclip
docker compose pull
docker compose up -d
```
