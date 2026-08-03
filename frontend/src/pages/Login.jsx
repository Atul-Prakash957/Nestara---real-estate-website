import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AuthShell, Field } from './Register';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(form);
      login(res.data.token, res.data.user);
      navigate(params.get('redirect') || '/');
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        navigate('/verify-otp', { state: { email: form.email, purpose: 'register' } });
        return;
      }
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your listings and shortlisted properties.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<Mail size={16} />} label="Email" type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" />
        <Field icon={<Lock size={16} />} label="Password" type="password" value={form.password} onChange={update('password')} required placeholder="Your password" />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-coral">Forgot password?</Link>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Logging in…' : 'Log In'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        New here? <Link to="/register" className="font-semibold text-coral">Create an account</Link>
      </p>
    </AuthShell>
  );
}
