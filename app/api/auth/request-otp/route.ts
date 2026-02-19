import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

// Simple in-memory store for OTPs (in production, use a database)
const otpStore = new Map<string, { otp: string; expires: number; email: string }>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expires < now) {
      otpStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Development mode: bypass OTP verification
const BYPASS_OTP = process.env.BYPASS_OTP === 'true' || process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // If bypassing OTP, create user in database and session
    if (BYPASS_OTP) {
      // Create or get user from backend database
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      // Derive name from email
      const namePart = normalizedEmail.split('@')[0];
      const userName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ');
      
      let user;
      try {
        const userResponse = await fetch(`${backendUrl}/api/auth/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: userName,
            role: 'admin', // Policy manager users get admin role
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
        message: 'Logged in successfully (OTP bypassed in development)',
        email: normalizedEmail,
        userId: user.id,
        skipOtp: true, // Signal to frontend to skip verify page
      });
    }
    
    // Normal flow: Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(normalizedEmail, { otp, expires, email: normalizedEmail });

    // In production, send email here
    // For now, we'll log it (remove in production!)
    console.log(`[OTP for ${normalizedEmail}]: ${otp} (expires in 10 minutes)`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail,
      skipOtp: false,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
