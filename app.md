# RepGuardian - Application Context Document

> **Purpose**: LLM-optimized reference for AI agents to understand project scope, architecture, and roadmap.

---

## 1. Project Overview

**RepGuardian** is a B2B SaaS platform for **reputation management and customer engagement automation**. It helps service-based businesses (salons, spas, clinics, etc.) monitor customer conversations, manage reviews, handle feedback, and run referral programs.

### Core Value Proposition
- **Automated reputation monitoring** via Google Reviews integration
- **AI-powered customer conversation handling** (via n8n webhooks + Twilio SMS)
- **Feedback sentiment analysis** with severity tagging
- **Referral program management** with reward systems
- **Real-time operational updates/alerts**

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Language** | TypeScript 5.x |
| **UI** | React 19, Tailwind CSS 4, Radix UI primitives, shadcn/ui components |
| **State/Data** | TanStack Query (React Query) |
| **Backend** | Supabase (Auth + Postgres + RLS) |
| **Messaging** | Twilio (SMS via n8n webhooks) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |

---

## 3. Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/              # Route group for dashboard layouts
│   │   ├── command-center/       # Advanced dashboard view
│   │   ├── referral-programs/    # Referral program management
│   │   └── create-program/       # Program creation wizard
│   ├── app/                      # Main authenticated app routes
│   │   ├── page.tsx              # Dashboard home (KPIs, trends, updates)
│   │   ├── inbox/                # Customer conversations
│   │   ├── reviews/              # Google Reviews management
│   │   ├── feedback/             # Customer feedback with sentiment
│   │   ├── referrals/            # Referral programs overview
│   │   └── activity/             # Activity/updates feed
│   ├── api/                      # API routes
│   │   ├── send-message/         # Proxy to n8n for SMS
│   │   └── updates/              # Fetch company updates
│   ├── auth/callback/            # Supabase auth callback
│   ├── login/                    # Login page
│   ├── register/                 # Registration
│   ├── onboarding/               # New user onboarding
│   ├── forgot-password/          # Password reset request
│   └── reset-password/           # Password reset completion
├── components/
│   ├── ui/                       # shadcn/ui base components (19 components)
│   ├── dashboard/                # Dashboard-specific components (32 components)
│   ├── feedback/                 # Feedback table components
│   └── [feature].tsx             # Feature components (navbar, charts, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   └── server.ts             # Server Supabase client
│   ├── types/
│   │   └── database.types.ts     # Supabase generated types
│   ├── company-context.ts        # Server-side company/user context
│   └── utils.ts                  # Utility functions (cn)
└── hooks/
    └── useRealtimeMessages.ts    # Supabase realtime subscription
```

---

## 4. Database Schema (Supabase)

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `company` | Business accounts | `id`, `name`, `user_id`, `phone_number`, `crm_type`, `review_link`, `reputation_score`, `reviews_analysis`, `placeIds[]`, `twilio_*` |
| `app_user` | User-company mapping | `id`, `user_id`, `company_id`, `role` |
| `client` | Customer records | `id`, `company_id`, `first_name`, `last_name`, `phone_number`, `email`, `review_submitted`, `review_request_sent` |
| `chat` | Conversation sessions | `id`, `company_id`, `client_id`, `status` |
| `messages` | Chat messages | `id`, `session_id`, `role`, `content`, `message` (JSON) |
| `feedback` | Customer feedback | `id`, `company_id`, `client_id`, `feedback_message`, `sentiment_score`, `severity`, `tags[]` |
| `conflict` | Escalated issues | `id`, `company_id`, `client_id`, `description`, `status`, `resolution` |
| `appointment` | Scheduled appointments | `id`, `company_id`, `client_id`, `scheduled_at`, `status` |
| `service` | Business services | `id`, `company_id`, `name`, `description`, `price` |
| `faq` | Business FAQs | `id`, `company_id`, `question`, `answer` |

### Referral System Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `referral_program` | Program definitions | `id`, `company_id`, `name`, `status`, `referrer_reward_id`, `referred_reward_id`, `qualification_rules`, `distribution_rules` |
| `reward` | Reward definitions | `id`, `company_id`, `name`, `type`, `amount`, `status`, `expires_in_days`, `metadata` |
| `reward_service` | Reward-service mapping | `id`, `reward_id`, `service_id`, `company_id` |
| `referral` | Individual referrals | `id`, `company_id`, `client_id`, `referral_code`, `status` |
| `link` | Trackable links | `id`, `company_id`, `client_id`, `link`, `type`, `click_count`, `refcode` |

### System Tables

| Table | Purpose |
|-------|---------|
| `update` | System notifications/alerts (implied from API usage) |

---

## 5. Authentication & Authorization

- **Auth Provider**: Supabase Auth (email/password)
- **Session Management**: `@supabase/ssr` for server-side, `@supabase/auth-helpers-nextjs` for client
- **Multi-tenancy**: Company-scoped via `company_id` foreign keys
- **User Roles**: `owner`, potentially other roles via `app_user.role`
- **RLS**: Row Level Security enabled (see `supabase/migrations/`)

### Auth Flow
1. User registers → `/register`
2. Email verification → `/auth/callback`
3. First login → `/onboarding` (create company + app_user)
4. Subsequent logins → `/app` (dashboard)

---

## 6. Key Features & Current State

### ✅ Implemented

| Feature | Status | Location |
|---------|--------|----------|
| **Dashboard** | Working | `/app` - KPIs, reputation score, reviews trend, critical updates |
| **Command Center** | Working | `/(dashboard)/command-center` - Advanced bento grid dashboard |
| **Inbox/Conversations** | Working | `/app/inbox` - Customer chat threads |
| **Reviews Management** | Working | `/app/reviews` - Google Reviews with filtering |
| **Feedback Analysis** | Working | `/app/feedback` - Sentiment analysis, severity tagging |
| **Referral Programs** | Working | `/app/referrals`, `/(dashboard)/referral-programs` |
| **Notifications** | Working | Navbar dropdown, activity feed |
| **Onboarding** | Working | `/onboarding` - Company setup wizard |
| **Auth** | Working | Login, register, password reset |

### 🔄 Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| **Supabase** | Active | Auth, database, realtime |
| **Google Places API** | Configured | `placeIds` stored on company |
| **Twilio** | Configured | SMS via n8n webhook proxy |
| **n8n** | Active | Webhook automation for messaging |

---

## 7. UI Component Library

### shadcn/ui Components (`src/components/ui/`)
`badge`, `button`, `card`, `chart`, `collapsible`, `dialog`, `dropdown-menu`, `empty`, `input`, `label`, `scroll-area`, `select`, `separator`, `skeleton`, `switch`, `table`, `tabs`, `textarea`, `toast`

### Dashboard Components (`src/components/dashboard/`)
- **Cards**: `hero-score-card`, `stat-card`, `metric-card`, `kpi-card`, `review-summary-card`, `sentinel-insight-card`, `projected-impact-card`, `economics-preview`, `audience-segment-card`, `reward-config-card`, `reward-preview-card`, `program-card`
- **Charts**: `reviews-trend-card`, `daily-referrals-chart`, `conversion-funnel`
- **Feeds**: `activity-feed`, `recent-wins-feed`, `referral-activity-feed`
- **Tables**: `participant-table`
- **Wizards**: `progress-stepper`, `wizard-sidebar`, `wizard-topbar`, `creation-sidebar`, `creation-topbar`
- **Layout**: `dashboard-sidebar`, `dashboard-topbar`, `referral-sidebar`, `referral-topbar`, `campaign-detail-sidebar`, `campaign-detail-topbar`
- **Misc**: `sms-preview`, `reward-type-selector`, `review-context-grid`

---

## 8. API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/send-message` | POST | Proxy to n8n webhook for SMS sending |
| `/api/updates` | GET | Fetch company updates/notifications |
| `/api/refer/*` | - | Referral link handling (implied) |

---

## 9. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
N8N_WEBHOOK_URL=                # n8n webhook endpoint
N8N_WEBHOOK_SECRET=             # Optional webhook auth
```

---

## 10. Known Issues & Technical Debt

| Issue | Severity | Notes |
|-------|----------|-------|
| Dashboard padding inconsistencies | Low | Previously reported, may need standardization |
| Some `any` type casts | Low | In Supabase queries for type flexibility |
| Missing `update` table in types | Medium | Used in API but not in `database.types.ts` |
| Hardcoded metrics in referrals page | Low | `metricsData` is static, should be dynamic |

---

## 11. Roadmap Opportunities

### Short-term (Quick Wins)
- [ ] Add `update` table to database types
- [ ] Make referral metrics dynamic (fetch from DB)
- [ ] Standardize dashboard padding/spacing
- [ ] Add loading states to all data-fetching components

### Medium-term (Features)
- [ ] Review response automation (AI-generated replies)
- [ ] SMS campaign builder
- [ ] Client segmentation
- [ ] Analytics dashboard with date range filters
- [ ] Reward redemption tracking
- [ ] Multi-location support (multiple `placeIds`)

### Long-term (Scale)
- [ ] Team member invitations & role management
- [ ] White-label/custom branding
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)
- [ ] Advanced AI insights (churn prediction, sentiment trends)

---

## 12. Development Commands

```bash
npm ci              # Install dependencies
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm run lint        # ESLint check
```

---

## 13. Key Files for Context

| File | Purpose |
|------|---------|
| `src/lib/company-context.ts` | Server-side auth + company resolution |
| `src/lib/types/database.types.ts` | Supabase schema types |
| `src/components/navbar.tsx` | Main navigation + notifications |
| `src/app/app/page.tsx` | Dashboard home page |
| `src/app/(dashboard)/command-center/page.tsx` | Advanced dashboard |
| `src/app/app/reviews/reviews-client.tsx` | Reviews management (32KB) |
| `src/app/app/feedback/feedback-client.tsx` | Feedback management (32KB) |

---

## 14. Agent Instructions

When working on this codebase:

1. **Always check `database.types.ts`** for available tables/columns before writing queries
2. **Use `getCompanyContext()`** in server components for auth + company scoping
3. **Use `createBrowserComponentClient()`** in client components
4. **Follow shadcn/ui patterns** for new UI components
5. **Scope all queries by `company_id`** for multi-tenancy
6. **Use TanStack Query** for client-side data fetching
7. **Check existing components** in `src/components/dashboard/` before creating new ones

---

*Last updated: March 2026*
