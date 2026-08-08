import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, UploadCloud, CheckCircle2, X } from 'lucide-react';
import { propertyApi } from '../api/services';

const STEPS = ['Basics', 'Location', 'Details', 'Photos & Contact'];
const AMENITY_OPTIONS = ['Lift', 'Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Club House', 'Park', 'Parking'];

const initialForm = {
  title: '', description: '', listing_type: 'buy', property_type_id: '',
  price: '', monthly_rent: '', security_deposit: '',
  city: '', locality: '', address: '',
  area_sqft: '', bedrooms: '', bathrooms: '', balconies: '', floor_number: '', total_floors: '',
  furnishing: 'unfurnished', facing: '', age_of_property: '', parking: 0, amenities: [],
  contact_name: '', contact_phone: '', contact_email: '',
  sharing_type: '', gender_preference: '', meals_included: false, price_per_bed: '',
};

export default function PostProperty() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [types, setTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    propertyApi.propertyTypes().then((res) => setTypes(res.data.types || []));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleAmenity(a) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  }

  const isPg = types.find((t) => String(t.id) === String(form.property_type_id))?.name === 'PG / Hostel';

  function handleImageSelect(e) {
    const files = Array.from(e.target.files).slice(0, 10 - images.length);
    setImages((prev) => [...prev, ...files]);
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'amenities') fd.append(k, v.join(','));
        else if (v !== '' && v !== null && v !== undefined) fd.append(k, v);
      });
      images.forEach((img) => fd.append('images', img));

      await propertyApi.create(fd);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit property. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <CheckCircle2 size={48} className="mx-auto text-teal" />
        <h1 className="mt-4 font-display text-2xl font-700 text-ink">Property submitted!</h1>
        <p className="mt-2 text-sm text-muted">Our team will review your listing and it'll go live once approved — usually within a few hours.</p>
        <button onClick={() => navigate('/profile?tab=listings')} className="mt-6 rounded-lg bg-coral px-6 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark">
          View My Listings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-700 text-ink">Post Your Property — Free</h1>
      <p className="mt-1 text-sm text-muted">Fill in the details below. It takes less than 5 minutes.</p>

      {/* Stepper */}
      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= step ? 'bg-coral text-white' : 'bg-line text-muted'}`}>
                {i + 1}
              </span>
              <span className={`text-[11px] ${i === step ? 'font-semibold text-ink' : 'text-muted'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 ${i < step ? 'bg-coral' : 'bg-line'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8 rounded-xl2 border border-line bg-surface p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['buy', 'rent'].map((lt) => (
                <button key={lt} type="button" onClick={() => set('listing_type', lt)} className={`flex-1 rounded-lg border py-2 text-sm font-semibold capitalize ${form.listing_type === lt ? 'border-coral bg-coral-light text-coral-dark' : 'border-line text-muted'}`}>
                  {lt === 'buy' ? 'Sell / Buy' : 'Rent / Lease'}
                </button>
              ))}
            </div>
            <Input label="Property Title" value={form.title} onChange={(v) => set('title', v)} placeholder="Spacious 3BHK apartment in Koramangala" />
            <Select label="Property Type" value={form.property_type_id} onChange={(v) => set('property_type_id', v)} options={types.map((t) => ({ value: t.id, label: t.name }))} placeholder="Select type" />
            <Input label={form.listing_type === 'rent' ? 'Monthly Rent (₹)' : 'Price (₹)'} type="number" value={form.price} onChange={(v) => set('price', v)} placeholder="e.g. 4500000" />
            {form.listing_type === 'rent' && (
              <Input label="Security Deposit (₹)" type="number" value={form.security_deposit} onChange={(v) => set('security_deposit', v)} placeholder="e.g. 100000" />
            )}
            <TextArea label="Description" value={form.description} onChange={(v) => set('description', v)} placeholder="Describe your property — highlights, nearby landmarks, etc." />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="Bengaluru" />
              <Input label="Locality" value={form.locality} onChange={(v) => set('locality', v)} placeholder="Koramangala" />
            </div>
            <Input label="Full Address" value={form.address} onChange={(v) => set('address', v)} placeholder="Street, landmark, pin code" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Input label="Area (sqft)" type="number" value={form.area_sqft} onChange={(v) => set('area_sqft', v)} />
              {!isPg && (
                <>
                  <Input label="Bedrooms" type="number" value={form.bedrooms} onChange={(v) => set('bedrooms', v)} />
                  <Input label="Balconies" type="number" value={form.balconies} onChange={(v) => set('balconies', v)} />
                </>
              )}
              <Input label="Bathrooms" type="number" value={form.bathrooms} onChange={(v) => set('bathrooms', v)} />
              <Input label="Floor No." type="number" value={form.floor_number} onChange={(v) => set('floor_number', v)} />
              <Input label="Total Floors" type="number" value={form.total_floors} onChange={(v) => set('total_floors', v)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Furnishing" value={form.furnishing} onChange={(v) => set('furnishing', v)} options={[
                { value: 'unfurnished', label: 'Unfurnished' },
                { value: 'semi-furnished', label: 'Semi-furnished' },
                { value: 'furnished', label: 'Furnished' },
              ]} />
              <Select label="Facing" value={form.facing} onChange={(v) => set('facing', v)} options={['East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West'].map((f) => ({ value: f.toLowerCase(), label: f }))} placeholder="Select facing" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-ink">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${form.amenities.includes(a) ? 'border-teal bg-teal-light text-teal-dark' : 'border-line text-muted'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {isPg && (
              <div className="rounded-lg border border-teal-light bg-teal-light/40 p-4">
                <p className="mb-3 text-sm font-semibold text-teal-dark">PG / Hostel Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Sharing Type" value={form.sharing_type} onChange={(v) => set('sharing_type', v)} options={[
                    { value: 'single', label: 'Single Sharing' },
                    { value: 'double', label: 'Double Sharing' },
                    { value: 'triple', label: 'Triple Sharing' },
                  ]} placeholder="Select sharing type" />
                  <Select label="Gender Preference" value={form.gender_preference} onChange={(v) => set('gender_preference', v)} options={[
                    { value: 'boys', label: 'Boys Only' },
                    { value: 'girls', label: 'Girls Only' },
                    { value: 'co-ed', label: 'Co-ed' },
                  ]} placeholder="Select preference" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Input label="Price per Bed (₹/month)" type="number" value={form.price_per_bed} onChange={(v) => set('price_per_bed', v)} placeholder="e.g. 8000" />
                  <label className="flex items-center gap-2 pt-6">
                    <input type="checkbox" checked={form.meals_included} onChange={(e) => set('meals_included', e.target.checked)} className="h-4 w-4 rounded border-line" />
                    <span className="text-sm text-ink">Meals included</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-ink">Property Photos (up to 10)</p>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line py-8 text-center text-muted hover:border-coral">
                <UploadCloud size={26} />
                <span className="text-sm">Click to upload images</span>
                <input type="file" accept="image/*" multiple hidden onChange={handleImageSelect} />
              </label>
              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-lg border border-line">
                      <img src={URL.createObjectURL(img)} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact Name" value={form.contact_name} onChange={(v) => set('contact_name', v)} />
              <Input label="Contact Phone" value={form.contact_phone} onChange={(v) => set('contact_phone', v)} />
            </div>
            <Input label="Contact Email" value={form.contact_email} onChange={(v) => set('contact_email', v)} />
          </div>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg border border-line px-5 py-2 text-sm font-medium text-muted disabled:opacity-40"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="rounded-lg bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-light">
              Continue
            </button>
          ) : (
            <button type="button" disabled={submitting} onClick={handleSubmit} className="flex items-center gap-2 rounded-lg bg-coral px-6 py-2 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      <input {...props} onChange={(e) => props.onChange(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-coral" />
    </label>
  );
}

function TextArea({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      <textarea {...props} rows={4} onChange={(e) => props.onChange(e.target.value)} className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-coral" />
    </label>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-coral">
        <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}