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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_WEBHOOK_SECRET=optional_shared_secret
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
- Utility scripts `create-env.mjs` and `create-env-fixed.mjs` can generate a template `.env.local` file.
