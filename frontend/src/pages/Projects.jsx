import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Calendar, Loader2 } from 'lucide-react';
import { propertyApi } from '../api/services';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    propertyApi.featuredProjects().then((res) => setProjects(res.data.projects || [])).finally(() => setLoading(false));
  }, []);

  const cities = [...new Set(projects.map((p) => p.city).filter(Boolean))];
  const visible = cityFilter ? projects.filter((p) => p.city === cityFilter) : projects;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-800 text-ink">New Projects</h1>
        <p className="mt-2 text-sm text-muted">Upcoming and ready-to-move projects from trusted builders, hand-picked by our team.</p>
      </div>

      {cities.length > 1 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCityFilter('')}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${!cityFilter ? 'border-coral bg-coral-light text-coral-dark' : 'border-line text-muted hover:border-coral'}`}
          >
            All Cities
          </button>
          {cities.map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${cityFilter === c ? 'border-coral bg-coral-light text-coral-dark' : 'border-line text-muted hover:border-coral'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {loading ? (
          <div className="py-16 text-center text-muted"><Loader2 className="mx-auto mb-2 animate-spin" /> Loading projects…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-line p-12 text-center text-muted">
            No featured projects yet. Check back soon, or browse individual listings via Search instead.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((proj) => (
              <div key={proj.id} className="overflow-hidden rounded-xl2 border border-line bg-surface shadow-card transition hover:shadow-card-hover">
                <div className="h-48 w-full bg-gradient-to-br from-navy to-navy-light">
                  {proj.banner_image && <img src={proj.banner_image} alt={proj.name} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="p-5">
                  <p className="font-display text-lg font-700 text-ink">{proj.name}</p>
                  {proj.builder_name && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Building2 size={13} /> {proj.builder_name}</p>
                  )}
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={13} /> {[proj.locality, proj.city].filter(Boolean).join(', ') || 'Location coming soon'}
                  </p>
                  {proj.possession_date && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><Calendar size={13} /> Possession: {proj.possession_date}</p>
                  )}
                  {proj.price_range && (
                    <p className="mt-3 font-display text-base font-700 text-coral">{proj.price_range}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}