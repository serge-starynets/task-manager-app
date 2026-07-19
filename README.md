# Task Manager App

A minimal issue-tracking application inspired by Linear. It lets users sign up, create and manage issues (status, priority, descriptions), and keep work organized per account.

**Live demo:** [https://task-manager-app-xi-eight.vercel.app/](https://task-manager-app-xi-eight.vercel.app/)

## Purpose

This project is a lightweight task/issue manager for individuals and small teams. Standard users only see and manage their own issues; admins can view and manage issues across all users.

## Features

- User authentication (sign up, sign in, sign out)
- Role-based access (`admin` and `user`)
- Per-user issue isolation (admins see all issues)
- Issue management (create, update, delete) with status and priority
- Dark mode support
- Responsive UI

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) ([Neon](https://neon.tech/) in production)
- Custom JWT auth (`jose` + `bcrypt`) with HTTP-only cookies
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

2. Copy env values and set `LOCAL_DATABASE_URL`, `DATABASE_URL`, and `JWT_SECRET` in `.env`.

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

### Promote a user to admin

```bash
npx tsx scripts/promote-admin.ts user@example.com          # local DB
npx tsx scripts/promote-admin.ts user@example.com --neon   # production (Neon)
```

## Project Structure

- `app/` — Next.js App Router pages, server actions, and UI components
- `app/api/` — REST API routes for issues
- `db/` — Drizzle schema and database client
- `lib/` — Auth, data access layer, and shared utilities
- `scripts/` — Seed and admin promotion scripts

## License

This project is licensed under the MIT License.
