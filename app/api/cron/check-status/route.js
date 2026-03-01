// app/api/cron/check-status/route.js

import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../Lib/mongodb';
import { authOptions } from '../../../../Lib/auth/nextauth-options';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
// Alternative: export const runtime = 'nodejs'; // if you need specific runtime

export async function GET(req) {
  try {
    // Get session from the request
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Return the correct paymentStatus field from schema
    const paymentStatus = user.paymentStatus || 'inactive';
    const isAllowed = ['active', 'trialing'].includes(paymentStatus);

    return NextResponse.json({ 
      paymentStatus: paymentStatus,
      isAllowed: isAllowed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in /api/cron/check-status:", error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}