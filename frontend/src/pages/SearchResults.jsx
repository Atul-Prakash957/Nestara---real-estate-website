import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import PropertyCard from '../components/PropertyCard';
import { propertyApi } from '../api/services';

const BEDROOM_OPTIONS = [1, 2, 3, 4, 5];
const FURNISHING_OPTIONS = ['unfurnished', 'semi-furnished', 'furnished'];
const SHARING_OPTIONS = ['single', 'double', 'triple'];
const GENDER_OPTIONS = ['boys', 'girls', 'co-ed'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'area', label: 'Area: Largest first' },
];

export default function SearchResults() {
  const [params, setParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const listingType = params.get('listing_type') || '';
  const bedrooms = params.get('bedrooms') || '';
  const furnishing = params.get('furnishing') || '';
  const isPg = params.get('pg') === 'true';
  const sharingType = params.get('sharing_type') || '';
  const genderPreference = params.get('gender_preference') || '';
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';
  const sort = params.get('sort') || 'newest';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);

  // Local, uncommitted values for the budget inputs — typing here doesn't
  // touch the URL/API on every keystroke. They only sync into the real
  // filter (and trigger a search) after the user pauses for a moment, which
  // stops the constant reload → results-height-change → footer "flash".
  const [minPriceInput, setMinPriceInput] = useState(minPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);

  useEffect(() => {
    setMinPriceInput(minPrice);
    setMaxPriceInput(maxPrice);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPriceInput !== minPrice) updateParam('min_price', minPriceInput);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPriceInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (maxPriceInput !== maxPrice) updateParam('max_price', maxPriceInput);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPriceInput]);

  useEffect(() => {
    propertyApi.propertyTypes().then((res) => setPropertyTypes(res.data.types || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = Object.fromEntries(params.entries());
    propertyApi
      .list({ ...query, limit: 12, page })
      .then((res) => {
        setProperties(res.data.properties || []);
        setTotal(res.data.total || 0);
      })
      .finally(() => setLoading(false));
  }, [params]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value === '' || value === null) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  }

  function clearFilters() {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (listingType) next.set('listing_type', listingType);
    if (isPg) next.set('pg', 'true');
    setParams(next);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-700 text-ink sm:text-2xl">
            {q ? `Results for "${q}"` : isPg ? 'PG / Hostel' : listingType === 'rent' ? 'Properties for Rent' : 'Properties for Sale'}
          </h1>
          <p className="text-sm text-muted">{loading ? 'Searching…' : `${total} properties found`}</p>
        </div>
        <button onClick={() => setFiltersOpen((o) => !o)} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium lg:hidden">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters sidebar */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} rounded-xl2 border border-line bg-surface p-4 lg:block lg:h-fit lg:sticky lg:top-20`}>
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="font-semibold">Filters</p>
            <button onClick={() => setFiltersOpen(false)}><X size={18} /></button>
          </div>

          <FilterGroup label="Listing Type">
            {['buy', 'rent'].map((lt) => (
              <Chip key={lt} active={listingType === lt} onClick={() => updateParam('listing_type', listingType === lt ? '' : lt)}>
                {lt === 'buy' ? 'Buy' : 'Rent'}
              </Chip>
            ))}
          </FilterGroup>

          {!isPg && (
            <FilterGroup label="Property Type">
              <select
                value={params.get('property_type_id') || ''}
                onChange={(e) => updateParam('property_type_id', e.target.value)}
                className="w-full rounded-lg border border-line px-3 py-2 text-sm"
              >
                <option value="">Any type</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FilterGroup>
          )}

          {isPg ? (
            <>
              <FilterGroup label="Sharing Type">
                {SHARING_OPTIONS.map((s) => (
                  <Chip key={s} active={sharingType === s} onClick={() => updateParam('sharing_type', sharingType === s ? '' : s)}>
                    {s} sharing
                  </Chip>
                ))}
              </FilterGroup>
              <FilterGroup label="Preference">
                {GENDER_OPTIONS.map((g) => (
                  <Chip key={g} active={genderPreference === g} onClick={() => updateParam('gender_preference', genderPreference === g ? '' : g)}>
                    {g}
                  </Chip>
                ))}
              </FilterGroup>
            </>
          ) : (
            <FilterGroup label="Bedrooms">
              {BEDROOM_OPTIONS.map((b) => (
                <Chip key={b} active={bedrooms === String(b)} onClick={() => updateParam('bedrooms', bedrooms === String(b) ? '' : b)}>
                  {b} BHK
                </Chip>
              ))}
            </FilterGroup>
          )}

          <FilterGroup label="Budget (₹)">
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value)} className="w-1/2 rounded-lg border border-line px-2 py-1.5 text-sm" />
              <input type="number" placeholder="Max" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} className="w-1/2 rounded-lg border border-line px-2 py-1.5 text-sm" />
            </div>
          </FilterGroup>

          <FilterGroup label="Furnishing">
            {FURNISHING_OPTIONS.map((f) => (
              <Chip key={f} active={furnishing === f} onClick={() => updateParam('furnishing', furnishing === f ? '' : f)}>
                {f.replace('-', ' ')}
              </Chip>
            ))}
          </FilterGroup>

          <button onClick={clearFilters} className="mt-2 w-full rounded-lg border border-line py-2 text-sm font-medium text-muted hover:bg-canvas">
            Clear all filters
          </button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 flex justify-end">
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* min-h keeps this area from collapsing/growing abruptly between
              loading and loaded states, which is what was making the footer
              appear to "flash" as the page height jumped on every filter change. */}
          <div className="min-h-[600px]">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-xl2 bg-line/60" />)}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-line p-10 text-center text-muted">
                No properties match these filters. Try widening your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </div>

          {total > 12 && (
            <div className="mt-8 flex justify-center gap-2">
              <button disabled={page <= 1} onClick={() => updateParam('page', page - 1)} className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-40">Previous</button>
              <span className="px-3 py-2 text-sm text-muted">Page {page}</span>
              <button disabled={page * 12 >= total} onClick={() => updateParam('page', page + 1)} className="rounded-lg border border-line px-4 py-2 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
        active ? 'border-coral bg-coral-light text-coral-dark' : 'border-line text-muted hover:border-coral'
      }`}
    >
      {children}
    </button>
  );
}