import { headers } from 'next/headers';
// Import from the single source of truth
import { PRICING_PLANS, normalizeCountryCode } from '../app/config/pricing';

export function getServerSideCountry() {
  const headersList = headers();
  const rawCountry = headersList.get('x-user-country') || 'DEFAULT';
  // Use the shared normalizer function for consistency
  return normalizeCountryCode(rawCountry);
}

export function getServerSidePricing(planName, cycle = 'monthly') {
  const countryCode = getServerSideCountry();
  const plan = PRICING_PLANS[planName];
  if (!plan) return null;

  const pricingDetails = plan.prices[countryCode] || plan.prices.DEFAULT;
  
  return {
    countryCode,
    ...pricingDetails,
    amount: pricingDetails[cycle],
    cycle,
  };
}