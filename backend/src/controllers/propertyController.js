const { query, pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Create a new property listing
const createProperty = asyncHandler(async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start transaction

    const {
      title, description, listing_type, property_type_id, city, locality,
      address, latitude, longitude, price, monthly_rent, security_deposit,
      area_sqft, bedrooms, bathrooms, balconies, floor_number, total_floors,
      furnishing, facing, age_of_property, parking, amenities,
      contact_name, contact_phone, contact_email,
    } = req.body;

    if (!title || !listing_type || !property_type_id || !price) {
      return res.status(400).json({ success: false, message: 'title, listing_type, property_type_id and price are required' });
    }

    // Insert or update location
    let locationId = null;
    if (city && locality) {
      const locResult = await client.query(
        `INSERT INTO locations (city, locality)
         VALUES ($1, $2)
         ON CONFLICT (city, locality) DO UPDATE SET city = EXCLUDED.city
         RETURNING id`,
        [city, locality]
      );
      locationId = locResult.rows[0].id;
    }

    // Parse amenities
    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : (amenities ? String(amenities).split(',').map(a => a.trim()) : []);

    // Insert property
    const inserted = await client.query(
      `INSERT INTO properties (
        owner_id, title, description, listing_type, property_type_id, location_id,
        address, latitude, longitude, price, monthly_rent, security_deposit,
        area_sqft, bedrooms, bathrooms, balconies, floor_number, total_floors,
        furnishing, facing, age_of_property, parking, amenities,
        contact_name, contact_phone, contact_email
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26
      ) RETURNING *`,
      [
        req.user.id, title, description, listing_type, property_type_id, locationId,
        address, latitude || null, longitude || null, price, monthly_rent || null, security_deposit || null,
        area_sqft || null, bedrooms || null, bathrooms || null, balconies || null, floor_number || null, total_floors || null,
        furnishing || null, facing || null, age_of_property || null, parking || 0, amenitiesArray,
        contact_name || null, contact_phone || null, contact_email || null,
      ]
    );

    const property = inserted.rows[0];

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      const rows = [];
      const imgParams = [];
      let n = 1;
      req.files.forEach((file, idx) => {
        rows.push(`($${n++}, $${n++}, $${n++}, $${n++})`);
        imgParams.push(property.id, file.path, idx === 0, idx);
      });

      await client.query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES ${rows.join(',')}`,
        imgParams
      );
    }

    await client.query('COMMIT'); // Save transaction
    return res.status(201).json({ success: true, message: 'Property submitted for approval', property });
  } catch (err) {
    await client.query('ROLLBACK'); // Revert changes on error
    next(err); // Pass error to global handler
  } finally {
    client.release(); // Free database connection
  }
});

// List properties with filters and pagination
const listProperties = asyncHandler(async (req, res) => {
  const {
    listing_type, city, locality, property_type_id, min_price, max_price,
    bedrooms, furnishing, q, page = 1, limit = 12, sort = 'newest',
  } = req.query;

  const conditions = [`p.status = 'approved'`];
  const params = [];
  let i = 1;

  // Build dynamic SQL where clauses based on filters
  if (listing_type) { conditions.push(`p.listing_type = $${i++}`); params.push(listing_type); }
  if (city) { conditions.push(`l.city ILIKE $${i++}`); params.push(`%${city}%`); }
  if (locality) { conditions.push(`l.locality ILIKE $${i++}`); params.push(`%${locality}%`); }
  if (property_type_id) { conditions.push(`p.property_type_id = $${i++}`); params.push(property_type_id); }
  if (min_price) { conditions.push(`p.price >= $${i++}`); params.push(min_price); }
  if (max_price) { conditions.push(`p.price <= $${i++}`); params.push(max_price); }
  if (bedrooms) { conditions.push(`p.bedrooms = $${i++}`); params.push(bedrooms); }
  if (furnishing) { conditions.push(`p.furnishing = $${i++}`); params.push(furnishing); }
  
  // General text search across multiple columns. 
  // ILIKE is used in PostgreSQL for case-insensitive partial matching (like %search_term%).
  if (q) { 
    conditions.push(`(p.title ILIKE $${i} OR p.description ILIKE $${i} OR l.city ILIKE $${i} OR l.locality ILIKE $${i})`);
    params.push(`%${q}%`);
    i++;
  }

  const sortMap = {
    newest: 'p.created_at DESC',
    price_low: 'p.price ASC',
    price_high: 'p.price DESC',
    area: 'p.area_sqft DESC',
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const offset = (Number(page) - 1) * Number(limit);
  const whereClause = conditions.join(' AND ');

  /* 
    BEGINNER SQL EXPLANATION:
    We are grabbing all property details (p.*) and joining other tables to get names instead of just IDs:
    - LEFT JOIN property_types: gets us the actual name of the property type (e.g., 'Villa' instead of ID 5)
    - LEFT JOIN locations: gets us the city and locality strings.
    
    The subqueries (SELECT image_url...) run for each row to fetch just the FIRST primary image and the total image count, 
    avoiding the need for complex GROUP BY clauses if we used standard JOINs for images.
  */
  const dataQuery = `
    SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
      (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1) AS primary_image,
      (SELECT COUNT(*) FROM property_images pi WHERE pi.property_id = p.id) AS image_count
    FROM properties p
    LEFT JOIN property_types pt ON pt.id = p.property_type_id
    LEFT JOIN locations l ON l.id = p.location_id
    WHERE ${whereClause}
    ORDER BY p.is_featured DESC, ${orderBy}
    LIMIT $${i++} OFFSET $${i++}
  `;
  params.push(limit, offset);

  const countQuery = `
    SELECT COUNT(*) FROM properties p
    LEFT JOIN locations l ON l.id = p.location_id
    WHERE ${whereClause}
  `;

  // Execute both queries concurrently
  const [dataResult, countResult] = await Promise.all([
    query(dataQuery, params),
    query(countQuery, params.slice(0, params.length - 2)),
  ]);

  return res.json({
    success: true,
    total: Number(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
    properties: dataResult.rows,
  });
});

// Fetch a single property by its ID
const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const propResult = await query(
    `SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
      u.name AS owner_name, u.phone AS owner_phone
     FROM properties p
     LEFT JOIN property_types pt ON pt.id = p.property_type_id
     LEFT JOIN locations l ON l.id = p.location_id
     LEFT JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [id]
  );

  if (propResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  const imagesResult = await query(
    `SELECT id, image_url, is_primary, display_order FROM property_images
     WHERE property_id = $1 ORDER BY is_primary DESC, display_order ASC`,
    [id]
  );

  // Increment view count in background
  query(`UPDATE properties SET views_count = views_count + 1 WHERE id = $1`, [id]).catch(() => {});

  // Update recently viewed for logged in user in background
  if (req.user) {
    query(
      `INSERT INTO recently_viewed (user_id, property_id) VALUES ($1, $2)
       ON CONFLICT (user_id, property_id) DO UPDATE SET viewed_at = now()`,
      [req.user.id, id]
    ).catch(() => {});
  }

  return res.json({
    success: true,
    property: { ...propResult.rows[0], images: imagesResult.rows },
  });
});

// Update a property
const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const check = await query('SELECT owner_id FROM properties WHERE id = $1', [id]);
  
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

  // Only owner or admin can edit
  if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
  }

  const allowedFields = [
    'title', 'description', 'price', 'monthly_rent', 'area_sqft', 'bedrooms',
    'bathrooms', 'balconies', 'floor_number', 'total_floors', 'furnishing',
    'facing', 'age_of_property', 'parking', 'amenities', 'contact_name',
    'contact_phone', 'contact_email', 'address',
  ];

  const updates = [];
  const params = [];
  let i = 1;
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates.push(`${field} = $${i++}`);
      params.push(req.body[field]);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }

  params.push(id);
  const result = await query(
    `UPDATE properties SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    params
  );

  return res.json({ success: true, message: 'Property updated', property: result.rows[0] });
});

// Update status of property (sold, rented)
const updateOwnPropertyStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ['approved', 'sold', 'rented'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of ${allowedStatuses.join(', ')}` });
  }

  const check = await query('SELECT owner_id, status FROM properties WHERE id = $1', [id]);
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

  // Only owner or admin can update status
  if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
  }

  if (check.rows[0].status === 'pending' || check.rows[0].status === 'rejected') {
    return res.status(400).json({ success: false, message: 'This listing is still awaiting admin approval and cannot be marked sold/rented yet' });
  }

  const result = await query('UPDATE properties SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  return res.json({ success: true, message: `Property marked as ${status}`, property: result.rows[0] });
});

// Delete a property
const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const check = await query('SELECT owner_id FROM properties WHERE id = $1', [id]);
  
  if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

  // Only owner or admin can delete
  if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
  }

  await query('DELETE FROM properties WHERE id = $1', [id]);
  return res.json({ success: true, message: 'Property deleted' });
});

// Get listings for logged-in user
const getMyListings = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
      (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY is_primary DESC LIMIT 1) AS primary_image
     FROM properties p
     LEFT JOIN property_types pt ON pt.id = p.property_type_id
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE p.owner_id = $1
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  return res.json({ success: true, properties: result.rows });
});

// Get available property types (e.g., Apartment, Villa)
const getPropertyTypes = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM property_types ORDER BY id ASC');
  return res.json({ success: true, types: result.rows });
});

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  updateOwnPropertyStatus,
  deleteProperty,
  getMyListings,
  getPropertyTypes,
};