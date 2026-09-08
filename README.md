## Weekly Report Generator & Team Dashboard

## Backend Setup

$ cd backend
$ npm install
$ npx prisma generate
$ npx prisma migrate dev
$ npx prisma db seed
$ npm run start:dev

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
