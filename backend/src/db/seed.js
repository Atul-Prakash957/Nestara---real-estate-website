/**
 * Seeds the database with realistic sample data: a handful of demo owner
 * accounts and ~50 approved properties spanning every property type, several
 * Indian cities, and both buy/rent listings — so the home page, search, and
 * admin dashboard have something to show immediately.
 *
 * Run with: npm run db:seed
 * Safe to re-run — it clears previously seeded demo data first (identified
 * by the demo owner emails below) before inserting fresh rows.
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/db');

const DEMO_OWNERS = [
  { name: 'Rohan Mehta', email: 'seed.rohan@nestara.demo' },
  { name: 'Priya Nair', email: 'seed.priya@nestara.demo' },
  { name: 'Arjun Kapoor', email: 'seed.arjun@nestara.demo' },
  { name: 'Sneha Reddy', email: 'seed.sneha@nestara.demo' },
  { name: 'Vikram Singh', email: 'seed.vikram@nestara.demo' },
];

const CITIES = [
  { city: 'Mumbai', localities: ['Andheri West', 'Bandra East', 'Powai', 'Malad West', 'Chembur'] },
  { city: 'Bengaluru', localities: ['Whitefield', 'Koramangala', 'HSR Layout', 'Indiranagar', 'Electronic City'] },
  { city: 'Delhi', localities: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Pitampura'] },
  { city: 'Pune', localities: ['Kothrud', 'Baner', 'Hinjewadi', 'Viman Nagar', 'Wakad'] },
  { city: 'Hyderabad', localities: ['Gachibowli', 'Madhapur', 'Kondapur', 'Banjara Hills', 'Kukatpally'] },
  { city: 'Chennai', localities: ['Adyar', 'OMR', 'Velachery', 'Anna Nagar', 'Porur'] },
];

// type name -> [minBedrooms, maxBedrooms, minArea, maxArea, minPriceLakh, maxPriceLakh, category]
const TYPE_PROFILES = {
  '1 RK': { bedrooms: 0, bath: 1, area: [280, 400], price: [18, 32], residential: true },
  '1 BHK': { bedrooms: 1, bath: 1, area: [450, 650], price: [28, 55], residential: true },
  '2 BHK': { bedrooms: 2, bath: 2, area: [750, 1050], price: [45, 95], residential: true },
  '3 BHK': { bedrooms: 3, bath: 3, area: [1100, 1550], price: [75, 165], residential: true },
  '4 BHK': { bedrooms: 4, bath: 4, area: [1700, 2400], price: [140, 320], residential: true },
  '5+ BHK': { bedrooms: 5, bath: 5, area: [2600, 3800], price: [280, 650], residential: true },
  'Apartment': { bedrooms: 2, bath: 2, area: [800, 1300], price: [55, 120], residential: true },
  'Independent House': { bedrooms: 3, bath: 3, area: [1400, 2200], price: [90, 210], residential: true },
  'Villa': { bedrooms: 4, bath: 4, area: [2200, 3600], price: [180, 450], residential: true },
  'Bungalow': { bedrooms: 4, bath: 5, area: [2800, 4500], price: [250, 600], residential: true },
  'Penthouse': { bedrooms: 4, bath: 4, area: [2400, 3200], price: [220, 520], residential: true },
  'Plot / Land': { bedrooms: null, bath: null, area: [1000, 4000], price: [40, 250], residential: true },
  'Office Space': { bedrooms: null, bath: 2, area: [600, 3000], price: [60, 400], residential: false },
  'Shop / Showroom': { bedrooms: null, bath: 1, area: [300, 1200], price: [35, 220], residential: false },
  'Warehouse': { bedrooms: null, bath: 1, area: [3000, 12000], price: [80, 500], residential: false },
};

const AMENITIES_POOL = ['Lift', 'Gym', 'Swimming Pool', 'Power Backup', 'Security', 'Club House', 'Park', 'Parking'];
const FURNISHING = ['unfurnished', 'semi-furnished', 'furnished'];
const FACING = ['east', 'west', 'north', 'south', 'north-east', 'south-west'];
const AGE = ['new', '0-1 yrs', '1-5 yrs', '5-10 yrs', '10+ yrs'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randBool(chance = 0.5) {
  return Math.random() < chance;
}
function sample(arr, n) {
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
}

async function seedOwners() {
  const passwordHash = await bcrypt.hash('Demo@1234', 10);
  const owners = [];

  for (const o of DEMO_OWNERS) {
    const existing = await query('SELECT id, name, email FROM users WHERE email = $1', [o.email]);
    if (existing.rows.length > 0) {
      owners.push(existing.rows[0]);
      continue;
    }
    const inserted = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, is_email_verified)
       VALUES ($1, $2, $3, $4, 'user', TRUE) RETURNING id, name, email`,
      [o.name, o.email, `98${randInt(10000000, 99999999)}`, passwordHash]
    );
    owners.push(inserted.rows[0]);
  }
  return owners;
}

async function clearPreviousSeedData(ownerIds) {
  if (ownerIds.length === 0) return;
  await query(
    `DELETE FROM properties WHERE owner_id = ANY($1::uuid[])`,
    [ownerIds]
  );
}

function buildTitle(typeName, locality, city) {
  const adjectives = ['Spacious', 'Elegant', 'Modern', 'Sunlit', 'Premium', 'Cozy', 'Well-Maintained', 'Luxurious'];
  return `${pick(adjectives)} ${typeName} in ${locality}, ${city}`;
}

function buildDescription(typeName, locality, city, listingType) {
  return `A ${typeName.toLowerCase()} available for ${listingType} in the heart of ${locality}, ${city}. ` +
    `Close to schools, hospitals, and major transit routes, with easy access to shopping and dining. ` +
    `Well-ventilated, thoughtfully laid out, and ready for immediate ${listingType === 'rent' ? 'move-in' : 'possession'}.`;
}

async function seedProperties(owners) {
  const typesResult = await query('SELECT id, name FROM property_types');
  const typeMap = Object.fromEntries(typesResult.rows.map((t) => [t.name, t.id]));

  const typeNames = Object.keys(TYPE_PROFILES);
  const TOTAL = 48;
  let created = 0;
  let featuredCount = 0;
  const FEATURED_TARGET = 7;

  for (let i = 0; i < TOTAL; i++) {
    const typeName = typeNames[i % typeNames.length];
    const profile = TYPE_PROFILES[typeName];
    const typeId = typeMap[typeName];
    if (!typeId) continue;

    const { city, localities } = pick(CITIES);
    const locality = pick(localities);
    const listingType = randBool(0.65) ? 'buy' : 'rent';
    const owner = pick(owners);

    const area = randInt(profile.area[0], profile.area[1]);
    const priceLakh = randInt(profile.price[0], profile.price[1]);
    const price = listingType === 'buy' ? priceLakh * 100000 : Math.round((priceLakh * 100000) / 250); // rough monthly rent estimate
    const monthlyRent = listingType === 'rent' ? price : null;
    const securityDeposit = listingType === 'rent' ? price * 2 : null;

    const isFeatured = featuredCount < FEATURED_TARGET && randBool(0.18);
    if (isFeatured) featuredCount++;

    // resolve/create location
    const locResult = await query(
      `INSERT INTO locations (city, locality) VALUES ($1, $2)
       ON CONFLICT (city, locality) DO UPDATE SET city = EXCLUDED.city RETURNING id`,
      [city, locality]
    );
    const locationId = locResult.rows[0].id;

    const inserted = await query(
      `INSERT INTO properties (
        owner_id, title, description, listing_type, property_type_id, location_id,
        address, price, monthly_rent, security_deposit, area_sqft, bedrooms, bathrooms,
        balconies, floor_number, total_floors, furnishing, facing, age_of_property, parking,
        amenities, is_featured, status, contact_name, contact_phone, contact_email
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'approved',$23,$24,$25
      ) RETURNING id`,
      [
        owner.id,
        buildTitle(typeName, locality, city),
        buildDescription(typeName, locality, city, listingType),
        listingType,
        typeId,
        locationId,
        `${randInt(1, 200)}, ${locality}, ${city}`,
        price,
        monthlyRent,
        securityDeposit,
        area,
        profile.bedrooms,
        profile.bath,
        profile.bedrooms ? randInt(1, 3) : null,
        profile.residential ? randInt(1, 20) : null,
        profile.residential ? randInt(5, 25) : null,
        pick(FURNISHING),
        pick(FACING),
        pick(AGE),
        randInt(0, 2),
        sample(AMENITIES_POOL, randInt(2, 5)),
        isFeatured,
        owner.name,
        `98${randInt(10000000, 99999999)}`,
        owner.email,
      ]
    );

    const propertyId = inserted.rows[0].id;
    const imageCount = randInt(3, 5);
    const seedBase = randInt(1, 5000);
    const imageValues = [];
    for (let j = 0; j < imageCount; j++) {
      const url = `https://picsum.photos/seed/nestara${seedBase}${j}/900/650`;
      imageValues.push(`('${propertyId}', '${url}', ${j === 0}, ${j})`);
    }
    await query(
      `INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES ${imageValues.join(',')}`
    );

    created++;
  }

  return created;
}

async function seedFeaturedProjects() {
  const existing = await query('SELECT COUNT(*) FROM featured_projects');
  if (Number(existing.rows[0].count) > 0) return 0;

  const projects = [
    { name: 'Prestige Lakeside Habitat', builder: 'Prestige Group', city: 'Bengaluru', locality: 'Whitefield', range: '₹85L - 1.4Cr', possession: 'Dec 2027' },
    { name: 'Godrej Emerald', builder: 'Godrej Properties', city: 'Pune', locality: 'Hinjewadi', range: '₹65L - 1.1Cr', possession: 'Jun 2026' },
    { name: 'DLF The Camellias', builder: 'DLF Limited', city: 'Delhi', locality: 'Vasant Kunj', range: '₹4.5Cr - 8Cr', possession: 'Ready to Move' },
    { name: 'Lodha Park', builder: 'Lodha Group', city: 'Mumbai', locality: 'Andheri West', range: '₹1.8Cr - 3.2Cr', possession: 'Mar 2027' },
    { name: 'My Home Bhooja', builder: 'My Home Group', city: 'Hyderabad', locality: 'Gachibowli', range: '₹75L - 1.3Cr', possession: 'Sep 2026' },
    { name: 'Casagrand Utopia', builder: 'Casagrand', city: 'Chennai', locality: 'OMR', range: '₹55L - 95L', possession: 'Ready to Move' },
  ];

  for (const p of projects) {
    const loc = await query(
      `INSERT INTO locations (city, locality) VALUES ($1,$2)
       ON CONFLICT (city, locality) DO UPDATE SET city = EXCLUDED.city RETURNING id`,
      [p.city, p.locality]
    );
    const seed = randInt(1, 5000);
    await query(
      `INSERT INTO featured_projects (name, builder_name, location_id, price_range, banner_image, possession_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
      [p.name, p.builder, loc.rows[0].id, p.range, `https://picsum.photos/seed/project${seed}/700/400`, p.possession]
    );
  }
  return projects.length;
}

async function main() {
  console.log('🌱 Seeding demo owners...');
  const owners = await seedOwners();
  console.log(`   ${owners.length} owner accounts ready (password for all: Demo@1234)`);

  console.log('🧹 Clearing previously seeded properties (if any)...');
  await clearPreviousSeedData(owners.map((o) => o.id));

  console.log('🏠 Seeding properties...');
  const count = await seedProperties(owners);
  console.log(`   ${count} properties created (approved, spread across all types & cities)`);

  console.log('🏗️  Seeding featured projects...');
  const projectCount = await seedFeaturedProjects();
  console.log(`   ${projectCount ? projectCount + ' featured projects created' : 'featured projects already exist, skipped'}`);

  console.log('✅ Done! Refresh your home page to see listings.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});