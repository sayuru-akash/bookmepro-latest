// utils/planUtils.js
export const PLANS = {
  STARTER: "starter",
  GROWTH: "growth",
  PRO: "pro",
  ENTERPRISE: "enterprise",
};

export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  YEARLY: "yearly",
};

export const PLAN_DETAILS = {
  [PLANS.STARTER]: {
    maxStudents: 25,
    prices: {
      [BILLING_CYCLES.MONTHLY]: 1000, // $10.00
      [BILLING_CYCLES.QUARTERLY]: 2500, // $25.00
      [BILLING_CYCLES.YEARLY]: 9000, // $90.00
    },
    trialDays: 14,
  },
  [PLANS.GROWTH]: {
    maxStudents: 50,
    prices: {
      [BILLING_CYCLES.MONTHLY]: 1500,
      [BILLING_CYCLES.QUARTERLY]: 4000,
      [BILLING_CYCLES.YEARLY]: 12000,
    },
    trialDays: 14,
  },
  [PLANS.PRO]: {
    maxStudents: 100,
    prices: {
      [BILLING_CYCLES.MONTHLY]: 2000,
      [BILLING_CYCLES.QUARTERLY]: 5000,
      [BILLING_CYCLES.YEARLY]: 15000,
    },
    trialDays: 7,
  },
  [PLANS.ENTERPRISE]: {
    maxStudents: 10000,
    prices: {
      [BILLING_CYCLES.MONTHLY]: 2500,
      [BILLING_CYCLES.QUARTERLY]: 6000,
      [BILLING_CYCLES.YEARLY]: 20000,
    },
    trialDays: 0,
  },
};

// Get maximum students for a plan
export function getMaxStudents(plan) {
  const normalizedPlan = plan?.toLowerCase();
  return PLAN_DETAILS[normalizedPlan]?.maxStudents || 25;
}

// Get price in cents
export function getPrice(plan, billingCycle) {
  const normalizedPlan = plan?.toLowerCase();
  const normalizedBilling = billingCycle?.toLowerCase();

  return PLAN_DETAILS[normalizedPlan]?.prices?.[normalizedBilling] || 0;
}

// Get billing cycle multiplier (months)
export function getBillingCycleMonths(billingCycle) {
  return (
    {
      [BILLING_CYCLES.MONTHLY]: 1,
      [BILLING_CYCLES.QUARTERLY]: 3,
      [BILLING_CYCLES.YEARLY]: 12,
    }[billingCycle?.toLowerCase()] || 1
  );
}

// Get trial period days for a plan
export function getTrialPeriodDays(plan) {
  const normalizedPlan = plan?.toLowerCase();
  return PLAN_DETAILS[normalizedPlan]?.trialDays || 0;
}

// Validate if plan exists
export function validatePlan(plan) {
  return Object.values(PLANS).includes(plan?.toLowerCase());
}

// Calculate next billing date
export function calculateNextBillingDate(currentDate, billingCycle) {
  const date = new Date(currentDate);
  const monthsToAdd = getBillingCycleMonths(billingCycle);
  return new Date(date.setMonth(date.getMonth() + monthsToAdd));
}
