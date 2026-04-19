# RepGuardian Billing Flow Reference

Last updated: April 7, 2026

This document describes the current in-app Stripe billing flow as implemented in the codebase today. It is intended to be the recovery reference if billing behavior regresses or a future refactor goes sideways.

## Purpose

RepGuardian uses an in-app Stripe Elements subscription activation flow.

Core goals:

- Keep activation inside the app
- Use one Stripe customer per company
- Use the local `billing_customer` mapping as the primary customer lookup
- Use Stripe as the source of truth for live payment-method state
- Use local subscription projection for fast page rendering
- Use webhooks as the long-term reconciler
- Keep a documented rollback path for subscription confirmation behavior

## April 7, 2026 Change Summary

This is the current activation behavior after the flexible billing confirmation fix.

What changed:

- Fresh subscription creation now explicitly sets `billing_mode: { type: 'flexible' }`
- The subscribe route now expands both `latest_invoice.payment_intent` and `latest_invoice.confirmation_secret`
- Backend normalization no longer assumes `latest_invoice.payment_intent` is always present for `incomplete` subscriptions
- Frontend confirmation now supports both:
  - invoice confirmation via `latest_invoice.confirmation_secret.client_secret`
  - legacy PaymentIntent confirmation via `payment_intent.client_secret`
- Subscription reuse is stricter:
  - `active`, `trialing`, `past_due`, and `unpaid` can still be reused
  - `incomplete` is only reused if Stripe returned a usable confirmation client secret
  - stale `incomplete` subscriptions are canceled before creating a fresh subscription

Why this changed:

- The old implementation treated `latest_invoice.payment_intent` as mandatory for `incomplete` subscriptions
- In flexible billing mode, Stripe can drive confirmation from `latest_invoice.confirmation_secret` instead
- That made the old code too strict on the backend and too PaymentIntent-specific on the frontend

## Current Source Files

Primary implementation:

- [billing page](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/app/billing/page.tsx)
- [activation dialog](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/components/billing/activation-dialog.tsx)
- [billing helpers](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/lib/billing.ts)
- [server Stripe helper](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/lib/stripe.ts)
- [client Stripe helper](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/lib/stripe-client.ts)
- [subscription route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/subscription/route.ts)
- [activation context route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/activation/context/route.ts)
- [activation setup-intent route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/activation/setup-intent/route.ts)
- [activation subscribe route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/activation/subscribe/route.ts)
- [billing portal route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/portal/route.ts)
- [webhook route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/webhook/route.ts)

Deprecated compatibility stub:

- [deprecated payment-methods route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/payment-methods/route.ts)

## Billing Architecture

### 1. Billing page load

The billing page calls `GET /api/stripe/subscription`.

That route:

- authenticates the user
- resolves `company_id`
- reads the local `subscription` projection row
- reads the local `billing_customer` mapping
- reads a lightweight company billing snapshot from `company`

The page intentionally renders from local projection data first for speed. It does not hit live Stripe on every page load.

The page response includes:

- `subscription`: local projected subscription state
- `billing`: UI hints such as whether a customer mapping exists and whether portal access is available

### 2. Plan selection

The page lets the user choose:

- monthly
- annual

Plan definitions come from `BILLING_PLANS` in [billing.ts](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/lib/billing.ts).

In test mode, the app prefers:

- `STRIPE_TEST_MONTHLY_PRICE_ID`
- `STRIPE_TEST_ANNUAL_PRICE_ID`

In production, it uses:

- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_ANNUAL_PRICE_ID`

### 3. Activation modal open

When the user clicks Activate, the frontend opens the modal and calls:

- `POST /api/stripe/activation/context`

This route is intentionally read-only and fast.

It:

- authenticates the user
- resolves `company_id`
- reads `company.payment_method_connected` to determine if a default payment method exists
- reads the local plan configuration
- does NOT call any Stripe APIs

This route does not create a new Stripe customer and does not query Stripe for payment methods.

The `hasDefaultPaymentMethod` flag is derived from `company.payment_method_connected`, which is kept in sync by webhooks and the subscribe route.

### 4. Default payment method path

If the activation context returns `hasDefaultPaymentMethod: true`:

- the modal shows a "saved payment method on file" message
- the user can choose `Activate With Saved Method`
- the frontend calls `POST /api/stripe/activation/subscribe` with `useDefaultPaymentMethod: true`

The subscribe route then:

- resolves or creates the canonical Stripe customer
- loads `customer.invoice_settings.default_payment_method`
- finds a reusable subscription if one exists for the same company and price
- otherwise creates a new subscription
- uses `payment_behavior: 'default_incomplete'`
- uses `billing_mode: { type: 'flexible' }` on fresh subscription creation
- expands `latest_invoice.payment_intent`
- expands `latest_invoice.confirmation_secret`
- returns normalized subscription data plus invoice confirmation metadata

If Stripe requires authentication, the frontend handles it in-app with:

- `stripe.confirmPayment(...)` when Stripe returned `latest_invoice.confirmation_secret`
- `stripe.confirmCardPayment(...)` when the route falls back to a PaymentIntent client secret

### 5. New payment method path

If activation context does not find a usable default payment method:

- the modal transitions to SetupIntent preparation
- the frontend calls `POST /api/stripe/activation/setup-intent`

This route:

- authenticates the user
- resolves `company_id`
- calls `resolveOrCreateStripeCustomer(...)`
- creates a Stripe SetupIntent for that customer
- returns `clientSecret`, `setupIntentId`, and `customerId`

The frontend then renders Stripe `PaymentElement` inside the modal and calls:

- `stripe.confirmSetup({ redirect: 'if_required' })`

If setup succeeds:

- the frontend extracts `paymentMethodId`
- the frontend calls `POST /api/stripe/activation/subscribe` with that `paymentMethodId`

The subscribe route then:

- resolves or creates the canonical Stripe customer
- verifies the payment method belongs to that customer or attaches it
- sets `customer.invoice_settings.default_payment_method`
- creates or updates the subscription
- returns confirmation data for the frontend based on the actual Stripe invoice state

### 6. Billing Portal path

Billing Portal is post-purchase management only.

The page uses:

- `POST /api/stripe/portal`

That route:

- authenticates the user
- resolves `company_id`
- resolves an existing Stripe customer only
- creates a billing portal session
- returns the portal URL

It does not create a new customer.

### 7. Cancellation and reactivation

The billing page supports:

- `DELETE /api/stripe/subscription`
- `PUT /api/stripe/subscription`

Cancel:

- defaults to `cancel_at_period_end: true`
- updates local projection immediately
- updates `company.subscription_status`

Reactivate:

- sets `cancel_at_period_end: false`
- clears local cancellation markers
- updates `company.subscription_status`

### 8. Webhook reconciliation

The webhook route is:

- `POST /api/stripe/webhook`

It stores and processes Stripe events through the local `billing_event` table for idempotency.

Handled event types:

- `setup_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Webhook responsibilities:

- set the customer default payment method on first saved method if missing
- update `company.payment_method_connected`
- upsert subscription projection rows
- cache invoice projection rows
- mark billing events processed or store error state

## Customer Lifecycle

Customer ownership rule:

- one Stripe customer per company

Customer resolution logic lives in:

- `resolveExistingStripeCustomer(...)`
- `resolveOrCreateStripeCustomer(...)`

### `resolveExistingStripeCustomer(...)`

Used for read-only or management paths.

Behavior:

- read local `billing_customer`
- if a mapped `stripe_customer_id` exists, verify it in Stripe
- if valid, reuse it
- if stale, log a warning and continue
- search Stripe by `metadata.companyId`
- return a customer if found
- never create a new customer

### `resolveOrCreateStripeCustomer(...)`

Used in SetupIntent and subscription-creation paths.

Behavior:

- read local `billing_customer`
- if mapped customer exists, verify it in Stripe
- if valid, reuse it
- if missing or deleted, clear the stale local mapping
- search Stripe by `metadata.companyId`
- if found, restore local mapping and reuse
- if not found, create a fresh Stripe customer
- persist the new mapping with `company_id`

Important bug fix:

- customer creation no longer uses the bad static idempotency key `billing-customer:${companyId}`
- this prevents Stripe from replaying deleted customer IDs during test-mode recreation

## Subscription Lifecycle

Subscription orchestration is fully server-side.

Create or reuse logic:

- if a reusable subscription already exists for the same Stripe customer and selected price, update it
- otherwise create a new subscription

Reusable statuses:

- `active`
- `trialing`
- `past_due`
- `unpaid`

Special handling for `incomplete`:

- an `incomplete` subscription is inspected before reuse
- the route normalizes `latest_invoice.confirmation_secret` and `latest_invoice.payment_intent`
- if there is a usable confirmation client secret, the subscription can be reused
- if no usable confirmation client secret exists, that `incomplete` subscription is treated as stale
- stale `incomplete` subscriptions are canceled and replaced with a fresh subscription

Subscription creation settings:

- `collection_method: 'charge_automatically'`
- `payment_behavior: 'default_incomplete'`
- `billing_mode.type: 'flexible'`
- `payment_settings.save_default_payment_method: 'on_subscription'`
- `default_payment_method` passed explicitly

The route returns:

- normalized local-style subscription shape
- `requiresAction`
- `frontendConfirmationRequired`
- `paymentIntentClientSecret`
- `paymentIntentStatus`
- `confirmationClientSecret`
- `confirmationTokenType`
- `latestInvoiceId`
- `latestInvoiceStatus`
- `latestInvoiceHasConfirmationSecret`
- `latestInvoiceHasPaymentIntent`
- `billingMode`
- `stripeApiVersion`
- `usedPaymentMethodId`
- `reusedExistingSubscription`

## Frontend Activation State Machine

The activation modal in [activation-dialog.tsx](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/components/billing/activation-dialog.tsx) uses these phases:

- `idle`
- `loading_activation_context`
- `default_method_available`
- `preparing_setup_intent`
- `collecting_new_method`
- `confirming_setup`
- `creating_subscription`
- `requires_action`
- `activation_succeeded`
- `activation_failed`

State behavior:

- `idle`: modal closed or reset
- `loading_activation_context`: calls activation context route
- `default_method_available`: shows saved default card and activation CTA
- `preparing_setup_intent`: requests a SetupIntent only when needed
- `collecting_new_method`: renders Stripe PaymentElement
- `confirming_setup`: runs `stripe.confirmSetup`
- `creating_subscription`: calls activation subscribe route
- `requires_action`: runs Stripe client confirmation using the normalized response shape
- `activation_succeeded`: closes modal and updates local page state
- `activation_failed`: keeps the modal recoverable with retry

Important frontend behavior:

- PaymentElement is only shown for the new-method branch
- card fields are Stripe-hosted, not custom inputs
- the modal never redirects to Checkout for activation
- the user stays inside the app for activation and 3DS
- frontend confirmation is no longer PaymentIntent-only
- when `confirmationTokenType === 'invoice_confirmation_secret'`, the modal uses `stripe.confirmPayment({ redirect: 'if_required' })`
- when `confirmationTokenType === 'payment_intent'`, the modal uses `stripe.confirmCardPayment(...)`
- the modal only hard-fails an `incomplete` activation when Stripe returned no usable confirmation client secret at all

## Local Data Model Expectations

Key local tables used by this architecture:

- `billing_customer`
- `subscription`
- `invoice`
- `billing_event`
- `company`
- `plans`

Important local expectations:

- `billing_customer.company_id` should be unique
- `subscription.company_id` should be unique for upsert behavior
- `billing_event.stripe_event_id` should be unique for idempotency

## Stripe Metadata Contract

When creating SetupIntents or Subscriptions, the app writes metadata using `buildStripeMetadata(...)`.

Metadata keys:

- `companyId`
- `userId`
- `plan`
- `planId` when available

This metadata is used for:

- customer recovery via Stripe search
- subscription reconciliation
- webhook context resolution

## Current Invariants

These rules should not be broken without an explicit architecture change:

- Activation must stay in-app
- Billing Portal must stay out of the activation flow
- PaymentElement must stay Stripe-hosted
- The local customer mapping is the first lookup for customer identity
- Stripe customer existence must be verified before reuse
- Deleted or missing mapped customers must be treated as stale
- A new Stripe customer should only be created when no valid reusable customer exists
- A stale `incomplete` subscription must not be blindly reused
- Local projection should drive page rendering speed
- Webhooks should remain the long-term reconciler
- The backend should normalize invoice confirmation state before the frontend decides how to confirm

## Known Tradeoffs

These are deliberate choices in the current build:

- billing page load is fast because it prefers local projection over live Stripe reads
- activation context is now fully local - no Stripe API calls - using `company.payment_method_connected` as the source of truth
- `company.payment_method_connected` is updated by webhooks and the subscribe route after successful payment method attachment
- the deprecated `payment-methods` route remains as a harmless stub so old editor tabs or stale callers fail safely instead of breaking type-checking

## Recovery Checklist

If billing breaks in the future, check these in order:

1. Verify the selected plan has the correct Stripe price ID in env.
2. Verify `billing_customer` contains at most one row per company.
3. Verify the mapped Stripe customer still exists and is not deleted.
4. Verify activation context is read-only and not creating customers.
5. Verify SetupIntent creation and subscription creation both use `resolveOrCreateStripeCustomer(...)`.
6. Verify customer creation does not use a static idempotency key.
7. Verify subscription creation uses `payment_behavior: 'default_incomplete'`.
8. Verify subscription creation uses `billing_mode: { type: 'flexible' }`.
9. Verify subscription expansion includes both `latest_invoice.payment_intent` and `latest_invoice.confirmation_secret`.
10. Verify stale `incomplete` subscriptions are canceled instead of reused.
11. Verify the default payment method is being set on the Stripe customer after SetupIntent success.
12. Verify webhook delivery and `billing_event` processing.
13. Verify local `subscription` projection matches Stripe subscription state.

## Rollback Guide

Use this section if the new flexible billing confirmation path causes regressions.

Backend rollback targets:

- [subscribe route](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/app/api/stripe/activation/subscribe/route.ts)

Frontend rollback targets:

- [activation dialog](/C:/Users/ASUS/OneDrive/Desktop/repguardian-app/src/components/billing/activation-dialog.tsx)

What to revert if needed:

- remove `billing_mode: { type: 'flexible' }` from fresh subscription creation
- stop expanding `latest_invoice.confirmation_secret`
- remove `confirmationClientSecret` and `confirmationTokenType` from the subscribe response
- revert frontend confirmation to PaymentIntent-only handling
- revert reuse logic so `incomplete` subscriptions are not specially canceled when stale

What will regress if rolled back:

- the route may again fail on flexible billing invoices that do not expose `latest_invoice.payment_intent`
- the frontend will again assume all subscription confirmation must use `stripe.confirmCardPayment(...)`
- stale `incomplete` subscriptions may again get reused and surface as server-side activation failures

Safe rollback order:

1. Revert the frontend confirmation changes first if confirmation errors are purely client-side.
2. Revert the backend confirmation-shape changes only if Stripe is not returning `confirmation_secret` in your environment.
3. Revert the stricter `incomplete` reuse policy only if you explicitly want the previous behavior and accept stale-subscription risk.
4. Re-test activation with:
   - saved default payment method
   - newly collected payment method
   - 3DS-required card
   - stale historical subscription present on the customer

## Routes At A Glance

- `GET /api/stripe/subscription`
- `POST /api/stripe/activation/context`
- `POST /api/stripe/activation/setup-intent`
- `POST /api/stripe/activation/subscribe`
- `POST /api/stripe/portal`
- `DELETE /api/stripe/subscription`
- `PUT /api/stripe/subscription`
- `POST /api/stripe/webhook`

## What This Replaced

This architecture replaces the older mixed billing setup that had:

- Checkout-oriented activation paths
- overlapping customer creation paths
- stale-customer reuse bugs
- brittle default-payment-method checks
- old dead routes left in the tree

The current target architecture is a single in-app subscription activation flow backed by Stripe Elements, server-side subscription orchestration, and webhook-based projection reconciliation.
