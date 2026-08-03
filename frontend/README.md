# Real Estate Frontend (React + Vite + Tailwind)

A 99acres / Housing.com / MagicBricks-style UI, wired to the PERN backend
in `../backend`.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. The Vite dev server proxies `/api` and
`/uploads` to `http://localhost:5000`, so **start the backend first**
(see `../backend/README.md`).

## What's included

- **Design system** — navy/coral/teal palette, Sora + Inter type pairing,
  defined in `tailwind.config.js` and `src/index.css`.
- **Header** (`src/components/Header.jsx`) — sticky nav, Buy/Rent tabs,
  browser-geolocation city detection (via BigDataCloud's free reverse-geocode
  API, no key needed), profile dropdown (My Listings / Shortlisted / Recently
  Viewed / Admin), Post Property CTA.
- **Footer** (`src/components/Footer.jsx`) — Recently Searched / Recently
  Viewed / Shortlisted quick links (pulled live from the API when logged in).
- **Home page** (`src/pages/Home.jsx`) — hero with a floating "search dock"
  (Buy/Rent/Commercial tabs + quick BHK chips), category tiles, featured
  listings grid, featured projects carousel, trust section, CTA banner.
- **PropertyCard** (`src/components/PropertyCard.jsx`) — image carousel,
  price formatting (₹ Lakh/Cr), shortlist heart, featured ribbon, BHK/area/bath
  stats — styled like Housing.com's card.
- **Auth flow** — Register → email OTP (6-digit boxes, auto-advance, resend
  cooldown) → Login → Forgot/Reset password, all wired to the backend's OTP
  endpoints (`src/pages/Register.jsx`, `VerifyOtp.jsx`, `Login.jsx`, `ResetFlow.jsx`).
- **Search results** (`src/pages/SearchResults.jsx`) — sidebar filters
  (listing type, property type, bedrooms, budget, furnishing), sort, pagination.
- **Property details** (`src/pages/PropertyDetails.jsx`) — full gallery,
  specs grid, amenities, sticky contact-owner card with lead form.
- **Post Property** (`src/pages/PostProperty.jsx`) — 4-step form (Basics →
  Location → Details → Photos & Contact) with drag-free multi-image upload,
  submits as `multipart/form-data` to match the backend's multer setup.
- **Profile** (`src/pages/Profile.jsx`) — tabs for My Listings (with status
  badges), Shortlisted, Recently Viewed.
- **Admin Dashboard** (`src/pages/admin/AdminDashboard.jsx`) — stats overview
  (users/properties/pending/leads + breakdowns), property approval queue
  (approve/reject/feature), user management (ban/unban).
- **Route guards** (`src/components/RouteGuards.jsx`) — `RequireAuth` and
  `RequireAdmin` wrap protected routes and redirect to `/login` otherwise.

## Notes

- Auth state lives in `src/context/AuthContext.jsx`, token in `localStorage`,
  attached to every request via the axios interceptor in `src/api/axios.js`.
- All API calls are centralized in `src/api/services.js` — one file to update
  if your backend URL/shape changes.
- Uses `lucide-react` for icons (already in `package.json`).

## Still to build (ideas for next iteration)

- Google Maps / Mapbox embed on property details for exact pin location
- Image lightbox/zoom on the gallery
- Admin: create/edit featured projects from the UI (API already supports it)
- Compare properties side-by-side
- SMS OTP as a fallback for users without easy email access
