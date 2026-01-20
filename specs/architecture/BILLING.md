# Billing Architecture Specification

## Overview

Subscription-based SaaS billing with Stripe integration. $30/month target price point with free tier for basic usage.

---

## Pricing Model

### Plans

| Feature | Free | Pro ($30/mo) |
|---------|------|--------------|
| People | 10 | Unlimited |
| Systems | Dreamspell, Tzolkin | All 6 systems |
| Exports | 5/month | Unlimited |
| AI Interpretations | 10/month | 100/month |
| Boards | 3 | Unlimited |
| Sharing | Basic links | Password-protected, analytics |
| Predictions | Daily only | Full timeline |
| Group Analysis | No | Yes |
| API Access | No | Yes |
| Support | Community | Priority |

### Pricing
```typescript
const pricing = {
  free: {
    price: 0,
    limits: {
      people: 10,
      exports: 5,
      aiTokens: 10000,
      boards: 3,
    },
  },
  pro: {
    price: 30,                   // USD/month
    priceILS: 110,               // ILS/month (approximate)
    limits: {
      people: Infinity,
      exports: Infinity,
      aiTokens: 100000,
      boards: Infinity,
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
    pro: process.env.STRIPE_PRODUCT_PRO_ID,
  },
  prices: {
    proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY_ID,
    proYearly: process.env.STRIPE_PRICE_PRO_YEARLY_ID,
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
  plan: 'pro',
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  const customerId = await getOrCreateCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: stripeConfig.prices.proMonthly,
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
    plan: 'pro',
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
      message: `You've reached your ${metric} limit. Upgrade to Pro for unlimited access.`,
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
  enabled: true,
  durationDays: 14,
  features: 'pro',               // Full Pro features during trial
  requirePaymentMethod: false,   // No card required
};
```

### Start Trial
```typescript
async function startTrial(userId: UserId): Promise<Subscription> {
  const existing = await db.subscriptions.findUnique({
    where: { user_id: userId },
  });

  if (existing?.status !== 'free' && existing?.status !== undefined) {
    throw new Error('User already has a subscription or had a trial');
  }

  const trialEnd = addDays(new Date(), trialConfig.durationDays);

  return await db.subscriptions.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      plan: 'pro',
      status: 'trialing',
      current_period_start: new Date(),
      current_period_end: trialEnd,
    },
    update: {
      plan: 'pro',
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
│  חשבונית                                                       │
│  Invoice #INV-2025-001                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  מאת / From:                     אל / To:                      │
│  Omnis Ltd.                      ליאור כהן                      │
│  contact@omnis.co.il             lior@example.com              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  תיאור                           סכום                          │
│  ──────────────────────────────────────────────────────────────│
│  Omnis Pro - Monthly             ₪110.00                       │
│  (Jan 1 - Jan 31, 2025)                                        │
│                                                                 │
│  ──────────────────────────────────────────────────────────────│
│  סה"כ / Total                    ₪110.00                       │
│  מע"מ / VAT (17%)                ₪18.70                        │
│  סה"כ לתשלום                     ₪128.70                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  שולם ב-1.1.2025 | Visa ****4242                               │
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

### Upgrade Prompt
```
┌─────────────────────────────────────────────────────────────────┐
│  🚀 שדרג ל-Pro                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  הגעת למגבלה של 10 אנשים בחשבון החינמי.                        │
│                                                                 │
│  עם Pro תקבל:                                                  │
│  ✓ אנשים ללא הגבלה                                             │
│  ✓ כל 6 המערכות הסמליות                                       │
│  ✓ ניתוח קבוצתי וקשרים                                        │
│  ✓ פרשנויות AI                                                 │
│  ✓ ייצוא ושיתוף מתקדם                                         │
│                                                                 │
│  ₪110/חודש                                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    שדרג עכשיו                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  או נסה 14 יום חינם →                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Billing Page
```
┌─────────────────────────────────────────────────────────────────┐
│  חיוב והגדרות                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  תוכנית נוכחית                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Pro                                        ₪110/חודש    │  │
│  │  החידוש הבא: 1 בפברואר 2025                              │  │
│  │                                                           │  │
│  │  [שנה תוכנית]  [בטל מנוי]                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  אמצעי תשלום                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  💳 Visa ****4242 | תוקף 12/26                           │  │
│  │  [עדכן אמצעי תשלום]                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  היסטוריית חשבוניות                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ינואר 2025    ₪128.70    שולם ✓    [הורד PDF]          │  │
│  │  דצמבר 2024    ₪128.70    שולם ✓    [הורד PDF]          │  │
│  │  נובמבר 2024   ₪128.70    שולם ✓    [הורד PDF]          │  │
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
