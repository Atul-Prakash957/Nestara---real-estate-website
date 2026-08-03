import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { authApi } from '../api/services';
import { AuthShell, Field } from './Register';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      setTimeout(() => navigate('/verify-otp', { state: { email, purpose: 'reset_password' } }), 800);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we'll send a one-time code.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<Mail size={16} />} label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
        {sent && <p className="rounded-lg bg-teal-light px-3 py-2 text-sm text-teal-dark">OTP sent — redirecting…</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Sending…' : 'Send OTP'}
        </button>
      </form>
    </AuthShell>
  );
}

export function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  }

  if (!email || !otp) {
    return (
      <AuthShell title="Session expired" subtitle="Please restart the password reset process.">
        <button onClick={() => navigate('/forgot-password')} className="w-full rounded-lg bg-coral py-2.5 text-sm font-semibold text-white">
          Start Over
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle={`For ${email}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<Lock size={16} />} label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Saving…' : 'Save New Password'}
        </button>
      </form>
    </AuthShell>
  );
}
