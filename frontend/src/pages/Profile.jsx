import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Heart, Clock, Loader2, Eye } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertyApi, userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'listings', label: 'My Listings', icon: Building2 },
  { key: 'shortlist', label: 'Shortlisted', icon: Heart },
  { key: 'viewed', label: 'Recently Viewed', icon: Clock },
];

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-teal-light text-teal-dark',
  rejected: 'bg-red-100 text-red-700',
  sold: 'bg-gray-200 text-gray-700',
  rented: 'bg-gray-200 text-gray-700',
};

export default function Profile() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'listings';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const call = tab === 'listings' ? propertyApi.myListings() : tab === 'shortlist' ? userApi.shortlist() : userApi.recentlyViewed();
    call
      .then((res) => setItems(res.data.properties || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-teal text-lg font-bold uppercase text-white">
          {user?.name?.[0] || 'U'}
        </span>
        <div>
          <h1 className="font-display text-xl font-700 text-ink">{user?.name}</h1>
          <p className="text-sm text-muted">{user?.email}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setParams({ tab: key })}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium ${
              tab === key ? 'border-coral text-coral' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="py-16 text-center text-muted"><Loader2 className="mx-auto mb-2 animate-spin" /> Loading…</div>
        ) : items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : tab === 'listings' ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="relative">
                <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[p.status] || 'bg-gray-100 text-gray-600'}`}>
                  {p.status}
                </span>
                <PropertyCard property={p} />
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted"><Eye size={12} /> {p.views_count || 0} views</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const copy = {
    listings: "You haven't posted any properties yet.",
    shortlist: "You haven't shortlisted any properties yet.",
    viewed: "You haven't viewed any properties yet.",
  };
  return (
    <div className="rounded-xl2 border border-dashed border-line p-12 text-center text-muted">
      {copy[tab]}
    </div>
  );
}
