import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const BYPASS_OTP = process.env.BYPASS_OTP === 'true';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function ensureBackendUser(email: string) {
  const namePart = email.split('@')[0] || 'User';
  const userName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ');

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: userName }),
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Dev bypass: create session immediately without OTP check
    if (BYPASS_OTP) {
      let user;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        user = res.ok ? (await res.json()).user : null;
      } catch {
        user = null;
      }

      if (!user) {
        user = {
          id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
          email: normalizedEmail,
        };
      }

      const cookieStore = await cookies();
      cookieStore.set('session', JSON.stringify({ email: normalizedEmail, userId: user.id, createdAt: Date.now() }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: { email: normalizedEmail, id: user.id, isNewUser: false },
        message: 'Verification successful (OTP bypassed)',
      });
    }

    // Normal flow: validate inputs
    if (!otp || typeof otp !== 'string') {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const trimmedOtp = otp.trim();
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json({ error: 'Verification code must be 6 digits' }, { status: 400 });
    }

    // Ask backend to verify OTP against DB
    const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, otp: trimmedOtp }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      return NextResponse.json({ error: verifyData.error || 'Invalid verification code' }, { status: 400 });
    }

    // Ensure first login always has a backend user record + wallet bootstrap.
    const verifiedUser = verifyData.user;
    const provisionedUser = await ensureBackendUser(normalizedEmail);
    const user = provisionedUser || verifiedUser || {
      id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
      email: normalizedEmail,
    };

    // Create session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify({ email: normalizedEmail, userId: user.id, createdAt: Date.now() }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { email: normalizedEmail, id: user.id, isNewUser: false },
      message: 'Verification successful',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
