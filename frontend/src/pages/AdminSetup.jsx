import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, KeyRound } from 'lucide-react';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AuthShell, Field } from './Register';

export default function AdminSetup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', setupKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.bootstrapAdmin(form);
      login(res.data.token, res.data.user);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create admin account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create the first admin"
      subtitle="One-time setup. This only works if no admin account exists yet — after that, promote other admins from the dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field icon={<ShieldCheck size={16} />} label="Full name" value={form.name} onChange={update('name')} required placeholder="Site Administrator" />
        <Field icon={<ShieldCheck size={16} />} label="Email" type="email" value={form.email} onChange={update('email')} required placeholder="admin@example.com" />
        <Field icon={<ShieldCheck size={16} />} label="Password" type="password" value={form.password} onChange={update('password')} required minLength={6} placeholder="At least 6 characters" />
        <Field icon={<KeyRound size={16} />} label="Setup Key" type="password" value={form.setupKey} onChange={update('setupKey')} required placeholder="From ADMIN_SETUP_KEY in backend .env" />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Creating admin…' : 'Create Admin Account'}
        </button>
      </form>
    </AuthShell>
  );
}