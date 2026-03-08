import { useSubscriptionStore, type SubscriptionPlan } from '@/store/subscription-store';

// ── Configuration ────────────────────────────────────────────────
// When ready for production with a development build:
// 1. npm install react-native-purchases
// 2. Replace placeholder keys below with real RevenueCat API keys
// 3. Uncomment the native SDK code in each function

// Entitlement identifier configured in the RevenueCat dashboard
const ENTITLEMENT_ID = 'premium';

// ── Stub types that mirror RevenueCat shapes ────────────────────

export interface StubPackage {
  identifier: string;
  product: { title: string; priceString: string; identifier: string };
}

export interface StubOfferings {
  current: { availablePackages: StubPackage[] } | null;
}

// ── Init ─────────────────────────────────────────────────────────

let initialized = false;

export async function initRevenueCat(): Promise<void> {
  if (initialized) return;
  initialized = true;
  // Stub — no native SDK in Expo Go
}

// ── Offerings ────────────────────────────────────────────────────

export async function fetchOfferings(): Promise<StubOfferings | null> {
  // Return stub offerings for development
  return {
    current: {
      availablePackages: [
        {
          identifier: '$rc_monthly',
          product: { title: 'Monthly', priceString: '$9.99/mo', identifier: 'calobite_monthly' },
        },
        {
          identifier: '$rc_annual',
          product: { title: 'Yearly', priceString: '$59.99/yr', identifier: 'calobite_yearly' },
        },
      ],
    },
  };
}

// ── Purchase ─────────────────────────────────────────────────────

export async function purchase(pkg: StubPackage): Promise<boolean> {
  // Stub: simulate a successful purchase with a realistic expiration date
  const plan: SubscriptionPlan = pkg.identifier.includes('annual') ? 'yearly' : 'monthly';
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (plan === 'yearly' ? 12 : 1));
  useSubscriptionStore.getState().activate(plan, expiresAt.toISOString(), pkg.product.identifier);
  return true;
}

// ── Restore ──────────────────────────────────────────────────────

export async function restorePurchases(): Promise<boolean> {
  // Stub: nothing to restore
  return false;
}
