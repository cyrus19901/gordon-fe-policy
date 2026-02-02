import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Generate a user-specific JWT token for ChatGPT authentication
 * This endpoint reads the user's session and requests a token from the backend
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session from cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'No session found. Please log in first.' },
        { status: 401 }
      );
    }

    let sessionData: any;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 401 }
      );
    }

    // Call backend to generate JWT token
    // Backend will create user in database if needed
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/auth/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${encodeURIComponent(sessionCookie.value)}`, // Forward session cookie
      },
      body: JSON.stringify({
        session: sessionData,
        email: sessionData.email,
        user_id: sessionData.userId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to generate token' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      userId: data.userId,
      expiresIn: data.expiresIn,
      message: 'Token generated successfully. Use this token in ChatGPT configuration.',
    });
  } catch (error: any) {
    console.error('Generate GPT token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token', details: error.message },
      { status: 500 }
    );
  }
}
