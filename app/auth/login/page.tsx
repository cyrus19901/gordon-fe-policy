'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Common TLD typos to catch before submission
const COMMON_TLD_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmail.con': 'gmail.com',
  'yahoo.co': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'outlok.com': 'outlook.com',
  'hotmai.com': 'hotmail.com',
};

function detectEmailTypo(email: string): string | null {
  const lower = email.toLowerCase();
  const domain = lower.split('@')[1];
  if (!domain) return null;
  const fix = COMMON_TLD_TYPOS[domain];
  if (fix) return email.split('@')[0] + '@' + fix;
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const router = useRouter();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setError('');
    setSuggestion(detectEmailTypo(value) ?? '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.skipOtp) {
          await new Promise(resolve => setTimeout(resolve, 300));
          router.push('/');
        } else {
          router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
        }
      } else {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-primary-foreground font-bold text-2xl">G</span>
            </div>
            <h1 className="font-sans text-3xl lg:text-4xl font-medium text-foreground mb-4 tracking-tight">
              Gordon AI
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Sign in to your account
            </p>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-subtle border-border">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={`pl-10 h-11 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        required
                      />
                    </div>
                    {/* Typo suggestion */}
                    {suggestion && !error && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Did you mean{' '}
                        <button
                          type="button"
                          className="font-medium underline underline-offset-2"
                          onClick={() => { setEmail(suggestion); setSuggestion(''); }}
                        >
                          {suggestion}
                        </button>
                        ?
                      </p>
                    )}
                    {/* Error message */}
                    {error && (
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <p>
                      By continuing, you agree to Gordon's{' '}
                      <a href="#" className="text-primary hover:underline">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-primary hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Continue</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">
              Access is by invitation only.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
