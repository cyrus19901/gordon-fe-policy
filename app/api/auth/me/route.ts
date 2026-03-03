import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { email, userId } = session;

    if (!email) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch full user record from backend to get name + role
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/dashboard?user_email=${encodeURIComponent(email)}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        return NextResponse.json({
          id: user?.id || userId,
          email: user?.email || email,
          name: user?.name || email.split('@')[0],
        });
      }
    } catch {
      // fall through to session-only response
    }

    return NextResponse.json({
      id: userId,
      email,
      name: email.split('@')[0],
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
