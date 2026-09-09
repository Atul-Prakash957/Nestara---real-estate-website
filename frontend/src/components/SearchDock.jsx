import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { key: 'buy', label: 'Buy' },
  { key: 'rent', label: 'Rent' },
];

const QUICK_TYPES = [
  { label: '1 BHK', params: { bedrooms: 1 } },
  { label: '2 BHK', params: { bedrooms: 2 } },
  { label: '3 BHK', params: { bedrooms: 3 } },
  { label: 'Villa', params: { q: 'villa' } },
  { label: 'Commercial', params: { q: 'office' } },
];

export default function SearchDock() {
  const [tab, setTab] = useState('buy');
  const [query, setQuery] = useState('');
  // Quick type now stores the entire params object
  const [quickType, setQuickType] = useState(null); 
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    const searchQuery = query.trim();
    
    params.set('listing_type', tab);
    if (searchQuery) params.set('q', searchQuery);
    
    // Apply quick type params if selected
    if (quickType) {
      Object.entries(quickType.params).forEach(([k, v]) => params.set(k, v));
    }

    if (user && searchQuery) {
      userApi.saveSearch({ searchQuery, filters: { tab, quickType } }).catch(() => {});
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
            key={qt.label}
            type="button"
            onClick={() => setQuickType(qt)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${
              quickType?.label === qt.label ? 'border-teal bg-teal-light text-teal-dark' : 'border-line text-muted hover:border-teal'
            }`}
          >
            {qt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
