import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

const SUPPORT_EMAIL = 'support@nestara.demo';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // No backend endpoint for contact messages yet — this opens the user's
    // default email client pre-filled, which is a reasonable stand-in until
    // a real /api/contact endpoint + inbox is wired up.
    const subject = encodeURIComponent(`Message from ${form.name || 'Nestara visitor'}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-800 text-ink">Get in Touch</h1>
        <p className="mt-2 text-sm text-muted">Questions, feedback, or need help with a listing? We'd like to hear from you.</p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <ContactRow icon={<Mail size={18} />} label="Email" value={SUPPORT_EMAIL} />
          <ContactRow icon={<Phone size={18} />} label="Phone" value="+91 98765 43210" />
          <ContactRow icon={<MapPin size={18} />} label="Office" value="Bengaluru, Karnataka, India" />

          <div className="rounded-xl2 border border-line bg-surface p-5 shadow-card">
            <p className="text-sm font-semibold text-ink">Support hours</p>
            <p className="mt-1 text-sm text-muted">Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
          </div>
        </div>

        <div className="rounded-xl2 border border-line bg-surface p-6 shadow-card">
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <CheckCircle2 size={40} className="text-teal" />
              <p className="font-display text-lg font-700 text-ink">Your email client should have opened</p>
              <p className="text-sm text-muted">If it didn't, just email us directly at {SUPPORT_EMAIL}.</p>
              <button onClick={() => setSent(false)} className="mt-2 text-sm font-semibold text-coral">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Your name" value={form.name} onChange={update('name')} required placeholder="Aditi Sharma" />
              <Field label="Email" type="email" value={form.email} onChange={update('email')} required placeholder="you@example.com" />
              <div>
                <span className="mb-1.5 block text-xs font-medium text-ink">Message</span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={update('message')}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-coral"
                />
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
                <Send size={16} /> Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-line bg-surface p-4 shadow-card">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-teal-light text-teal-dark">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink">{label}</span>
      <input {...props} onChange={(e) => props.onChange(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-coral" />
    </label>
  );
}