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
