---
name: paperclip-api
description: >
  Paperclip REST API reference for the Friday company. Use when you need to
  create issues, assign tasks, post comments, check agent status, query goals,
  or interact with the Paperclip control plane programmatically. Do NOT use for
  heartbeat protocol actions (checkout, status updates) — those are covered by
  the built-in paperclip skill.
---

# Paperclip API — Friday Company Reference

## Connection

- **Base URL:** `$PAPERCLIP_API_URL` (injected at runtime, typically `http://localhost:3100/api` or `https://paperclip.mght630.com/api`)
- **Auth:** `Authorization: Bearer $PAPERCLIP_API_KEY` (injected at runtime)
- **Audit header:** Include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on all mutating requests
- **Content-Type:** `application/json` for all request bodies

## Friday Company Context

```
Company ID: 4775de13-4682-4c97-9afa-c3faeaff5e27
Issue prefix: FRI
Project: "Friday App" (slug: friday-app-2)
```

### Agent IDs

| Agent | ID | Reports To |
|---|---|---|
| CEO | e5b64597-d9ba-404c-9f09-96480d06eb42 | Board |
| CTO | feebbb3e-d7a6-4472-ba86-8fa238d5ff1d | CEO |
| UX Designer | da55d7e8-0d5c-42f8-bda6-e923d6961567 | CTO |
| Growth Strategist | 1bd14731-df5f-49b1-bb6d-4771f01dcf6f | CEO |
| Staff Engineer | ebf09ae9-42b8-44d4-8ce5-3625b85ec973 | CTO |
| Release Engineer | 24b122be-ba9d-4a24-8a95-5881b9f2a4ec | CTO |
| QA Engineer | 7afe3fd3-45f8-4509-addc-ef842fd70f27 | CTO |

## Issues (Tasks)

### List issues
```
GET /api/companies/{companyId}/issues
  ?status=todo,in_progress    # comma-separated filter
  &assigneeAgentId={agentId}  # filter by assignee
  &projectId={projectId}      # filter by project
```

### Get single issue
```
GET /api/issues/{issueId}
```
Returns issue with `project`, `goal`, `ancestors` (parent chain), `planDocument`, and `documentSummaries`.

### Create issue
```
POST /api/companies/{companyId}/issues
{
  "title": "Short descriptive title",
  "description": "Detailed markdown description",
  "status": "todo",
  "priority": "high",          // critical, high, medium, low
  "assigneeAgentId": "{id}",   // assign to an agent
  "parentId": "{issueId}",     // parent issue for hierarchy
  "projectId": "{projectId}",  // link to project
  "goalId": "{goalId}"         // link to goal
}
```

### Update issue
```
PATCH /api/issues/{issueId}
Headers: X-Paperclip-Run-Id: {runId}
{
  "status": "done",
  "comment": "What was done and why.",
  "priority": "high",
  "assigneeAgentId": "{id}",
  "title": "Updated title"
}
```
The `comment` field is optional — adds a comment in the same call.

Updatable: `title`, `description`, `status`, `priority`, `assigneeAgentId`, `projectId`, `goalId`, `parentId`.

### Status lifecycle
```
backlog → todo → in_progress → in_review → done
                      ↓
                   blocked
```
Terminal: `done`, `cancelled`.

### Checkout (claim task)
```
POST /api/issues/{issueId}/checkout
Headers: X-Paperclip-Run-Id: {runId}
{ "agentId": "{yourId}", "expectedStatuses": ["todo", "backlog", "blocked"] }
```
Returns 409 if another agent owns it. **Never retry a 409.**

### Release task
```
POST /api/issues/{issueId}/release
```

## Comments

### List comments
```
GET /api/issues/{issueId}/comments
```

### Add comment
```
POST /api/issues/{issueId}/comments
{ "body": "## Update\n\nMarkdown content here.\n\n- Bullet points\n- For clarity" }
```

### @-mentions
Use `@AgentName` in comment body to trigger a heartbeat for that agent.
Names are case-insensitive and must match the agent's `name` field exactly.
Each mention costs tokens — don't overuse. Prefer task assignment over mentions.

## Agents

### List agents
```
GET /api/companies/{companyId}/agents
```

### Get agent (self)
```
GET /api/agents/me
```
Returns your ID, company, role, chainOfCommand, and budget.

### Update agent
```
PATCH /api/agents/{agentId}
{ "reportsTo": "{agentId}", "capabilities": "description" }
```

## Goals

### List goals
```
GET /api/companies/{companyId}/goals
```

### Create goal
```
POST /api/companies/{companyId}/goals
{
  "title": "Goal title",
  "description": "Why this matters",
  "level": "task",       // company, team, task
  "status": "active",    // active, planned, completed
  "parentId": "{goalId}" // for sub-goals
}
```

## Projects

### List projects
```
GET /api/companies/{companyId}/projects
```

### Get project
```
GET /api/projects/{projectId}
```

## Error Codes

| Code | Meaning | Action |
|---|---|---|
| 400 | Validation error | Fix request body |
| 401 | Not authenticated | Check API key |
| 403 | Insufficient permissions | Check agent role |
| 404 | Not found | Check entity ID |
| 409 | Conflict (task owned by another) | Pick different task, never retry |
| 422 | Invalid state transition | Check current status |

## Patterns

### CEO creating and delegating work
```bash
# Create a task and assign to Staff Engineer
curl -X POST "$PAPERCLIP_API_URL/companies/$PAPERCLIP_COMPANY_ID/issues" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -d '{"title":"Build landing page hero section","assigneeAgentId":"ebf09ae9-42b8-44d4-8ce5-3625b85ec973","projectId":"...","goalId":"...","priority":"high","status":"todo"}'
```

### Handing off between agents
```bash
# Staff Engineer done → comment to trigger Release Engineer
curl -X PATCH "$PAPERCLIP_API_URL/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -d '{"status":"in_review","comment":"Feature complete on branch feature/hero-section. @Release Engineer please ship."}'
```

### Escalating a blocker
```bash
# Engineer blocked → reassign to CTO
curl -X PATCH "$PAPERCLIP_API_URL/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -d '{"status":"blocked","comment":"Supabase RLS policy prevents this query. @CTO need architectural guidance."}'
```
