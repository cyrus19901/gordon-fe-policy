import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import sgMail from '@sendgrid/mail';
import otpStore from '@/lib/otp-store';

const BYPASS_OTP = process.env.BYPASS_OTP === 'true';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Dev bypass: skip OTP, create session immediately
    if (BYPASS_OTP) {
      const namePart = normalizedEmail.split('@')[0];
      const userName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ');

      let user;
      try {
        const userResponse = await fetch(`${BACKEND_URL}/api/auth/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, name: userName, role: 'admin' }),
        });
        user = userResponse.ok ? (await userResponse.json()).user : null;
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
        message: 'Logged in (OTP bypassed)',
        email: normalizedEmail,
        userId: user.id,
        skipOtp: true,
      });
    }

    // Production flow: generate OTP and email it
    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(normalizedEmail, { otp, expires: Date.now() + 10 * 60 * 1000 });

    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!sendgridKey || !fromEmail) {
      console.error('SendGrid not configured. SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing.');
      return NextResponse.json(
        { error: 'Email service not configured. Contact support.' },
        { status: 500 }
      );
    }

    sgMail.setApiKey(sendgridKey);

    await sgMail.send({
      to: normalizedEmail,
      from: fromEmail,
      subject: 'Your Gordon verification code',
      text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Your verification code</h2>
          <p style="font-size: 14px; color: #555;">Use the code below to sign in to Gordon. It expires in 10 minutes.</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 24px; background: #f5f5f5; border-radius: 8px; text-align: center; margin: 24px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail,
      skipOtp: false,
    });
  } catch (error: any) {
    console.error('Request OTP error:', error?.response?.body || error);
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
  }
}
