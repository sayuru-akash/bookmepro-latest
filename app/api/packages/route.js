import { NextResponse } from 'next/server';
import connectToDatabase from '../../../Lib/mongodb';
import Package from '../../../models/packages';
import { PRICING_PLANS, normalizeCountryCode } from '../../config/pricing';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET request to fetch package(s)
export async function GET(request) {
  try {
    // Use the request object directly with NextRequest methods
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan')?.trim();
    const billingCycle = searchParams.get('billingCycle')?.trim();
    const rawCountryCode = searchParams.get('countryCode')?.trim();
    const countryCode = normalizeCountryCode(rawCountryCode);

    if (!billingCycle || !countryCode) {
      return NextResponse.json(
        { message: "Billing cycle and country code are required." },
        { status: 400 }
      );
    }

    let useStaticConfig = false;
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.warn('Database connection failed, using static config:', dbError.message);
      useStaticConfig = true;
    }

    // If plan is provided, fetch one package (with fallback to DEFAULT)
    if (plan) {
      let pkg;
      if (!useStaticConfig) {
        pkg = await Package.findOne({ plan, billingCycle, countryCode }).lean();

        if (!pkg) {
          // Fallback to DEFAULT country if specific country not found
          pkg = await Package.findOne({ plan, billingCycle, countryCode: 'DEFAULT' }).lean();
        }
      }

      if (!pkg) {
        // If still not found, derive price from static config
        const planInfo = PRICING_PLANS[plan];
        if (!planInfo) {
          return NextResponse.json(
            { message: 'Package not found for the specified criteria.' },
            { status: 404 }
          );
        }
        const pricing = planInfo.prices[countryCode] || planInfo.prices.DEFAULT;
        pkg = {
          plan,
          billingCycle,
          countryCode,
          price: pricing[billingCycle],
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      }

      return NextResponse.json(pkg);
    }

    // Else, return all plans for billingCycle and countryCode
    let packages;
    if (!useStaticConfig) {
      packages = await Package.find({ billingCycle, countryCode }).lean();
    }

    if (!packages || packages.length === 0) {
      // Build packages from static config as a fallback
      packages = Object.keys(PRICING_PLANS).map((planName) => {
        const pricing =
          PRICING_PLANS[planName].prices[countryCode] ||
          PRICING_PLANS[planName].prices.DEFAULT;
        return {
          plan: planName,
          billingCycle,
          countryCode,
          price: pricing[billingCycle],
          currency: pricing.currency,
          symbol: pricing.symbol,
        };
      });
    }

    return NextResponse.json(packages);
    
  } catch (error) {
    console.error('Error fetching package:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}