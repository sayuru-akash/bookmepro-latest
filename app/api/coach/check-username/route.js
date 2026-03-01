import { NextResponse } from 'next/server';
import connectToDatabase from "../../../../Lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../Lib/auth/nextauth-options";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  
  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' }, 
      { status: 400 }
    );
  }

  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(authOptions);

    // Check database if username exists
    const existingUser = await db
      .collection("users")
      .findOne({ username });

    // If username exists but belongs to the current user, it's available
    const isCurrentUser = session?.user?.email && existingUser?.email === session.user.email;
    const isAvailable = !existingUser || isCurrentUser;

    return NextResponse.json({ 
      available: isAvailable,
      suggestedUsername: !isAvailable 
        ? `${username}${Math.floor(10 + Math.random() * 90)}` 
        : username 
    });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Username check failed' }, 
      { status: 500 }
    );
  }
}