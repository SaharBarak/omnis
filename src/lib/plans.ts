// Display-only plan feature copy for the public pricing page.
// Billing logic + entitlements live in src/lib/services/billing.ts (PLANS).
export const PLAN_FEATURES = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Up to 3 projects',
      'Basic analytics',
      'Community support',
      '1 team member',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 29,
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'Up to 10 team members',
      'Custom integrations',
      'API access',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99,
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
      'SSO & SAML',
      'Audit logs',
    ],
  },
} as const
