import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, Heart, Clock, Loader2, Eye, Inbox, Phone, Mail, MessageSquare, CheckCircle2, RotateCcw } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertyApi, userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'listings', label: 'My Listings', icon: Building2 },
  { key: 'enquiries', label: 'Enquiries', icon: Inbox },
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

const TAB_CALLS = {
  listings: () => propertyApi.myListings().then((res) => res.data.properties || []),
  enquiries: () => userApi.myLeads().then((res) => res.data.leads || []),
  shortlist: () => userApi.shortlist().then((res) => res.data.properties || []),
  viewed: () => userApi.recentlyViewed().then((res) => res.data.properties || []),
};

export default function Profile() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'listings';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    TAB_CALLS[tab]()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [tab]);

  function handleStatusUpdated(propertyId, newStatus) {
    setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p)));
  }

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

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setParams({ tab: key })}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium ${
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
              <ListingCard key={p.id} property={p} onStatusUpdated={handleStatusUpdated} />
            ))}
          </div>
        ) : tab === 'enquiries' ? (
          <div className="space-y-3">
            {items.map((lead) => (
              <div key={lead.id} className="rounded-xl2 border border-line bg-surface p-4 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{lead.name || 'Anonymous enquiry'}</p>
                    <Link to={`/property/${lead.property_id}`} className="text-xs text-coral hover:underline">
                      {lead.property_title}
                    </Link>
                  </div>
                  <span className="text-xs text-muted">{new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink/80">
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-coral"><Phone size={14} /> {lead.phone}</a>
                  {lead.email && <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-coral"><Mail size={14} /> {lead.email}</a>}
                </div>
                {lead.message && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-canvas p-3 text-sm text-ink/80">
                    <MessageSquare size={14} className="mt-0.5 shrink-0 text-muted" /> {lead.message}
                  </p>
                )}
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

function ListingCard({ property, onStatusUpdated }) {
  const [updating, setUpdating] = useState(false);
  const soldOrRentedLabel = property.listing_type === 'rent' ? 'rented' : 'sold';

  async function markAs(status) {
    setUpdating(true);
    try {
      await propertyApi.updateOwnStatus(property.id, status);
      onStatusUpdated(property.id, status);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="relative">
      <span className={`absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLES[property.status] || 'bg-gray-100 text-gray-600'}`}>
        {property.status}
      </span>
      <PropertyCard property={property} />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs text-muted"><Eye size={12} /> {property.views_count || 0} views</p>

        {property.status === 'approved' && (
          <button
            onClick={() => markAs(soldOrRentedLabel)}
            disabled={updating}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-60"
          >
            {updating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark as {soldOrRentedLabel === 'rented' ? 'Rented' : 'Sold'}
          </button>
        )}

        {(property.status === 'sold' || property.status === 'rented') && (
          <button
            onClick={() => markAs('approved')}
            disabled={updating}
            className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-60"
          >
            {updating ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
            Mark Available Again
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  const copy = {
    listings: "You haven't posted any properties yet.",
    enquiries: "No one has enquired about your listings yet. Enquiries will show up here and get emailed to you as they come in.",
    shortlist: "You haven't shortlisted any properties yet.",
    viewed: "You haven't viewed any properties yet.",
  };
  return (
    <div className="rounded-xl2 border border-dashed border-line p-12 text-center text-muted">
      {copy[tab]}
    </div>
  );
}