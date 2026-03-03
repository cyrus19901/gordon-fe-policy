// Shared singleton OTP store — both request-otp and verify-otp must import from here
// so they reference the same Map instance within the same server process.
const otpStore = new Map<string, { otp: string; expires: number }>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (value.expires < now) {
      otpStore.delete(key);
    }
  }
}, 60_000);

export default otpStore;
