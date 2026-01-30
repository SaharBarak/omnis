# Billing Architecture Specification

## Overview

Subscription-based SaaS billing with Stripe integration. Three tiers designed to convert free users to paying customers through meaningful feature restrictions.

---

## Pricing Model

### Plans

| Feature | Free | Complete ($9/mo) | Practitioner ($29/mo) |
|---------|------|------------------|----------------------|
| Profiles | 1 (self only) | 10 | Unlimited |
| Systems | Dreamspell only | All 6 systems | All 6 systems |
| Exports | None | Unlimited | Unlimited |
| AI Interpretations | None | 30/month | Unlimited |
| Boards | None | 5 | Unlimited |
| Sharing | None | Basic links | Password-protected, analytics |
| Timeline | None | Full access | Full access |
| Relationship Analysis | None | Basic compatibility | Advanced matrix |
| Group Analysis | No | No | Yes |
| Oracle Mapping | No | Basic | Advanced |
| API Access | No | No | Yes |
| Support | Community | Email | Priority |

### Key Restrictions (Free Tier)

The free tier is intentionally limited to demonstrate value while pushing users to upgrade:

1. **Single profile**: Users can only save themselves, not family/friends
2. **Dreamspell only**: No Tzolkin, Long Count, Human Design, Astrology, or Gematria
3. **No AI**: Zero AI interpretations - just raw calculations
4. **No exports**: Cannot save or share results
5. **No timeline**: Cannot see past/future dates or galactic returns
6. **No relationships**: Cannot compare profiles or see compatibility

### Upgrade Triggers

These moments should prompt upgrade CTAs:
- Attempting to add a 2nd profile
- Clicking on any locked system tab
- Clicking "Get AI Interpretation"
- Clicking "Export PDF" or "Share"
- Clicking on timeline or relationship features
- Viewing daily kin without interpretation

### Pricing
```typescript
const pricing = {
  free: {
    price: 0,
    limits: {
      profiles: 1,
      systems: ['dreamspell'],
      exports: 0,
      aiInterpretations: 0,
      boards: 0,
      timeline: false,
      relationships: false,
    },
  },
  complete: {
    price: 9,                    // USD/month
    priceILS: 33,                // ILS/month (approximate)
    limits: {
      profiles: 10,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      exports: Infinity,
      aiInterpretations: 30,
      boards: 5,
      timeline: true,
      relationships: 'basic',
    },
  },
  practitioner: {
    price: 29,                   // USD/month
    priceILS: 107,               // ILS/month (approximate)
    limits: {
      profiles: Infinity,
      systems: ['dreamspell', 'tzolkin', 'longcount', 'humandesign', 'astrology', 'gematria'],
      exports: Infinity,
      aiInterpretations: Infinity,
      boards: Infinity,
      timeline: true,
      relationships: 'advanced',
      groupAnalysis: true,
      apiAccess: true,
    },
  },
};
```

---

## Stripe Integration

### Configuration
```typescript
const stripeConfig = {
  publicKey: process.env.STRIPE_PUBLIC_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  products: {
    complete: process.env.STRIPE_PRODUCT_COMPLETE_ID,
    practitioner: process.env.STRIPE_PRODUCT_PRACTITIONER_ID,
  },
  prices: {
    completeMonthly: process.env.STRIPE_PRICE_COMPLETE_MONTHLY_ID,
    completeYearly: process.env.STRIPE_PRICE_COMPLETE_YEARLY_ID,
    practitionerMonthly: process.env.STRIPE_PRICE_PRACTITIONER_MONTHLY_ID,
    practitionerYearly: process.env.STRIPE_PRICE_PRACTITIONER_YEARLY_ID,
  },
};
```

### Stripe Objects

#### Customer
```typescript
interface StripeCustomer {
  id: string;                    // cus_xxxxx
  email: string;
  name: string;
  metadata: {
    omnis_user_id: string;
  };
}

async function getOrCreateCustomer(user: User): Promise<string> {
  // Check if customer exists
  const existingCustomer = await stripe.customers.search({
    query: `metadata['omnis_user_id']:'${user.id}'`,
  });

  if (existingCustomer.data.length > 0) {
    return existingCustomer.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.profile?.displayName,
    metadata: {
      omnis_user_id: user.id,
    },
  });

  return customer.id;
}
```

#### Subscription
```typescript
interface StripeSubscription {
  id: string;                    // sub_xxxxx
  customer: string;
  status: SubscriptionStatus;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: { id: string };
    }>;
  };
}
```

---

## Checkout Flow

### Sequence
```
┌────────┐     ┌─────────┐     ┌────────┐     ┌────────┐
│ Client │     │ Backend │     │ Stripe │     │Database│
└───┬────┘     └────┬────┘     └───┬────┘     └───┬────┘
    │               │              │              │
    │ Click Upgrade │              │              │
    ├──────────────►│              │              │
    │               │ create session              │
    │               ├─────────────►│              │
    │               │◄─────────────┤              │
    │ redirect to   │              │              │
    │ checkout      │              │              │
    │◄──────────────┤              │              │
    │               │              │              │
    │ ─────────────────────────────►│             │
    │    complete payment          │              │
    │◄─────────────────────────────┤              │
    │               │              │              │
    │               │    webhook   │              │
    │               │◄─────────────┤              │
    │               │              │ update       │
    │               │──────────────┼─────────────►│
    │               │              │              │
    │ redirect to   │              │              │
    │ success page  │              │              │
    │◄──────────────┤              │              │
```

### Create Checkout Session
```typescript
async function createCheckoutSession(
  userId: UserId,
  plan: 'complete' | 'practitioner',
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  const customerId = await getOrCreateCustomer(userId);

  const priceId = plan === 'complete'
    ? stripeConfig.prices.completeMonthly
    : stripeConfig.prices.practitionerMonthly;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
    },
    tax_id_collection: {
      enabled: true,
    },
    metadata: {
      omnis_user_id: userId,
      omnis_plan: plan,
    },
  });

  return { url: session.url };
}
```

### Success Handling
```typescript
async function handleCheckoutSuccess(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const subscription = session.subscription as Stripe.Subscription;
  const userId = session.metadata.omnis_user_id;

  await upsertSubscription({
    userId,
    plan: 'complete',
    status: 'active',
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: session.customer as string,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });
}
```

---

## Webhooks

### Webhook Handler
```typescript
const webhookHandlers: Record<string, WebhookHandler> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'invoice.paid': handleInvoicePaid,
  'invoice.payment_failed': handlePaymentFailed,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
};

async function handleWebhook(
  rawBody: string,
  signature: string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    stripeConfig.webhookSecret
  );

  const handler = webhookHandlers[event.type];
  if (handler) {
    await handler(event.data.object);
  }
}
```

### Event Handlers

#### invoice.paid
```typescript
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await db.subscriptions.update({
    where: { stripe_subscription_id: subscriptionId },
    data: {
      status: 'active',
      current_period_end: new Date(subscription.current_period_end * 1000),
    },
  });

  // Send receipt email
  await sendReceiptEmail(invoice);
}
```

#### invoice.payment_failed
```typescript
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  await db.subscriptions.update({
    where: { stripe_subscription_id: subscriptionId },
    data: { status: 'past_due' },
  });

  // Notify user
  await sendPaymentFailedEmail(invoice.customer_email);
}
```

#### customer.subscription.deleted
```typescript
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await db.subscriptions.update({
    where: { stripe_subscription_id: subscription.id },
    data: {
      status: 'canceled',
      plan: 'free',
    },
  });

  // Send cancellation confirmation
  await sendCancellationEmail(subscription.customer);
}
```

---

## Subscription Management

### Cancel Subscription
```typescript
async function cancelSubscription(userId: UserId): Promise<void> {
  const subscription = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  if (!subscription?.stripe_subscription_id) {
    throw new Error('No active subscription');
  }

  // Cancel at period end (user keeps access until then)
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await db.subscriptions.update({
    where: { user_id: userId },
    data: { cancel_at_period_end: true },
  });
}
```

### Reactivate Subscription
```typescript
async function reactivateSubscription(userId: UserId): Promise<void> {
  const subscription = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  if (!subscription?.stripe_subscription_id) {
    throw new Error('No subscription to reactivate');
  }

  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: false,
  });

  await db.subscriptions.update({
    where: { user_id: userId },
    data: { cancel_at_period_end: false },
  });
}
```

### Update Payment Method
```typescript
async function createBillingPortalSession(
  userId: UserId,
  returnUrl: string
): Promise<{ url: string }> {
  const subscription = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: returnUrl,
  });

  return { url: session.url };
}
```

---

## Usage Tracking

### Track Usage
```typescript
async function trackUsage(
  userId: UserId,
  metric: UsageMetric,
  amount: number = 1
): Promise<void> {
  const period = format(new Date(), 'yyyy-MM');

  await db.usage.upsert({
    where: { user_id_period: { user_id: userId, period } },
    create: {
      user_id: userId,
      period,
      [metric]: amount,
    },
    update: {
      [metric]: { increment: amount },
    },
  });
}

type UsageMetric = 'people_count' | 'ai_tokens_used' | 'exports_count';
```

### Check Limits
```typescript
async function checkLimit(
  userId: UserId,
  metric: UsageMetric
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const subscription = await getSubscription(userId);
  const usage = await getCurrentUsage(userId);
  const limits = pricing[subscription.plan].limits;

  const current = usage[metric] || 0;
  const limit = limits[metricToLimit[metric]];

  return {
    allowed: current < limit,
    current,
    limit,
  };
}

const metricToLimit: Record<UsageMetric, keyof Limits> = {
  people_count: 'people',
  ai_tokens_used: 'aiTokens',
  exports_count: 'exports',
};
```

### Enforce Limits
```typescript
async function requireLimit(
  userId: UserId,
  metric: UsageMetric
): Promise<void> {
  const { allowed, current, limit } = await checkLimit(userId, metric);

  if (!allowed) {
    throw new LimitExceededError({
      metric,
      current,
      limit,
      message: `You've reached your ${metric} limit. Upgrade to Complete or Practitioner for more access.`,
    });
  }
}

// Usage in API routes
async function createPerson(userId: UserId, data: PersonInput): Promise<Person> {
  await requireLimit(userId, 'people_count');

  const person = await db.people.create({ data: { ...data, owner_id: userId } });
  await trackUsage(userId, 'people_count');

  return person;
}
```

---

## Trials

### Trial Configuration
```typescript
const trialConfig = {
  complete: {
    enabled: true,
    durationDays: 7,              // 7-day trial for Complete plan
    requirePaymentMethod: false,  // No card required
  },
  practitioner: {
    enabled: true,
    durationDays: 14,             // 14-day trial for Practitioner plan
    requirePaymentMethod: false,  // No card required
  },
};
```

### Start Trial
```typescript
async function startTrial(
  userId: UserId,
  plan: 'complete' | 'practitioner' = 'complete'
): Promise<Subscription> {
  const existing = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  if (existing?.status !== 'free' && existing?.status !== undefined) {
    throw new Error('User already has a subscription or had a trial');
  }

  const config = trialConfig[plan];
  const trialEnd = addDays(new Date(), config.durationDays);

  return await db.subscriptions.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      plan,
      status: 'trialing',
      current_period_start: new Date(),
      current_period_end: trialEnd,
    },
    update: {
      plan,
      status: 'trialing',
      current_period_start: new Date(),
      current_period_end: trialEnd,
    },
  });
}
```

### Trial End Handling
```typescript
// Cron job: daily
async function handleExpiredTrials(): Promise<void> {
  const expiredTrials = await db.subscriptions.findMany({
    where: {
      status: 'trialing',
      current_period_end: { lt: new Date() },
    },
  });

  for (const subscription of expiredTrials) {
    await db.subscriptions.update({
      where: { id: subscription.id },
      data: {
        plan: 'free',
        status: 'active',
      },
    });

    await sendTrialEndedEmail(subscription.user_id);
  }
}
```

---

## Invoicing

### Invoice Display
```
┌─────────────────────────────────────────────────────────────────┐
│  Invoice                                                        │
│  Invoice #INV-2025-001                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  From:                           To:                            │
│  Omnis Ltd.                      John Doe                       │
│  billing@omnis.app              john@example.com               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Description                     Amount                         │
│  ──────────────────────────────────────────────────────────────│
│  Omnis Complete - Monthly        $9.00                         │
│  (Jan 1 - Jan 31, 2025)                                        │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  Total                           $9.00                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Paid on Jan 1, 2025 | Visa ****4242                           │
└─────────────────────────────────────────────────────────────────┘
```

### Invoice Generation
```typescript
// Stripe generates invoices automatically
// We display them via the Billing Portal or our own UI

async function getInvoices(userId: UserId): Promise<Invoice[]> {
  const subscription = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  if (!subscription?.stripe_customer_id) {
    return [];
  }

  const invoices = await stripe.invoices.list({
    customer: subscription.stripe_customer_id,
    limit: 12,
  });

  return invoices.data.map(formatInvoice);
}
```

---

## Refunds

### Refund Policy
```typescript
const refundPolicy = {
  fullRefundWindow: 7,           // Days from payment
  proRataEnabled: false,         // No prorated refunds
  autoRefundOnCancel: false,     // Access continues until period end
};
```

### Process Refund
```typescript
async function processRefund(
  invoiceId: string,
  reason: string
): Promise<void> {
  const invoice = await stripe.invoices.retrieve(invoiceId);

  // Check refund eligibility
  const paymentDate = new Date(invoice.status_transitions.paid_at * 1000);
  const daysSincePayment = differenceInDays(new Date(), paymentDate);

  if (daysSincePayment > refundPolicy.fullRefundWindow) {
    throw new Error('Refund window expired');
  }

  // Create refund
  await stripe.refunds.create({
    payment_intent: invoice.payment_intent as string,
    reason: 'requested_by_customer',
    metadata: { reason },
  });

  // Cancel subscription
  const subscriptionId = invoice.subscription as string;
  await stripe.subscriptions.cancel(subscriptionId);

  // Update database
  await db.subscriptions.update({
    where: { stripe_subscription_id: subscriptionId },
    data: {
      status: 'canceled',
      plan: 'free',
    },
  });
}
```

---

## UI Components

### Upgrade Prompt (Free -> Complete)
```
┌─────────────────────────────────────────────────────────────────┐
│  Upgrade to Complete                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You've reached the limit of the free plan.                    │
│                                                                 │
│  With Complete you get:                                         │
│  ✓ Up to 10 profiles (not just yourself)                       │
│  ✓ All 6 symbolic systems                                      │
│  ✓ 30 AI interpretations per month                             │
│  ✓ Export to PDF & share                                       │
│  ✓ Full timeline access                                        │
│                                                                 │
│  $9/month                                                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Upgrade Now                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  or try 7 days free →                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Upgrade Prompt (Complete -> Practitioner)
```
┌─────────────────────────────────────────────────────────────────┐
│  Upgrade to Practitioner                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Need more profiles or unlimited AI?                           │
│                                                                 │
│  With Practitioner you get:                                    │
│  ✓ Unlimited profiles                                          │
│  ✓ Unlimited AI interpretations                                │
│  ✓ Advanced relationship matrix                                │
│  ✓ Group dynamics analysis                                     │
│  ✓ Priority support                                            │
│                                                                 │
│  $29/month                                                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Upgrade Now                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Billing Page
```
┌─────────────────────────────────────────────────────────────────┐
│  Billing & Settings                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Current Plan                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Complete                                     $9/month    │  │
│  │  Next renewal: February 1, 2025                          │  │
│  │                                                           │  │
│  │  [Change Plan]  [Cancel Subscription]                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Payment Method                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Visa ****4242 | Expires 12/26                           │  │
│  │  [Update Payment Method]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Invoice History                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Jan 2025    $9.00    Paid ✓    [Download PDF]           │  │
│  │  Dec 2024    $9.00    Paid ✓    [Download PDF]           │  │
│  │  Nov 2024    $9.00    Paid ✓    [Download PDF]           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analytics

### Revenue Metrics
```typescript
interface RevenueMetrics {
  mrr: number;                   // Monthly Recurring Revenue
  arr: number;                   // Annual Recurring Revenue
  churnRate: number;             // Monthly churn %
  ltv: number;                   // Lifetime Value
  cac: number;                   // Customer Acquisition Cost
  activeSubscribers: number;
  trialConversionRate: number;
}

async function calculateMetrics(): Promise<RevenueMetrics> {
  // Calculate from Stripe data + database
}
```

### Tracking Events
```typescript
// Track for analytics
const billingEvents = [
  'trial_started',
  'trial_converted',
  'trial_expired',
  'subscription_created',
  'subscription_canceled',
  'subscription_reactivated',
  'payment_succeeded',
  'payment_failed',
  'refund_processed',
];
```
