# RepGuardian

RepGuardian is a Next.js + Supabase application for monitoring customer conversations, feedback trends, and critical operational updates.

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Supabase (Auth + Postgres)
- TanStack Query
- Tailwind + Radix UI primitives

## Local development

1. Install dependencies:

```bash
npm ci
```

2. Configure environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
N8N_WEBHOOK_URL=<your_n8n_webhook_url>
N8N_WEBHOOK_SECRET=<optional_shared_secret>
```

3. Run the app:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

## Notes

- This repository includes CI validation for lint and production build in `.github/workflows/ci.yml`.
- Utility scripts `create-env.mjs` and `create-env-fixed.mjs` now **do not overwrite** an existing `.env.local` unless you pass `--force`.
- Dashboard changes are visible at `http://localhost:3000/app` after signing in and selecting a company context.
