## Weekly Report Generator & Team Dashboard

Full-stack technical assignment for weekly team reporting, manager review, and reporting analytics.

## Features

- Cookie-based authentication with public team-member registration
- Role-based authorization for `TEAM_MEMBER` and `MANAGER`
- Team-member weekly report creation, editing, submission, correction, resubmission, and version history
- Manager report review with request-changes and approval actions
- Project management with soft deactivation
- Project-member assignments managed by managers
- Read-only manager user list
- Manager dashboard analytics with filters, charts, drill-downs, summary metrics, and activity feed
- Print / Save as PDF support for report detail and version pages
- Optional Gemini-powered report assistant for member report drafting

## Tech Stack

- Backend: NestJS, TypeScript, PostgreSQL, Prisma 7, `@prisma/adapter-pg`, Vitest, Supertest
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, Recharts

## Local development:

```bash
$ cd backend
$ npm install
$ npm run prisma:generate
$ npx prisma migrate dev
$ npm run db:seed
$ npm run start:dev
```

## Production-style migration command:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start:prod
```

## Backend environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_ACCESS_SECRET="replace-with-a-real-secret"
JWT_ACCESS_EXPIRES_IN="8h"
NODE_ENV=production
PORT=3000
FRONTEND_URL="https://your-frontend.example.com"
GEMINI_API_KEY="replace-with-a-real-gemini-api-key"
GEMINI_MODEL="gemini-3.7-flash"
```

## Frontend Setup

Local development:

```bash
$ cd frontend
$ npm install
$ npm run dev
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_*` values are public browser configuration. Do not put secrets in frontend environment files.

## Production build:

```bash
cd frontend
npm run build
npm run preview
```

Set `VITE_API_BASE_URL` to the deployed backend origin, unless the frontend host proxies API requests to the same origin.

## Backend Authentication

Authentication uses bcrypt password hashes and signed JWT access tokens stored in an HTTP-only `access_token` cookie. Public registration always creates `TEAM_MEMBER` users; manager users come from seed data.

## Seed demo credentials:

- Manager: `kavindu@gmail.com` / `Password123!`
- Team members: `sunil@gmail.com`, `nimal@gmail.com`, `kamal@gmail.com`, `amal@gmail.com`, `priya@gmail.com` / `Password123!`

## Frontend Authentication

The React frontend uses a centralized Axios client with `withCredentials: true`, so the browser sends the backend HTTP-only `access_token` cookie automatically. The JWT is never stored in `localStorage` or `sessionStorage`.

TanStack Query is the source of truth for the current session. On startup, the app calls `GET /auth/me`; a `401` is treated as an expected unauthenticated state.

Frontend route guards are for user experience only. Backend authorization remains the security boundary.

## Frontend Member Reports

The member report UI consumes the existing backend report APIs with TanStack Query. The report list supports pagination plus status, project, and date-range filters. Report server state is cached under report-specific query keys and mutations invalidate only related list/detail/version queries.

The create and edit pages share one React Hook Form form backed by Zod validation. The form mirrors the fixed backend report structure: metadata, completed tasks, next-week tasks, blockers, achievements, and time entries. Users can add or remove rows inside those sections, but cannot change ownership, status, current version, or report schema.

Frontend validation checks date order, required project/task fields, 0-100 percentages, non-negative hours, and at most one key blocker and one key achievement. Backend validation remains authoritative.

Lifecycle behavior in the UI:

- `DRAFT`: editable and submittable
- `SUBMITTED`: read-only
- `NEEDS_CORRECTION`: editable and resubmittable, with latest manager feedback shown prominently
- `APPROVED`: read-only

Submit and resubmit actions ask for confirmation because submitted content becomes read-only until a manager action. Version history pages are always read-only and display immutable historical report content plus reviews linked to each version.

The optional AI assistant is available inside the create/edit report form. It can improve writing, summarize the week, improve blocker wording, improve achievement wording, and suggest next-week tasks. AI suggestions are shown for review first; they are never saved, submitted, or applied to the form until the user chooses Apply.

## Frontend Manager Operations

The manager reports page consumes `GET /manager/reports` with pagination plus status, team-member, project, selected-week, and date-range filters. Dashboard drill-down links preserve the selected dashboard scope where the target report list is meaningful. List rows show summary data only; full report content is loaded on the review page.

The manager report review page consumes `GET /manager/reports/:id` and reuses the shared report display components used by the member UI. Review actions are shown only when a report is `SUBMITTED`:

- Request Changes opens a validated comment form and calls `POST /manager/reports/:id/request-changes`
- Approve asks for confirmation and calls `POST /manager/reports/:id/approve`

After review actions, the frontend invalidates manager report detail/list queries and dashboard queries so stale review state is refreshed from the backend. Managers can inspect immutable version snapshots through the manager version detail route.

Project management consumes the `/projects` API. Managers can create, edit, soft-deactivate projects, and manage assigned team members. Duplicate-name and validation errors are displayed through the shared API error handling. User management is read-only because the backend currently exposes only `GET /users`.

## Frontend Manager Dashboard

Dashboard filters are shared across widgets and support selected week, date range, team member, and project. Filters are applied explicitly from the filter bar so widgets do not refetch on every field edit.

Dashboard widgets:

- Summary cards for submitted reports, compliance rate, pending reports, needs-correction reports, and open blockers
- Line chart for completed-task trends by week
- Submission-status visualization with per-member status labels, including `NOT_STARTED`
- Bar chart for task distribution by project
- Bar chart for time distribution by work type
- Recent activity feed for submissions, resubmissions, requested changes, and approvals

Dashboard values are backend-defined. The frontend does not recompute compliance or content analytics differently, and dashboard content metrics rely on the backend rule that only current report versions are counted.

Drill-down behavior is intentionally limited to accurate targets. Needs-correction summary cards can open the manager reports list filtered to the same reporting scope. Project distribution links open manager reports filtered by that project and the active date/member filters. Pending members without reports do not get fake report links.

Route-level lazy loading is enabled for major frontend pages, including the manager dashboard and report pages.

## Export / Print

Report detail and historical version pages include a `Print / Save as PDF` action that uses the browser print flow. Print styles hide navigation, filters, buttons, AI controls, and manager actions while preserving the report title, member/project/week metadata, status, version, report content, time breakdown, notes, reviews, and historical-version labels where relevant.

## Testing

Backend:

```bash
cd backend
npm run build
npm run lint
npm run test:e2e
npx prisma validate
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
npm run test
```

## Security Decisions

- JWT access tokens are stored only in an HTTP-only cookie named `access_token`
- Public registration always creates `TEAM_MEMBER`; no public manager signup exists
- Backend guards enforce authentication and role authorization
- Report ownership, status, current version, reviewer id, and user id are never trusted from client payloads
- Password hashes and JWTs are not returned by API responses
- Production cookies use `secure: true`; local development uses non-secure cookies for `localhost`
- Gemini API calls happen only from the backend; report text is sent only for the selected assistant action and is not persisted by this application

Deployment note: current cookie settings use `sameSite: "lax"`, which works well for same-site or same-registrable-domain deployments. If frontend and backend are deployed truly cross-site, cookie settings may need an explicit `sameSite: "none"` plus secure HTTPS.

## Demo Reset

To restore deterministic local demo data, reset the local database:

```bash
cd backend
npx prisma migrate reset
```

This is destructive and should only be used against a local/demo database. Never run `prisma migrate reset` against production. The current Prisma config includes the seed command, so `migrate reset` prompts and then runs the seed automatically.

## Future Improvements

- Admin-managed invitations and role changes
- Route-level prefetching for frequently used pages
- Email or in-app notifications for review events

## Projects

Project routes require authentication. Team members can list active projects assigned to them. Managers can list all projects, manage project records, and manage team-member assignments.

Only active `TEAM_MEMBER` users can be assigned as project members. Team members can create or move reports only for active projects assigned to them; existing reports remain readable through the normal ownership and manager-review rules.

## Reports

Current report lifecycle:

`DRAFT -> SUBMITTED -> NEEDS_CORRECTION -> SUBMITTED -> APPROVED`

Supported transitions are enforced by the backend. Clients cannot set `userId`, `status`, `currentVersion`, or `reviewerId` through request bodies.

Report ownership comes from the authenticated cookie session. Request bodies cannot set `userId`, `status`, or `currentVersion`. New reports are always `DRAFT` with `currentVersion` 1 and a first `ReportVersion`.

Dates are accepted as `YYYY-MM-DD` and stored as UTC start-of-day values. Draft edits update the current draft `ReportVersion`; provided child collections are replaced deterministically and omitted child collections are left unchanged.

When a manager requests changes, the submitted version remains immutable. The first member correction edit creates `currentVersion + 1`; later correction edits update that unsubmitted correction version. Resubmitting does not increment the version. Submitted and approved reports are read-only for team members.
```

`Report` stores ownership, project, week range, status, and the current version number. `ReportVersion` stores the versioned weekly content: notes, tasks, next-week tasks, blockers, achievements, time entries, and reviews tied to that exact version.

Report detail pages show an activity timeline derived from existing domain records: report creation time, version creation/submission timestamps, and review rows. No separate audit-log table is required for the current workflow.

## AI Report Assistant API

The report assistant route requires an authenticated `TEAM_MEMBER` and uses Gemini from the NestJS backend:

- `POST /ai/report-assistant`

Supported actions:

- `IMPROVE_WRITING`
- `SUMMARIZE_WEEK`
- `IMPROVE_BLOCKERS`
- `IMPROVE_ACHIEVEMENTS`
- `SUGGEST_NEXT_WEEK`

The client sends only the action and current report context. It cannot send a prompt, model name, user id, role, report status, or version number. The backend owns the safety prompt and returns a structured suggestion:

```json
{
  "action": "IMPROVE_BLOCKERS",
  "suggestion": "Clarified blocker wording.",
  "suggestions": ["Production credentials are still pending."]
}
```

AI output is advisory and may be inaccurate. Users must review and explicitly apply suggestions in the form, then save or submit through the normal report workflow. Provider rate limits may apply based on the configured Gemini account.

## Manager Dashboard API

Dashboard routes require `MANAGER`.

Common filters:

- `weekStart=2026-09-07` or `week=2026-09-07`
- `from=2026-09-01&to=2026-09-30`
- `userId=<userId>`
- `projectId=<projectId>`
- `limit=20` for activity

Summary metrics use selected-week semantics. Expected members are active `TEAM_MEMBER` users, optionally narrowed by `userId`. A compliant submission is a report for that week with status `SUBMITTED`, `NEEDS_CORRECTION`, or `APPROVED`. `DRAFT` and missing reports count as pending. `NEEDS_CORRECTION` still counts as submitted because the member did submit the report. Compliance rate is `compliant active members / total active members * 100`, with `0` returned when there are no matching active members.

Dashboard content analytics use only each report's current `ReportVersion`. Historical versions are kept for audit/history and are not double-counted in task trends, project distribution, time distribution, or open blocker counts. Activity is derived from `ReportVersion.submittedAt` and `Review` rows, returning recent submitted, resubmitted, request-changes, and approval events.

Dashboard drill-down links target manager report lists only when the result maps cleanly to real reports. For example, a needs-correction card opens `/manager/reports` with `status=NEEDS_CORRECTION` plus the current dashboard date/project/member filters, while `NOT_STARTED` members have no report link.
