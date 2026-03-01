import { useState, useEffect, useCallback } from "react";
import { PRICING_PLANS, normalizeCountryCode } from "../config/pricing";

export function useLocationPricing(initialCountryCode = "DEFAULT") {
  // Use the prop as the initial state to prevent flicker
  const [countryCode, setCountryCode] = useState(
    normalizeCountryCode(initialCountryCode),
  );

  // On mount, read the cookie set by the middleware
  useEffect(() => {
    if (typeof document === "undefined") return;
    const match = document.cookie.match(/(^|;)\s*user-country=([^;]+)/);
    if (match) {
      const normalized = normalizeCountryCode(match[2]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountryCode((prev) => (prev !== normalized ? normalized : prev));
    }
  }, []);

  // Note: The isLoading state is now less critical since the initial render is correct.

  const getPricing = useCallback(
    (planName, cycle = "monthly") => {
      const plan = PRICING_PLANS[planName];
      if (!plan) return null;

      const pricing = plan.prices[countryCode] || plan.prices.DEFAULT;
      return {
        ...pricing,
        amount: pricing[cycle],
        cycle,
      };
    },
    [countryCode],
  );

  const getAllPlansWithPricing = useCallback(
    (cycle = "monthly") => {
      const plans = {};
      Object.keys(PRICING_PLANS).forEach((planName) => {
        const pricing = getPricing(planName, cycle);
        plans[planName] = {
          ...PRICING_PLANS[planName],
          currentPricing: pricing,
        };
      });
      return plans;
    },
    [getPricing],
  );

  const formatPrice = useCallback((amount, currency, symbol) => {
    if (currency === "INR") {
      return `${symbol}${amount.toLocaleString("en-IN")}`;
    }
    return `${symbol}${Number(amount).toFixed(2)}`;
  }, []);

  const currentCurrency = getPricing("starter")?.currency || "AUD";
  const currentSymbol = getPricing("starter")?.symbol || "A$";

  return {
    countryCode,
    getPricing,
    getAllPlansWithPricing,
    formatPrice,
    currency: currentCurrency,
    currencySymbol: currentSymbol,
  };
}
