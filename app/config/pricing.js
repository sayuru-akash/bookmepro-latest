// /app/config/pricing.js

export const PRICING_PLANS = {
  starter: {
    description: "For 1-25 Students/Clients",
    prices: {
      LK: {
        monthly: 299,
        quarterly: 849,
        yearly: 2999,
        currency: "LKR",
        symbol: "Rs",
      },
      AU: {
        monthly: 10,
        quarterly: 25,
        yearly: 90,
        currency: "AUD",
        symbol: "$",
      },
      US: {
        monthly: 5,
        quarterly: 13,
        yearly: 50,
        currency: "USD",
        symbol: "$",
      },
      DEFAULT: {
        monthly: 10,
        quarterly: 25,
        yearly: 90,
        currency: "AUD",
        symbol: "$",
      },
    },
  },
  growth: {
    description: "For 26-50 Students/Clients",
    prices: {
      LK: {
        monthly: 599,
        quarterly: 1699,
        yearly: 5999,
        currency: "LKR",
        symbol: "Rs",
      },
      AU: {
        monthly: 15,
        quarterly: 40,
        yearly: 120,
        currency: "AUD",
        symbol: "$",
      },
      US: {
        monthly: 7,
        quarterly: 18,
        yearly: 70,
        currency: "USD",
        symbol: "$",
      },
      DEFAULT: {
        monthly: 15,
        quarterly: 40,
        yearly: 120,
        currency: "AUD",
        symbol: "$",
      },
    },
  },
  pro: {
    description: "For 51-100 Students/Clients",
    prices: {
      LK: {
        monthly: 699,
        quarterly: 1999,
        yearly: 6999,
        currency: "LKR",
        symbol: "Rs",
      },
      AU: {
        monthly: 20,
        quarterly: 50,
        yearly: 150,
        currency: "AUD",
        symbol: "$",
      },
      US: {
        monthly: 10,
        quarterly: 28,
        yearly: 100,
        currency: "USD",
        symbol: "$",
      },
      DEFAULT: {
        monthly: 20,
        quarterly: 50,
        yearly: 150,
        currency: "AUD",
        symbol: "$",
      },
    },
  },
  enterprise: {
    description: "For 100+ Students/Clients",
    prices: {
      LK: {
        monthly: 1499,
        quarterly: 4199,
        yearly: 14999,
        currency: "LKR",
        symbol: "Rs",
      },
      AU: {
        monthly: 25,
        quarterly: 60,
        yearly: 200,
        currency: "AUD",
        symbol: "$",
      },
      US: {
        monthly: 15,
        quarterly: 55,
        yearly: 150,
        currency: "USD",
        symbol: "$",
      },
      DEFAULT: {
        monthly: 25,
        quarterly: 60,
        yearly: 200,
        currency: "AUD",
        symbol: "$",
      },
    },
  },
};

export function normalizeCountryCode(code) {
  if (!code) return "DEFAULT";

  const upperCaseCode = code.toUpperCase();

  // Check if the code is a specific key in our pricing (e.g., 'LK', 'AU')
  // We only need to check one plan, as all plans should have the same country keys.
  if (Object.keys(PRICING_PLANS.starter.prices).includes(upperCaseCode)) {
    return upperCaseCode;
  }

  // If it's not EU and not another specific country, fallback to the default
  return "DEFAULT";
}
