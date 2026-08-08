import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, BedDouble, Bath, Ruler, Compass, Building2, Calendar,
  Car, Phone, Mail, Heart, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
} from 'lucide-react';
import { propertyApi, userApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils/media';

function formatPrice(price) {
  const n = Number(price);
  if (!n) return 'Price on request';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.00$/, '')} Lakh`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PropertyDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [property, setProperty] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [leadForm, setLeadForm] = useState({ name: user?.name || '', phone: '', email: user?.email || '', message: 'I am interested in this property, please share more details.' });
  const [leadSent, setLeadSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    propertyApi.getById(id).then((res) => setProperty(res.data.property)).finally(() => setLoading(false));
  }, [id]);

  async function handleLeadSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      await userApi.contactOwner(id, leadForm);
      setLeadSent(true);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted"><Loader2 className="mx-auto mb-2 animate-spin" /> Loading property…</div>;
  if (!property) return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted">Property not found.</div>;

  const images = property.images?.length ? property.images.map((i) => getImageUrl(i.image_url)) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
      {/* Gallery */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl2 bg-canvas">
        {images.length > 0 ? (
          <img src={images[imgIndex]} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted">No images uploaded for this property</div>
        )}
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setImgIndex((i) => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 right-3 rounded-md bg-navy/85 px-2.5 py-1 text-xs text-white">
              {imgIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button key={idx} onClick={() => setImgIndex(idx)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${idx === imgIndex ? 'border-coral' : 'border-transparent'}`}>
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Main info */}
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-700 text-ink">{property.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> {[property.address, property.locality, property.city].filter(Boolean).join(', ')}
              </p>
            </div>
            <p className="font-display text-3xl font-800 text-coral">
              {property.price_per_bed ? `${formatPrice(property.price_per_bed)} /bed /mo` : formatPrice(property.price)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl2 border border-line bg-surface p-4 sm:grid-cols-4">
            <Stat icon={<BedDouble size={18} />} label="Bedrooms" value={property.bedrooms || '—'} />
            <Stat icon={<Bath size={18} />} label="Bathrooms" value={property.bathrooms || '—'} />
            <Stat icon={<Ruler size={18} />} label="Area" value={property.area_sqft ? `${property.area_sqft} sqft` : '—'} />
            <Stat icon={<Car size={18} />} label="Parking" value={property.parking ?? '—'} />
          </div>

          <section className="mt-6">
            <h2 className="font-display text-lg font-700 text-ink">About this property</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/80">
              {property.description || 'No description provided.'}
            </p>
          </section>

          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Detail icon={<Building2 size={16} />} label="Type" value={property.property_type_name} />
            <Detail icon={<Compass size={16} />} label="Facing" value={property.facing} />
            <Detail icon={<Calendar size={16} />} label="Age" value={property.age_of_property} />
            <Detail icon={<Building2 size={16} />} label="Furnishing" value={property.furnishing} />
            <Detail icon={<Building2 size={16} />} label="Floor" value={property.floor_number ? `${property.floor_number} of ${property.total_floors || '-'}` : null} />
            <Detail icon={<Building2 size={16} />} label="Sharing" value={property.sharing_type ? `${property.sharing_type} sharing` : null} />
            <Detail icon={<Building2 size={16} />} label="Preference" value={property.gender_preference} />
            <Detail icon={<CheckCircle2 size={16} />} label="Meals" value={property.meals_included ? 'Included' : null} />
          </section>

          {property.amenities?.length > 0 && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-700 text-ink">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 rounded-full bg-teal-light px-3 py-1.5 text-xs font-medium text-teal-dark">
                    <CheckCircle2 size={13} /> {a}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Contact card */}
        <aside className="h-fit rounded-xl2 border border-line bg-surface p-5 shadow-card lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Contact {property.owner_name ? 'Owner' : 'Agent'}</p>
          <p className="mt-1 font-display text-lg font-700 text-ink">{property.contact_name || property.owner_name || 'Property Owner'}</p>

          {user && user.id === property.owner_id ? (
            <div className="mt-4 rounded-lg bg-canvas px-3 py-3 text-sm text-ink/80">
              This is your own listing — enquiries from interested buyers will show up under{' '}
              <Link to="/profile?tab=enquiries" className="font-semibold text-coral hover:underline">
                Profile → Enquiries
              </Link>{' '}
              and get emailed to you.
            </div>
          ) : leadSent ? (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-teal-light px-3 py-3 text-sm text-teal-dark">
              <CheckCircle2 size={18} /> Your enquiry has been sent!
            </div>
          ) : (
            <form onSubmit={handleLeadSubmit} className="mt-4 space-y-3">
              <input required placeholder="Your name" value={leadForm.name} onChange={(e) => setLeadForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
              <input required placeholder="Phone number" value={leadForm.phone} onChange={(e) => setLeadForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
              <input placeholder="Email (optional)" value={leadForm.email} onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
              <textarea rows={3} value={leadForm.message} onChange={(e) => setLeadForm((f) => ({ ...f, message: e.target.value }))} className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
              <button disabled={sending} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral py-2.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Phone size={16} />}
                {sending ? 'Sending…' : 'Contact Owner'}
              </button>
            </form>
          )}

          <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-xs text-muted">
            {property.contact_phone && <p className="flex items-center gap-1.5"><Phone size={13} /> {property.contact_phone}</p>}
            {property.contact_email && <p className="flex items-center gap-1.5"><Mail size={13} /> {property.contact_email}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-coral">{icon}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function Detail({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted">{icon}</span>
      <span className="text-muted">{label}:</span>
      <span className="font-medium capitalize text-ink">{value}</span>
    </div>
  );
}