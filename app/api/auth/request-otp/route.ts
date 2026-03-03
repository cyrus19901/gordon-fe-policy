import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import sgMail from '@sendgrid/mail';

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

    // Dev bypass: skip OTP entirely, create session immediately
    if (BYPASS_OTP) {
      const namePart = normalizedEmail.split('@')[0];
      const userName = namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ');

      let user;
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, name: userName, role: 'admin' }),
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

      return NextResponse.json({ success: true, email: normalizedEmail, userId: user.id, skipOtp: true });
    }

    // Production flow: ask backend to generate + store OTP
    const otpRes = await fetch(`${BACKEND_URL}/api/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    if (!otpRes.ok) {
      const err = await otpRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.error || 'Failed to generate verification code' }, { status: 500 });
    }

    const { otp } = await otpRes.json();

    // Backend logs the OTP; frontend emails it
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const templateId = process.env.SENDGRID_TEMPLATE_ID;

    if (!sendgridKey || !fromEmail) {
      console.error('SendGrid not configured');
      return NextResponse.json({ error: 'Email service not configured. Contact support.' }, { status: 500 });
    }

    sgMail.setApiKey(sendgridKey);

    // Get the OTP from DB via backend — backend returns it only in dev logs; 
    // we need it to send email. Re-fetch from backend verify endpoint would break flow,
    // so backend /api/auth/request-otp should return the otp when called server-side.
    // The otp is returned above from the backend response.
    if (otp) {
      try {
        if (templateId) {
          await sgMail.send({
            to: normalizedEmail,
            from: { email: fromEmail, name: 'Gordon' },
            subject: 'Your Gordon verification code',
            templateId,
            dynamicTemplateData: { twilio_code: otp, twilio_message: normalizedEmail },
          } as any);
        } else {
          await sgMail.send({
            to: normalizedEmail,
            from: { email: fromEmail, name: 'Gordon' },
            subject: 'Your Gordon verification code',
            text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Your verification code</h2>
                <p>Use the code below to sign in to Gordon. It expires in 10 minutes.</p>
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 24px; background: #f5f5f5; border-radius: 8px; text-align: center; margin: 24px 0;">
                  ${otp}
                </div>
                <p style="font-size: 12px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `,
          });
        }
        console.log(`[OTP] Email sent to ${normalizedEmail}`);
      } catch (sgError: any) {
        const sgBody = sgError?.response?.body;
        const sgMessage = sgBody?.errors?.[0]?.message || sgError?.message || 'Unknown SendGrid error';
        console.error(`[OTP] SendGrid failed for ${normalizedEmail}:`, JSON.stringify(sgBody ?? sgError));
        return NextResponse.json(
          { error: `Email delivery failed: ${sgMessage}. Check SENDGRID_API_KEY and sender verification.` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail,
      skipOtp: false,
    });
  } catch (error: any) {
    const detail = error?.response?.body?.errors?.[0]?.message || error?.message || 'Unknown error';
    console.error('Request OTP error:', detail, error?.response?.body ?? error);
    return NextResponse.json({ error: `Failed to send verification code: ${detail}` }, { status: 500 });
  }
}
