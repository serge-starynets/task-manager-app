# Task Manager App

A minimal issue-tracking application inspired by Linear. It lets users sign up, create and manage issues (status, priority, descriptions), and keep work organized per account.

**Live demo:** [https://projenda.vercel.app/](https://projenda.vercel.app/)

## Purpose

This project is a lightweight task/issue manager for individuals and small teams. Standard users only see and manage their own issues; admins can view and manage issues across all users.

## Features

- User authentication (Google OAuth + email/password sign up, sign in, sign out)
- Role-based access (`admin` and `user`)
- Per-user issue isolation (admins see all issues)
- Issue management (create, update, delete) with status and priority
- Dark mode support
- Responsive UI

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Auth.js](https://authjs.dev/) (NextAuth v5) — Google OAuth + email/password
- [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.tech/) in production)
- [Zod](https://zod.dev/) for validation
- [Vitest](https://vitest.dev/) for testing
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (local) and/or a [Neon](https://neon.tech/) database

### Installation

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/serge-starynets/task-manager-app.git
   cd task-manager-app
   npm install
   ```

2. Create `.env` with database and auth values:

   ```bash
   LOCAL_DATABASE_URL=postgres://user:password@localhost:5432/taskmanager
   DATABASE_URL=postgresql://...   # Neon connection string (production)
   AUTH_SECRET=                   # openssl rand -hex 32
   AUTH_GOOGLE_ID=                # Google Cloud Console OAuth client ID
   AUTH_GOOGLE_SECRET=            # Google Cloud Console OAuth client secret
   BLOB_READ_WRITE_TOKEN=         # Vercel Blob (optional, for attachments)
   ```

   For Google OAuth, add these **Authorized redirect URIs** in [Google Cloud Console](https://console.cloud.google.com/):

   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://projenda.vercel.app/api/auth/callback/google` (production)

3. Push the schema and (optionally) seed demo data:

   ```bash
   npm run db:push
   npm run seed
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

Demo email/password accounts (after `npm run seed`): `admin@example.com` / `user@example.com` with password `password123`.

### Promote a user to admin

```bash
npx tsx scripts/promote-admin.ts user@example.com          # local DB
npx tsx scripts/promote-admin.ts user@example.com --neon   # production (Neon)
```

## Project Structure

- `app/` — Next.js App Router pages, server actions, and UI components
  - `(app)/` — Authenticated app shell (dashboard, tasks, projects)
  - `(auth)/` — Sign-in and sign-up
  - `(marketing)/` — Public marketing pages
- `app/components/` — Shared UI (`ui/`, `layout/`, `auth/`, `tasks/`, `projects/`)
- `app/api/` — REST API routes (see [API Routes](#api-routes) below)
- `app/actions/` — Server Actions used by the web UI
- `db/` — Drizzle schema and database client
- `auth.ts` — Auth.js config (Google OAuth + credentials)
- `lib/` — Data access layer, validation schemas, services, and shared utilities
- `lib/validations/` — Shared Zod schemas (used by actions, services, and API v1)
- `lib/dto/` — Stable API response shapes for `/api/v1/`
- `lib/api/` — API helpers (responses, mappers, handlers)
- `lib/auth/` — Dual-mode auth (session cookies + Bearer JWT for mobile)
- `lib/env.ts` — Environment variable validation (Zod)
- `scripts/` — Seed and admin promotion scripts

## API Routes

The web UI primarily uses **Server Actions** for mutations. Versioned REST routes under `/api/v1/` are the stable contract for mobile and external clients. OpenAPI spec: [`openapi.yaml`](openapi.yaml).

**Authentication (v1):** Dual-mode — Auth.js session cookies for the web UI, or `Authorization: Bearer <accessToken>` for mobile clients. Obtain tokens via `POST /api/v1/auth/login` (credentials) and refresh with `POST /api/v1/auth/refresh`. Route handlers resolve the user via `getApiUser()` / `requireApiUser()`. Root `middleware.ts` protects `/api/v1/*` (except login/refresh); authenticated app pages are gated by `app/(app)/layout.tsx`.

### API v1 — Auth

| Method | Path                   | Auth    | Description                                      |
| ------ | ---------------------- | ------- | ------------------------------------------------ |
| `POST` | `/api/v1/auth/login`   | Public  | Credentials login → access + refresh tokens        |
| `POST` | `/api/v1/auth/refresh` | Public  | Exchange refresh token for a new token pair      |
| `GET`  | `/api/v1/auth/me`      | Session | Current user profile (session cookie or Bearer)  |

### API v1 — Resources

| Method   | Path                                     | Description                            |
| -------- | ---------------------------------------- | -------------------------------------- |
| `GET`    | `/api/v1/tasks`                          | List tasks (`?projectId=`, `?status=`) |
| `POST`   | `/api/v1/tasks`                          | Create a task                          |
| `GET`    | `/api/v1/tasks/[id]`                     | Get a task                             |
| `PATCH`  | `/api/v1/tasks/[id]`                     | Update a task                          |
| `DELETE` | `/api/v1/tasks/[id]`                     | Delete a task                          |
| `PATCH`  | `/api/v1/tasks/[id]/status`              | Update task status (`{ status }`)      |
| `GET`    | `/api/v1/tasks/[id]/relations`           | List related tickets (`type`, `kind`)  |
| `POST`   | `/api/v1/tasks/[id]/relations`           | Add relation (`{ targetId, kind }`)    |
| `DELETE` | `/api/v1/tasks/[id]/relations?targetId=` | Remove relation (optional `?kind=`)    |
| `GET`    | `/api/v1/tasks/[id]/attachments`         | List attachments                       |
| `POST`   | `/api/v1/tasks/[id]/attachments`         | Register uploaded attachment           |
| `GET`    | `/api/v1/projects`                       | List projects                          |
| `POST`   | `/api/v1/projects`                       | Create a project                       |
| `GET`    | `/api/v1/projects/[id]`                  | Get a project                          |
| `PATCH`  | `/api/v1/projects/[id]`                  | Update a project                       |

### Other routes

| Method          | Path                                  | Auth    | Description                                 |
| --------------- | ------------------------------------- | ------- | ------------------------------------------- |
| `GET`, `POST`   | `/api/auth/[...nextauth]`             | Public  | Auth.js handlers (OAuth callbacks, session) |
| `GET`, `POST`   | `/api/tasks`                          | Session | **Deprecated** — use `/api/v1/tasks`        |
| `GET`, `DELETE` | `/api/tasks/[id]`                     | Session | **Deprecated** — use `/api/v1/tasks/[id]`   |
| `POST`          | `/api/attachments/upload`             | Session | Vercel Blob client upload token             |
| `GET`           | `/api/attachments/file/[...pathname]` | Session | Stream a private attachment                 |

**Success shape:** `{ data: T }` or `{ message: string }`

**Error shape:** `{ error: string }` or `{ error: string, errors?: Record<string, string[]> }`

## License

This project is licensed under the MIT License.
