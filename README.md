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

Current report lifecycle: `DRAFT -> SUBMITTED`. Manager review, request changes, approval, and resubmission are not implemented yet.

Team-member report routes:

- `POST /reports`
- `GET /reports/me?page=1&limit=10&status=DRAFT&projectId=<projectId>&from=2026-09-01&to=2026-09-30`
- `GET /reports/:id`
- `PATCH /reports/:id`
- `POST /reports/:id/submit`

Report ownership comes from the authenticated cookie session. Request bodies cannot set `userId`, `status`, or `currentVersion`. New reports are always `DRAFT` with `currentVersion` 1 and a first `ReportVersion`.

Dates are accepted as `YYYY-MM-DD` and stored as UTC start-of-day values. Draft edits update the current draft `ReportVersion`; provided child collections are replaced deterministically and omitted child collections are left unchanged. Submitted reports are read-only for team members.

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
