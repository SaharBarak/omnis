import Stripe from 'stripe';

// Lazy-initialized Stripe client (avoids build-time initialization errors)
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// For backwards compatibility
export const stripe = {
  get instance() {
    return getStripe();
  },
};

// Price IDs - these should be created in Stripe Dashboard
export const STRIPE_PRICES = {
  FREE: null, // Free tier, no Stripe price
  PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
  PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY,
  ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
  ENTERPRISE_YEARLY: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
} as const;

// Plan features for display
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
} as const;
