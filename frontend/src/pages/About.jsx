import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Building2, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'Properties Listed', value: '50,000+' },
  { label: 'Cities Covered', value: '25+' },
  { label: 'Verified Owners', value: '12,000+' },
  { label: 'Happy Home Seekers', value: '1,00,000+' },
];

const VALUES = [
  { icon: ShieldCheck, title: 'Verified Listings', body: 'Every property submitted goes through admin review before it goes live, so you never waste time on stale or fake listings.' },
  { icon: Users, title: 'Direct to Owners', body: 'We connect buyers and tenants straight to property owners — no brokerage, no middlemen inflating the price.' },
  { icon: Building2, title: 'Every Property Type', body: 'From 1 RK apartments to bungalows, plots, and commercial spaces — one platform for every kind of search.' },
  { icon: TrendingUp, title: 'Built for Growth', body: "We're a growing platform, adding new cities, features, and tools based directly on what our users ask for." },
];

export default function About() {
  return (
    <div>
      <section className="bg-navy py-16 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="font-display text-3xl font-800 sm:text-4xl">About Nestara</h1>
          <p className="mt-4 text-sm text-white/70 sm:text-base">
            We're building a simpler way to buy, rent, and sell property in India —
            verified listings, zero brokerage, and a platform that puts owners and
            home seekers in direct touch with each other.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl2 border border-line bg-surface p-6 text-center shadow-card">
              <p className="font-display text-2xl font-800 text-coral">{s.value}</p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-center font-display text-2xl font-700 text-ink">What we stand for</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 rounded-xl2 border border-line bg-surface p-6 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-white">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="font-display text-lg font-700 text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="font-display text-2xl font-700 text-ink">Our story</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">
          Nestara started with a simple frustration: property portals were cluttered
          with outdated listings, inflated brokerage fees, and little transparency
          for the people actually searching for a home. We set out to build
          something simpler — a platform where every listing is reviewed before
          it's published, where owners and seekers talk directly, and where
          finding a 1 BHK, a villa, or a commercial space feels the same:
          straightforward and honest.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">
          We're still early, and growing city by city. If there's something
          you'd want to see on the platform, we'd genuinely like to hear it.
        </p>
        <Link to="/contact" className="mt-4 inline-block rounded-lg bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
          Get in touch
        </Link>
      </section>
    </div>
  );
}