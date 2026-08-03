# Real Estate Backend (PERN Stack)

A 99acres / Housing.com / MagicBricks-style real estate API built with
**PostgreSQL + Express + React + Node**.

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in your real DB + SMTP credentials
```

### Create the database

```bash
createdb real_estate_db
npm run db:init          # runs src/db/schema.sql against your DB
```
(Or manually: `psql -U postgres -d real_estate_db -f src/db/schema.sql`)

### Email OTP setup (Gmail example)
1. Enable 2FA on your Gmail account.
2. Create an "App Password" (Google Account → Security → App Passwords).
3. Put that 16-character password in `SMTP_PASS` in `.env`.
   (Or use Mailtrap/Brevo/SendGrid SMTP for dev — no need for a real inbox.)

### Run

```bash
npm run dev     # nodemon, auto-restarts
# or
npm start
```

Server runs on `http://localhost:5000`.

## 2. Auth Flow (Email OTP)

1. `POST /api/auth/register` → creates unverified user, emails a 6-digit OTP.
2. `POST /api/auth/verify-otp` → `{ email, otp }` → verifies, returns JWT + user.
3. `POST /api/auth/login` → `{ email, password }` → if verified, returns JWT.
   If not verified, resends OTP automatically.
4. `POST /api/auth/resend-otp` → `{ email, purpose }` (`purpose`: register|reset_password)
5. `POST /api/auth/forgot-password` → `{ email }` → sends reset OTP.
6. `POST /api/auth/reset-password` → `{ email, otp, newPassword }`
7. `GET /api/auth/me` → requires `Authorization: Bearer <token>`

## 3. Property Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/properties` | public | Search/filter/paginate (see query params below) |
| GET | `/api/properties/property-types` | public | List of 1BHK/2BHK/Villa/Bungalow/etc |
| GET | `/api/properties/featured-projects` | public | Homepage featured builder projects |
| GET | `/api/properties/:id` | optional | Full details + images (tracks recently-viewed if logged in) |
| POST | `/api/properties` | user | Create listing (multipart/form-data, field `images`, up to 10) |
| PUT | `/api/properties/:id` | owner/admin | Update listing |
| DELETE | `/api/properties/:id` | owner/admin | Delete listing |
| GET | `/api/properties/my-listings` | user | Properties I've posted |

**Search query params** (`GET /api/properties?...`):
`listing_type` (buy|rent), `city`, `locality`, `property_type_id`, `min_price`,
`max_price`, `bedrooms`, `furnishing`, `q` (free text), `page`, `limit`,
`sort` (newest|price_low|price_high|area)

## 4. User Activity

| Method | Endpoint | Description |
|---|---|---|
| POST/DELETE | `/api/properties/:propertyId/shortlist` | Save/remove shortlist |
| GET | `/api/properties/shortlist` | My shortlisted properties |
| GET | `/api/properties/recently-viewed` | Last 20 viewed properties |
| GET | `/api/properties/recent-searches` | Last 10 unique searches |
| POST | `/api/properties/recent-searches` | Log a search (footer "recently searched") |
| POST | `/api/properties/:propertyId/contact` | Send enquiry to owner (buyer contact card) |

## 5. Admin Dashboard

All under `/api/admin/*`, require JWT with `role: 'admin'`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard-stats` | Users/properties/pending/leads + breakdowns by type & city |
| GET | `/properties?status=pending` | Review queue |
| PATCH | `/properties/:id/status` | `{ status: 'approved'|'rejected'|'sold'|'rented' }` |
| PATCH | `/properties/:id/feature` | `{ isFeatured: true }` — show on homepage |
| GET | `/users` | List all users |
| PATCH | `/users/:id/toggle-active` | Ban/unban a user |
| POST | `/featured-projects` | Add a builder project banner |

To create your first admin: register normally via the API, verify the OTP,
then manually run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## 6. Notes on approval workflow

New properties are inserted with `status = 'pending'`. They are only
visible in public search (`GET /api/properties`) once an admin sets
`status = 'approved'`. This matches how 99acres/MagicBricks moderate listings.

## 7. Next steps (frontend)

This backend is designed to pair with a React (Vite) + Tailwind frontend:
- Header with Buy/Rent/Sell tabs, geolocation-based city detection, profile dropdown
- PropertyCard component (image carousel, price, BHK, save icon)
- Home page with hero search + featured projects carousel
- Multi-step "Post Property" form (matches the field list above)
- Admin dashboard UI consuming `/api/admin/*`

Ask me to scaffold the frontend next and I'll wire it directly to these endpoints.
