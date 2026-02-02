import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Simple in-memory store for OTPs (in production, use a database)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

// Development mode: bypass OTP verification
const BYPASS_OTP = process.env.BYPASS_OTP === 'true' || process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email must be a string' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If bypassing OTP, create user in database and session
    if (BYPASS_OTP) {
      // Create or get user from backend database
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      let user;
      try {
        const userResponse = await fetch(`${backendUrl}/api/auth/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          user = userData.user;
        } else {
          // Fallback: generate userId locally if backend fails
          user = {
            id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
            email: normalizedEmail,
          };
        }
      } catch (error) {
        // Fallback: generate userId locally if backend is unavailable
        console.error('Failed to create user in backend:', error);
        user = {
          id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
          email: normalizedEmail,
        };
      }

      const sessionData = {
        email: normalizedEmail,
        userId: user.id, // Use database user ID
        createdAt: Date.now(),
      };

      // Set session cookie
      const cookieStore = await cookies();
      cookieStore.set('session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      return NextResponse.json({
        success: true,
        user: {
          email: normalizedEmail,
          id: user.id,
          isNewUser: false,
        },
        message: 'Verification successful (OTP bypassed in development)',
      });
    }

    // Normal OTP verification flow
    if (!otp) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    if (typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'Verification code must be a string' },
        { status: 400 }
      );
    }

    const trimmedOtp = otp.trim();

    // Validate OTP format
    if (!/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json(
        { error: 'Verification code must be 6 digits' },
        { status: 400 }
      );
    }

    // Check OTP
    const stored = otpStore.get(normalizedEmail);

    if (!stored) {
      return NextResponse.json(
        { error: 'No verification code found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (stored.expires < Date.now()) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (stored.otp !== trimmedOtp) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // OTP is valid - create user in database and session
    // Call backend to create/get user
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    let user;
    try {
      // Create or get user from backend database
      const userResponse = await fetch(`${backendUrl}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        user = userData.user;
      } else {
        // Fallback: generate userId locally if backend fails
        user = {
          id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
          email: normalizedEmail,
        };
      }
    } catch (error) {
      // Fallback: generate userId locally if backend is unavailable
      console.error('Failed to create user in backend:', error);
      user = {
        id: crypto.createHash('sha256').update(normalizedEmail).digest('hex').substring(0, 16),
        email: normalizedEmail,
      };
    }

    // Create session with database user ID
    const sessionData = {
      email: normalizedEmail,
      userId: user.id, // Use database user ID
      createdAt: Date.now(),
    };

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Remove used OTP
    otpStore.delete(normalizedEmail);

    return NextResponse.json({
      success: true,
      user: {
        email: normalizedEmail,
        id: user.id,
        isNewUser: false,
      },
      message: 'Verification successful',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
