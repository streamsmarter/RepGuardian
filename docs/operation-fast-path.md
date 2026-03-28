# Operation Fast Path

## Goal

Improve RepGuardian's speed, consistency, and scalability without destabilizing the product surface.

## Success Criteria

- Reduce initial page load latency on dashboard-style routes.
- Remove duplicated company scoping logic across client pages and API routes.
- Prevent unbounded list rendering and expensive client-side data assembly.
- Make the app safer to scale by standardizing authorization and query patterns.

## Phase 1: Latency and Consistency

### 1. Centralize company-scoped auth

- Use `src/lib/company-context.ts` as the canonical company resolution path.
- Stop resolving `company_id` ad hoc inside client components when the value can be provided by a server page or layout.
- Update API routes that act on scoped resources to validate:
  - authenticated user
  - resolved company
  - resource ownership within that company

### 2. Move initial page data to the server

Prioritize these routes first:

- `src/app/app/page.tsx`
- `src/app/app/referral/page.tsx`
- `src/app/app/activity/page.tsx`

Guidelines:

- Fetch first-render business data in the server page.
- Pass only the required serialized data into client components.
- Keep client components focused on interaction, mutation, and local UI state.

### 3. Narrow hot-path queries

Replace `select('*')` in frequently-used paths with explicit column lists.

Priority files:

- `src/app/app/referral/page.tsx`
- `src/components/message-thread.tsx`
- `src/app/app/activity/activity-list.tsx`
- `src/app/app/reviews/reviews-client.tsx`
- `src/app/app/feedback/feedback-client.tsx`

### 4. Standardize query helpers

Create shared data-access helpers for common company-scoped reads.

Suggested helper targets:

- `getReferralProgram(companyId)`
- `getCampaignStats(companyId)`
- `getRecentUpdates(companyId)`
- `getReviewsPageData(companyId, filters)`
- `getFeedbackPageData(companyId, filters)`

Suggested location:

- `src/lib/queries/`

## Phase 2: Large Dataset Safety

### 5. Add pagination

Implement pagination or incremental loading for:

- reviews
- feedback
- activity
- participants
- inbox threads if thread volume becomes large

Preferred order:

1. Reviews
2. Feedback
3. Activity
4. Participants

### 6. Push aggregation toward the database

Reduce client-side stitching and per-row enrichment by moving heavy read patterns into:

- Supabase SQL views
- RPC functions
- pre-joined, company-scoped database queries

Best candidates:

- review analytics
- feedback conflict/status enrichment
- campaign/funnel metrics

### 7. Reduce repeated auth/session lookups

- Avoid repeated `supabase.auth.getUser()` calls in client components.
- Resolve user and company once on the server whenever possible.
- Pass scoped identity downward from layouts/pages.

## Phase 3: Scale Hardening

### 8. Add database indexes

Validate and add indexes for the dominant query paths:

- `chat(company_id, status_updated_at, created_at)`
- `messages(session_id, created_at)`
- `conflict(company_id, client_id, status)`
- `review(company_id, review_published_at)`
- `feedback(company_id, created_at, sentiment_score)`
- `campaign(company_id, status, type)`
- `update(company_id, created_at)`

### 9. Tune React Query per feature

- Set stale times intentionally by data volatility.
- Prefetch predictable next screens when useful.
- Standardize invalidation after mutations.
- Avoid duplicate cache entries for equivalent resources.

### 10. Add measurement and profiling

Track before/after metrics for each phase:

- initial route render time
- slow Supabase query duration
- client hydration cost on dashboard routes
- list render time for reviews/feedback/activity
- bundle size for large client pages

## Proposed Execution Order

1. Centralize company scoping and API authorization.
2. Refactor referral page to server-led initial data loading.
3. Refactor activity page to server-led initial data loading.
4. Add reviews pagination.
5. Add feedback pagination.
6. Create shared query helpers and migrate hot paths.
7. Introduce database-backed aggregation for the heaviest views.
8. Add indexes and profile query performance.

## Deployment Notes

- Roll out Phase 1 first because it improves correctness and performance together.
- Prefer small, reviewable PRs by feature area rather than one large performance branch.
- After each step, validate:
  - auth behavior
  - company scoping
  - page load time
  - mutation flows
  - dashboard and reporting correctness

## Working Name

Operation Fast Path
