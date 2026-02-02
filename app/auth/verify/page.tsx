'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function VerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const otpString = otp.join('');

    if (!email) {
      alert('Email not found. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      // In development mode, we can bypass OTP by sending empty or any OTP
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otpString || '000000', // Allow empty OTP in dev mode
        }),
        credentials: 'include', // Important: include cookies
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Wait a moment for session cookie to be set
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to home page
        router.push('/');
      } else {
        alert(data.error || 'Verification failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Email not found</p>
            <Button asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-serif text-2xl font-medium text-foreground mb-2">
              Check your email
            </h1>
            <p className="text-muted-foreground">
              We've sent a verification code to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {/* OTP Form */}
          <Card className="shadow-subtle border-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium text-foreground">
                    Enter verification code
                  </label>
                  <div className="flex space-x-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        className="w-12 h-12 text-center text-lg font-medium"
                        required
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </form>

              {/* Resend */}
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code?{' '}
                  {timeLeft > 0 ? (
                    <span className="text-muted-foreground">
                      Resend in {timeLeft}s
                    </span>
                  ) : (
                    <button
                      onClick={() => setTimeLeft(30)}
                      className="text-primary hover:underline font-medium"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
