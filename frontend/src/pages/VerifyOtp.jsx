import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from './Register';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const email = location.state?.email;
  const purpose = location.state?.purpose || 'register';

  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleChange(idx, value) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[idx] = value.slice(-1);
    setOtp(next);
    if (value && idx < 5) inputsRef.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
  }

  async function handleVerify(e) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (purpose === 'reset_password') {
        navigate('/reset-password', { state: { email, otp: code } });
        return;
      }
      const res = await authApi.verifyOtp({ email, otp: code });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await authApi.resendOtp({ email, purpose });
      setCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Verify your email" subtitle={email ? `We sent a 6-digit code to ${email}` : 'Enter the code sent to your email'}>
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 w-11 rounded-lg border border-line text-center text-lg font-semibold outline-none focus:border-coral"
            />
          ))}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
          {loading ? 'Verifying…' : 'Verify & Continue'}
        </button>

        <p className="text-center text-sm text-muted">
          Didn't get the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="font-semibold text-coral disabled:text-muted"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Resending…' : 'Resend OTP'}
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
