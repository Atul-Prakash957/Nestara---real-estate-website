import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { authApi } from '../api/services';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.register(form);
      navigate('/verify-otp', { state: { email: form.email, purpose: 'register' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join to shortlist properties, post listings, and get instant owner contact.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<User size={16} />} label="Full name" value={form.name} onChange={update('name')} required placeholder="Aditi Sharma" />
        <Field icon={<Mail size={16} />} label="Email" type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" />
        <Field icon={<Phone size={16} />} label="Phone (optional)" value={form.phone} onChange={update('phone')} placeholder="98765 43210" />
        <Field icon={<Lock size={16} />} label="Password" type="password" value={form.password} onChange={update('password')} required placeholder="At least 6 characters" minLength={6} />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white transition hover:bg-coral-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Sending OTP…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold text-coral">Log in</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-xl2 border border-line bg-surface p-7 shadow-card">
        <h1 className="font-display text-2xl font-700 text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function Field({ icon, label, type = 'text', ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 focus-within:border-coral">
        <span className="text-muted">{icon}</span>
        <input type={type} className="w-full bg-transparent text-sm outline-none" {...props} />
      </div>
    </label>
  );
}
