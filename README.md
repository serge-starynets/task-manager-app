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
- `app/api/` — REST API routes (see [API Routes](#api-routes) below)
- `app/actions/` — Server Actions used by the web UI
- `db/` — Drizzle schema and database client
- `auth.ts` — Auth.js config (Google OAuth + credentials)
- `lib/` — Data access layer, validation schemas, services, and shared utilities
- `lib/validations/` — Shared Zod schemas (used by actions, services, and future API v1)
- `lib/env.ts` — Environment variable validation (Zod)
- `scripts/` — Seed and admin promotion scripts

## API Routes

The web UI primarily uses **Server Actions** for mutations. REST routes under `app/api/` serve file uploads, Auth.js, and external/mobile clients (Phase 2 will add `/api/v1/`).

**Authentication:** Session cookies via Auth.js. Route handlers call `getCurrentUser()` — there is no global API middleware gate yet. Mobile Bearer token auth is planned for Phase 2.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`, `POST` | `/api/auth/[...nextauth]` | Public | Auth.js handlers (OAuth callbacks, session) |
| `GET` | `/api/tasks` | Session | List tasks for current user (admins see all) |
| `POST` | `/api/tasks` | Session | Create a task |
| `GET` | `/api/tasks/[id]` | Session | Get a single task |
| `DELETE` | `/api/tasks/[id]` | Session | Delete a task |
| `POST` | `/api/attachments/upload` | Session | Vercel Blob client upload token |
| `GET` | `/api/attachments/file/[...pathname]` | Session | Stream a private attachment |

**Error shape (REST):** `{ error: string }` or `{ error: string, errors?: Record<string, string[]> }`

**Planned:** Versioned `/api/v1/` routes with Bearer token auth for the mobile app.

## License

This project is licensed under the MIT License.
