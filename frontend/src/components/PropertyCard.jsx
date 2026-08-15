import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, BedDouble, Bath, Ruler, MapPin, BadgeCheck, ImageOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/services';
import { getImageUrl } from '../utils/media';

function formatPrice(price) {
  const n = Number(price);
  if (!n) return 'Price on request';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')} Lakh`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PropertyCard({ property, onShortlistChange }) {
  const { user } = useAuth();
  const [imgIndex, setImgIndex] = useState(0);
  const [saved, setSaved] = useState(!!property.shortlisted_at);
  const [saving, setSaving] = useState(false);

  const images = property.images?.length
    ? property.images.map((i) => getImageUrl(i.image_url))
    : property.primary_image
    ? [getImageUrl(property.primary_image)]
    : [];

  function nextImg(e) {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % images.length);
  }
  function prevImg(e) {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  }

  async function toggleShortlist(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setSaving(true);
    try {
      if (saved) {
        await userApi.removeShortlist(property.id);
      } else {
        await userApi.addShortlist(property.id);
      }
      setSaved((s) => !s);
      onShortlistChange?.(property.id, !saved);
    } finally {
      setSaving(false);
    }
  }

  const bhkLabel = property.property_type_name || (property.bedrooms ? `${property.bedrooms} BHK` : 'Property');

  return (
    <Link
      to={`/property/${property.id}`}
      className="group block overflow-hidden rounded-xl2 border border-line bg-surface shadow-card transition hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas">
        {images.length > 0 ? (
          <img
            src={images[imgIndex]}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
            <ImageOff size={28} />
            <span className="text-xs">No image</span>
          </div>
        )}

        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 opacity-0 shadow transition group-hover:opacity-100">
              <ChevronLeft size={16} />
            </button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 opacity-0 shadow transition group-hover:opacity-100">
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.map((_, idx) => (
                <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {property.is_featured && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[11px] font-semibold text-navy shadow">
            ★ Featured
          </span>
        )}

        <button
          onClick={toggleShortlist}
          disabled={saving}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow hover:bg-white"
          aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
        >
          <Heart size={16} className={saved ? 'fill-coral text-coral' : 'text-navy'} />
        </button>

        <span className="absolute bottom-2 right-2 rounded-md bg-navy/85 px-2 py-0.5 text-[11px] font-medium capitalize text-white">
          For {property.listing_type}
        </span>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display text-lg font-700 text-ink">
            {formatPrice(property.price)}
          </p>
          {property.status === 'approved' && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-teal">
              <BadgeCheck size={13} /> Verified
            </span>
          )}
        </div>

        <p className="mt-1 line-clamp-2 text-sm font-medium text-ink/90">
          {bhkLabel}{property.area_sqft ? ` · ${property.area_sqft} sqft` : ''} for {property.listing_type} — {property.title}
        </p>

        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <MapPin size={12} />
          {[property.locality, property.city].filter(Boolean).join(', ') || 'Location not specified'}
        </p>

        <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
          {property.bedrooms && (
            <span className="flex items-center gap-1"><BedDouble size={14} /> {property.bedrooms} Beds</span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1"><Bath size={14} /> {property.bathrooms} Baths</span>
          )}
          {property.area_sqft && (
            <span className="flex items-center gap-1"><Ruler size={14} /> {property.area_sqft} sqft</span>
          )}
        </div>
      </div>
    </Link>
  );
}