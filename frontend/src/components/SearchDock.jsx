import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'buy', label: 'Buy' },
  { key: 'rent', label: 'Rent' },
  { key: 'commercial', label: 'Commercial' },
];

const QUICK_TYPES = ['1 BHK', '2 BHK', '3 BHK', 'Villa', 'Bungalow', 'Plot / Land'];

export default function SearchDock() {
  const [tab, setTab] = useState('buy');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('listing_type', tab === 'commercial' ? 'buy' : tab);
    if (query) params.set('q', query);
    if (type) params.set('type', type);

    if (user && query) {
      userApi.saveSearch({ searchQuery: query, filters: { tab, type } }).catch(() => {});
    }
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div className="relative z-10 mx-auto -mb-16 w-full max-w-4xl rounded-xl2 bg-surface p-2 shadow-dock sm:p-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-line px-2 pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-navy text-white' : 'text-muted hover:bg-canvas'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search row */}
      <form onSubmit={handleSearch} className="flex flex-col gap-2 p-2 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line px-3 py-2.5">
          <MapPin size={18} className="shrink-0 text-coral" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locality, city, or project name"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-coral px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-coral-dark"
        >
          <Search size={16} /> Search
        </button>
      </form>

      {/* Quick property-type chips */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-2 pb-1">
        {QUICK_TYPES.map((qt) => (
          <button
            key={qt}
            type="button"
            onClick={() => setType(qt)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              type === qt ? 'border-teal bg-teal-light text-teal-dark' : 'border-line text-muted hover:border-teal'
            }`}
          >
            {qt}
          </button>
        ))}
      </div>
    </div>
  );
}
