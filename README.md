## Weekly Report Generator & Team Dashboard

Full-stack technical assignment for weekly team reporting, manager review, and reporting analytics.

## Features

- Cookie-based authentication with public team-member registration
- Role-based authorization for `TEAM_MEMBER` and `MANAGER`
- Team-member weekly report creation, editing, submission, correction, resubmission, and version history
- Manager report review with request-changes and approval actions
- Project management with soft deactivation
- Read-only manager user list
- Manager dashboard analytics with filters, charts, summary metrics, and activity feed

## Tech Stack

- Backend: NestJS, TypeScript, PostgreSQL, Prisma 7, `@prisma/adapter-pg`, Vitest, Supertest
- Frontend: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, Recharts

## Project Structure

```text
/
├── backend/
│   ├── prisma/
│   ├── src/
│   └── test/
└── frontend/
    └── src/
```

## Backend Setup

$ cd backend
$ npm install
$ npx prisma generate
$ npx prisma migrate dev
$ npx prisma db seed
$ npm run start:dev

Production-style migration command:

```bash
cd backend
npx prisma migrate deploy
```

Backend environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_ACCESS_SECRET="replace-with-a-real-secret"
JWT_ACCESS_EXPIRES_IN="15m"
PORT=3000
FRONTEND_URL="http://localhost:5173,http://127.0.0.1:5173"
```

## Frontend Setup

$ cd frontend
$ npm install
$ npm run dev

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

`VITE_*` values are public browser configuration. Do not put secrets in frontend environment files.

## Backend Authentication

Authentication uses bcrypt password hashes and signed JWT access tokens stored in an HTTP-only `access_token` cookie. Public registration always creates `TEAM_MEMBER` users; manager users come from seed data.

Endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /users` requires `MANAGER`

Seed demo credentials:

- Manager: `kavindu@gmail.com` / `Password123!`
- Team members: `sunil@gmail.com`, `nimal@gmail.com`, `kamal@gmail.com`, `amal@gmail.com` / `Password123!`

## Frontend Authentication

The React frontend uses a centralized Axios client with `withCredentials: true`, so the browser sends the backend HTTP-only `access_token` cookie automatically. The JWT is never stored in `localStorage` or `sessionStorage`.

TanStack Query is the source of truth for the current session. On startup, the app calls `GET /auth/me`; a `401` is treated as an expected unauthenticated state.

Frontend routes:

- `/login` public-only sign in page
- `/register` public-only team-member registration page
- `/reports` authenticated `TEAM_MEMBER` report history
- `/reports/new` authenticated `TEAM_MEMBER` create-report form
- `/reports/:id` authenticated `TEAM_MEMBER` report detail
- `/reports/:id/edit` authenticated `TEAM_MEMBER` draft/correction edit form
- `/reports/:id/versions` authenticated `TEAM_MEMBER` version history
- `/reports/:id/versions/:versionNumber` authenticated `TEAM_MEMBER` read-only version detail
- `/manager/dashboard` authenticated `MANAGER` dashboard
- `/manager/reports` authenticated `MANAGER` team reports table
- `/manager/reports/:id` authenticated `MANAGER` report review page
- `/manager/reports/:id/versions/:versionNumber` authenticated `MANAGER` read-only version detail
- `/manager/projects` authenticated `MANAGER` project management
- `/manager/users` authenticated `MANAGER` read-only users list
- `/` redirects by role: manager to `/manager/dashboard`, team member to `/reports`, unauthenticated user to `/login`

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

## Frontend Manager Operations

The manager reports page consumes `GET /manager/reports` with pagination plus status, team-member, project, and date-range filters. List rows show summary data only; full report content is loaded on the review page.

The manager report review page consumes `GET /manager/reports/:id` and reuses the shared report display components used by the member UI. Review actions are shown only when a report is `SUBMITTED`:

- Request Changes opens a validated comment form and calls `POST /manager/reports/:id/request-changes`
- Approve asks for confirmation and calls `POST /manager/reports/:id/approve`

After review actions, the frontend invalidates manager report detail/list queries and dashboard queries so stale review state is refreshed from the backend. Managers can inspect immutable version snapshots through the manager version detail route.

Project management consumes the existing `/projects` API. Managers can create, edit, and soft-deactivate projects; duplicate-name and validation errors are displayed through the shared API error handling. User management is read-only because the backend currently exposes only `GET /users`.

## Frontend Manager Dashboard

The manager dashboard consumes the backend analytics APIs directly:

- `GET /dashboard/summary`
- `GET /dashboard/submission-status`
- `GET /dashboard/task-trends`
- `GET /dashboard/project-distribution`
- `GET /dashboard/time-distribution`
- `GET /dashboard/activity`

Dashboard filters are shared across widgets and support selected week, date range, team member, and project. Filters are applied explicitly from the filter bar so widgets do not refetch on every field edit.

Dashboard widgets:

- Summary cards for submitted reports, compliance rate, pending reports, needs-correction reports, and open blockers
- Line chart for completed-task trends by week
- Submission-status visualization with per-member status labels, including `NOT_STARTED`
- Bar chart for task distribution by project
- Bar chart for time distribution by work type
- Recent activity feed for submissions, resubmissions, requested changes, and approvals

Dashboard values are backend-defined. The frontend does not recompute compliance or content analytics differently, and dashboard content metrics rely on the backend rule that only current report versions are counted.

Route-level lazy loading is enabled for major frontend pages, including the manager dashboard and report pages.

AI is not implemented yet.

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

Deployment note: current cookie settings use `sameSite: "lax"`, which works well for same-site or same-registrable-domain deployments. If frontend and backend are deployed truly cross-site, cookie settings may need an explicit `sameSite: "none"` plus secure HTTPS.

## Future Improvements

- AI-assisted report drafting and summarization
- Manager dashboard drilldowns and exports
- Admin-managed invitations and role changes
- Route-level prefetching for frequently used pages

## Projects

Project routes require authentication. Team members can list active projects only. Managers can list all projects and manage them.

- `GET /projects?page=1&limit=20`
- `GET /projects?isActive=false` for managers
- `POST /projects` requires `MANAGER`
- `PATCH /projects/:id` requires `MANAGER`
- `DELETE /projects/:id` requires `MANAGER` and soft-deactivates the project

Example:

```json
{
  "name": "Client Portal",
  "description": "Customer-facing web portal"
}
```

## Reports

Current report lifecycle:

`DRAFT -> SUBMITTED -> NEEDS_CORRECTION -> SUBMITTED -> APPROVED`

Supported transitions are enforced by the backend. Clients cannot set `userId`, `status`, `currentVersion`, or `reviewerId` through request bodies.

Team-member report routes:

- `POST /reports`
- `GET /reports/me?page=1&limit=10&status=DRAFT&projectId=<projectId>&from=2026-09-01&to=2026-09-30`
- `GET /reports/:id`
- `PATCH /reports/:id`
- `POST /reports/:id/submit`
- `POST /reports/:id/resubmit`
- `GET /reports/:id/versions`
- `GET /reports/:id/versions/:versionNumber`

Report ownership comes from the authenticated cookie session. Request bodies cannot set `userId`, `status`, or `currentVersion`. New reports are always `DRAFT` with `currentVersion` 1 and a first `ReportVersion`.

Dates are accepted as `YYYY-MM-DD` and stored as UTC start-of-day values. Draft edits update the current draft `ReportVersion`; provided child collections are replaced deterministically and omitted child collections are left unchanged.

When a manager requests changes, the submitted version remains immutable. The first member correction edit creates `currentVersion + 1`; later correction edits update that unsubmitted correction version. Resubmitting does not increment the version. Submitted and approved reports are read-only for team members.

Managers review reports through:

- `GET /manager/reports?page=1&limit=10&status=SUBMITTED&userId=<userId>&projectId=<projectId>&from=2026-09-01&to=2026-09-30`
- `GET /manager/reports/:id`
- `POST /manager/reports/:id/request-changes`
- `POST /manager/reports/:id/approve`

Request changes body:

```json
{
  "comment": "Please clarify the main deliverable."
}
```

`Report` stores ownership, project, week range, status, and the current version number. `ReportVersion` stores the versioned weekly content: notes, tasks, next-week tasks, blockers, achievements, time entries, and reviews tied to that exact version.

## Manager Dashboard API

Dashboard routes require `MANAGER`.

- `GET /dashboard/summary`
- `GET /dashboard/submission-status`
- `GET /dashboard/task-trends`
- `GET /dashboard/project-distribution`
- `GET /dashboard/time-distribution`
- `GET /dashboard/activity`

Common filters:

- `weekStart=2026-09-07` or `week=2026-09-07`
- `from=2026-09-01&to=2026-09-30`
- `userId=<userId>`
- `projectId=<projectId>`
- `limit=20` for activity

Summary metrics use selected-week semantics. Expected members are active `TEAM_MEMBER` users, optionally narrowed by `userId`. A compliant submission is a report for that week with status `SUBMITTED`, `NEEDS_CORRECTION`, or `APPROVED`. `DRAFT` and missing reports count as pending. `NEEDS_CORRECTION` still counts as submitted because the member did submit the report. Compliance rate is `compliant active members / total active members * 100`, with `0` returned when there are no matching active members.

Dashboard content analytics use only each report's current `ReportVersion`. Historical versions are kept for audit/history and are not double-counted in task trends, project distribution, time distribution, or open blocker counts. Activity is derived from `ReportVersion.submittedAt` and `Review` rows, returning recent submitted, resubmitted, request-changes, and approval events.

Example create report request:

```json
{
  "weekStart": "2026-09-07",
  "weekEnd": "2026-09-13",
  "projectId": "00000000-0000-0000-0000-000000000000",
  "notes": "Weekly progress notes",
  "tasks": [
    {
      "name": "Implement report APIs",
      "priority": "HIGH",
      "plannedPercentage": 100,
      "actualPercentage": 100,
      "status": "COMPLETED",
      "plannedHours": 8,
      "actualHours": 7.5,
      "deliverable": "Reports module"
    }
  ],
  "nextWeekTasks": [{ "description": "Prepare manager review APIs" }],
  "blockers": [
    {
      "description": "Waiting for credentials",
      "isKeyIssue": true,
      "isResolved": false
    }
  ],
  "achievements": [
    {
      "description": "Completed milestone foundation",
      "isKeyAchievement": true
    }
  ],
  "timeEntries": [
    { "type": "DEVELOPMENT", "hours": 24 },
    { "type": "MEETINGS", "hours": 4 }
  ]
}
```
