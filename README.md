# Dashboard — Freelancing Engine

Lead management dashboard built with Next.js, Tailwind CSS, and direct Postgres reads.

## Features

- Lead list with filtering by status, platform, and search
- Score breakdown visualization per lead
- Review actions (approve, archive, reject, re-score, save for later)
- Real-time stats bar with status counts and score averages

## Setup

```bash
cp .env.local.example .env.local   # fill in Postgres credentials
npm install
npm run dev
```

## Docker

The service is included in the root `docker-compose.yml`:

```bash
docker compose up -d dashboard
```

Runs on port 3000 by default (`DASHBOARD_PORT` env var).

## Tech stack

- Next.js 16 (App Router, Server Components, Server Actions)
- Tailwind CSS v4
- PostgreSQL via `pg` driver
- TypeScript
