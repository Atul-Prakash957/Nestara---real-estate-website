import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2, Home as HomeIcon, Warehouse, LandPlot, Building,
  ShieldCheck, Wallet, Headset, ArrowRight,
} from 'lucide-react';
import SearchDock from '../components/SearchDock';
import PropertyCard from '../components/PropertyCard';
import { propertyApi } from '../api/services';

const CATEGORIES = [
  { label: '1 & 2 BHK', icon: HomeIcon, query: { bedrooms: 2 } },
  { label: 'Apartments', icon: Building2, query: { q: 'apartment' } },
  { label: 'Villas & Bungalows', icon: Building, query: { q: 'villa' } },
  { label: 'Plots & Land', icon: LandPlot, query: { q: 'plot' } },
  { label: 'Commercial', icon: Warehouse, query: { q: 'office' } },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'Verified Listings', body: 'Every property is reviewed by our team before it goes live, so what you see is what exists.' },
  { icon: Wallet, title: 'Zero Brokerage', body: 'Post or browse without paying us a rupee in commission — talk to owners directly.' },
  { icon: Headset, title: 'Local Experts', body: 'Get on-ground insight on neighbourhoods, pricing trends, and paperwork from real advisors.' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyApi
      .list({ sort: 'newest', limit: 8 })
      .then((res) => setFeatured(res.data.properties || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy pb-28 pt-16 sm:pb-32">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-medium tracking-wide text-white/80">
            India's growing property marketplace
          </span>
          <h1 className="mt-5 font-display text-3xl font-800 leading-tight text-white sm:text-5xl">
            Find a home that actually
            <span className="text-coral"> fits your life</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Search verified apartments, villas, and plots for buy or rent —
            no brokerage, no guesswork, just real listings from real owners.
          </p>
        </div>

        <div className="relative px-4">
          <SearchDock />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 pt-24 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map(({ label, icon: Icon, query }) => (
            <Link
              key={label}
              to={`/search?${new URLSearchParams(query).toString()}`}
              className="group flex flex-col items-center gap-2 rounded-xl2 border border-line bg-surface p-4 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-teal-light text-teal-dark transition group-hover:bg-coral-light group-hover:text-coral-dark">
                <Icon size={20} />
              </span>
              <span className="text-xs font-semibold text-ink sm:text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* RECENTLY ADDED PROPERTIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-700 text-ink sm:text-3xl">Recently added</h2>
            <p className="mt-1 text-sm text-muted">Fresh listings our team has verified this week</p>
          </div>
          <Link to="/search?sort=newest" className="hidden items-center gap-1 text-sm font-semibold text-coral hover:text-coral-dark sm:flex">
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* TRUST / WHY US */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl2 border border-line bg-surface p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-display text-lg font-700 text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-5 rounded-xl2 bg-gradient-to-r from-navy to-navy-light px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h3 className="font-display text-2xl font-700 text-white">Have a property to sell or rent?</h3>
            <p className="mt-1 text-sm text-white/70">List it in minutes and reach thousands of buyers — free, always.</p>
          </div>
          <Link
            to="/post-property"
            className="shrink-0 rounded-lg bg-coral px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-coral-dark"
          >
            Post Property — FREE
          </Link>
        </div>
      </section>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl2 border border-line bg-surface">
          <div className="aspect-[4/3] bg-line" />
          <div className="space-y-2 p-3.5">
            <div className="h-4 w-1/2 rounded bg-line" />
            <div className="h-3 w-3/4 rounded bg-line" />
            <div className="h-3 w-1/3 rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl2 border border-dashed border-line bg-surface p-10 text-center">
      <p className="font-medium text-ink">No approved listings yet</p>
      <p className="mt-1 text-sm text-muted">Once an admin approves submitted properties, they'll show up here.</p>
    </div>
  );
}