# RepGuardian - Billing and App Context

> Purpose: current architecture reference with billing responsibilities, live-vs-cached rules, and route behavior.

## Overview

RepGuardian is a multi-tenant SaaS app built on Next.js and Supabase. Stripe is now treated as the source of truth for billing objects, while the app keeps only the local mapping and entitlement projection it needs for access control and debugging.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Backend | Supabase Auth + Postgres |
| Billing | Stripe |
| Automation | n8n |
| UI | React 19, Tailwind CSS 4, Radix UI |

## Current App Structure

```text
src/
  app/
    app/
      billing/
      feedback/
      inbox/
      reviews/
      activity/
      referral/
      referrals/
    api/
      refer/
      review-reply/
      send-message/
      stripe/
        checkout/
        customer/
        payment-methods/
        setup-intent/
        subscription/
        webhook/
      updates/
  components/
  lib/
    billing.ts
    company-context.ts
    stripe.ts
    stripe-client.ts
    supabase/
    types/database.types.ts
```

## Billing Source of Truth

### Stripe owns

- payment methods
- invoices
- billing customer profile details
- raw subscription billing state
- setup and checkout flows

### App owns

- company to Stripe customer mapping via `billing_customer`
- entitlement projection via `subscription`
- billing webhook idempotency via `billing_event`
- app plan definitions and entitlement meaning via `plans`
- optional invoice cache for reporting/debugging

## Billing Tables

| Table | Runtime role |
|---|---|
| `billing_customer` | canonical local mapping from `company_id` to `stripe_customer_id` |
| `subscription` | local subscription projection for access control and app logic |
| `billing_event` | durable Stripe webhook log and idempotency ledger |
| `invoice` | cache-only mirror for reporting/debugging, not billing truth |
| `plans` | app-owned entitlement definitions |

### Deprecated as billing truth

These may still exist in schema for compatibility, but runtime billing logic should not depend on them:

- `company.payment_method_connected`
- `company.subscription_status`
- `company.stripe_account_id` unless Stripe Connect is actually implemented
- `payment_method` table as canonical state

## Live vs Cached Rules

### Live from Stripe

- payment methods
- billing customer profile fields
- invoice object details
- subscription billing object details

### Local projection

- `billing_customer`
- `subscription`
- `billing_event`
- `plans`

### Optional cache only

- `invoice`
- Stripe reference fields cached on `subscription`

Local cached Stripe data is advisory and is reconciled by webhook processing.

## Billing Routes

| Route | Responsibility |
|---|---|
| `/api/stripe/setup-intent` | create or reuse `billing_customer`, create Stripe SetupIntent |
| `/api/stripe/payment-methods` | fetch payment methods live from Stripe, set default, detach |
| `/api/stripe/customer` | resolve and validate Stripe customer for the current company |
| `/api/stripe/checkout` | initiate Stripe Checkout or direct subscription creation |
| `/api/stripe/subscription` | read local projection, cancel/reactivate in Stripe |
| `/api/stripe/webhook` | canonical reconciliation path for billing state |

## Webhook Responsibilities

`/api/stripe/webhook` is the authoritative sync layer for long-term billing consistency.

Handled events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Ignored for local mirroring:

- `payment_method.attached`
- `payment_method.detached`

Webhook processing rules:

1. verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
2. create or reuse a `billing_event` row keyed by `stripe_event_id`
3. resolve company from Stripe references or metadata
4. reconcile local `subscription` projection
5. cache invoice data only as advisory/reporting state
6. mark `billing_event.processed = true` on success
7. persist `error_message` on failure

## Plan Mapping Strategy

- `plans` is the app source of truth for entitlement meaning
- `src/lib/billing.ts` contains Stripe price configuration needed to initiate billing flows
- Stripe price IDs are config, not entitlement truth
- runtime flow is: app plan key -> configured Stripe price -> Stripe object -> webhook projection

### Special test charge

The `test` billing path is intentionally one-time and now runs in Stripe Checkout `payment` mode.
It is not treated as a subscription plan.

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_ANNUAL_PRICE_ID=
STRIPE_TEST_PRICE=
STRIPE_WEBHOOK_SECRET=
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
REVIEW_REPLY_WEBHOOK_URL=
```

## Working Notes

1. Use Stripe as the source of truth for mutable billing objects.
2. Use local `subscription` rows for entitlement checks and app gating.
3. Do not add new logic that depends on `company.payment_method_connected`.
4. Do not mirror payment methods into local runtime state.
5. When billing behavior changes, update both webhook reconciliation and the typed billing tables in `src/lib/types/database.types.ts`.

*Last updated: April 2026*
