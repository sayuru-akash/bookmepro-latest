// app/api/check-status/route.js
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import connectToDatabase from '../../../Lib/mongodb';
import { authOptions } from '../../../Lib/auth/nextauth-options';

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ email: session.user.email });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ isActive: user.isActive });
}