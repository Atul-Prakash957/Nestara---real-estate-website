const { query, pool } = require('../config/db');

// ------------------------------------------------------------
// CREATE property (with images) - POST /api/properties
// ------------------------------------------------------------
async function createProperty(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      title, description, listing_type, property_type_id, city, locality,
      address, latitude, longitude, price, monthly_rent, security_deposit,
      area_sqft, bedrooms, bathrooms, balconies, floor_number, total_floors,
      furnishing, facing, age_of_property, parking, amenities,
      contact_name, contact_phone, contact_email,
      sharing_type, gender_preference, meals_included, price_per_bed,
    } = req.body;

    if (!title || !listing_type || !property_type_id || !price) {
      return res.status(400).json({ success: false, message: 'title, listing_type, property_type_id and price are required' });
    }

    // resolve or create location
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

    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : (amenities ? String(amenities).split(',').map(a => a.trim()) : []);

    const inserted = await client.query(
      `INSERT INTO properties (
        owner_id, title, description, listing_type, property_type_id, location_id,
        address, latitude, longitude, price, monthly_rent, security_deposit,
        area_sqft, bedrooms, bathrooms, balconies, floor_number, total_floors,
        furnishing, facing, age_of_property, parking, amenities,
        contact_name, contact_phone, contact_email,
        sharing_type, gender_preference, meals_included, price_per_bed
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
      ) RETURNING *`,
      [
        req.user.id, title, description, listing_type, property_type_id, locationId,
        address, latitude || null, longitude || null, price, monthly_rent || null, security_deposit || null,
        area_sqft || null, bedrooms || null, bathrooms || null, balconies || null, floor_number || null, total_floors || null,
        furnishing || null, facing || null, age_of_property || null, parking || 0, amenitiesArray,
        contact_name || null, contact_phone || null, contact_email || null,
        sharing_type || null, gender_preference || null, meals_included === 'true' || meals_included === true, price_per_bed || null,
      ]
    );

    const property = inserted.rows[0];

    // handle uploaded images (multer populates req.files)
    if (req.files && req.files.length > 0) {
      const values = req.files.map((file, idx) =>
        `('${property.id}', '/uploads/properties/${file.filename}', ${idx === 0}, ${idx})`
      ).join(',');

      await client.query(
        `INSERT INTO property_images (property_id, image_url, is_primary, display_order) VALUES ${values}`
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Property submitted for approval', property });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to create property', error: err.message });
  } finally {
    client.release();
  }
}

// ------------------------------------------------------------
// SEARCH / LIST properties with filters - GET /api/properties
// Query params: listing_type, city, locality, property_type_id, min_price,
// max_price, bedrooms, furnishing, q (text search), page, limit, sort
// ------------------------------------------------------------
async function listProperties(req, res) {
  try {
    const {
      listing_type, city, locality, property_type_id, min_price, max_price,
      bedrooms, furnishing, q, page = 1, limit = 12, sort = 'newest',
      pg, gender_preference, sharing_type,
    } = req.query;

    const conditions = [`p.status = 'approved'`];
    const params = [];
    let i = 1;

    if (listing_type) { conditions.push(`p.listing_type = $${i++}`); params.push(listing_type); }
    if (city) { conditions.push(`l.city ILIKE $${i++}`); params.push(`%${city}%`); }
    if (locality) { conditions.push(`l.locality ILIKE $${i++}`); params.push(`%${locality}%`); }
    if (property_type_id) { conditions.push(`p.property_type_id = $${i++}`); params.push(property_type_id); }
    if (min_price) { conditions.push(`p.price >= $${i++}`); params.push(min_price); }
    if (max_price) { conditions.push(`p.price <= $${i++}`); params.push(max_price); }
    if (bedrooms) { conditions.push(`p.bedrooms = $${i++}`); params.push(bedrooms); }
    if (furnishing) { conditions.push(`p.furnishing = $${i++}`); params.push(furnishing); }
    // "PG/Hostel" tab in the header links here with ?pg=true — matches the
    // seeded/admin-created 'PG / Hostel' property type by name so we don't
    // need to know its numeric id on the frontend.
    if (pg === 'true') { conditions.push(`pt.name ILIKE 'PG%'`); }
    if (gender_preference) { conditions.push(`p.gender_preference = $${i++}`); params.push(gender_preference); }
    if (sharing_type) { conditions.push(`p.sharing_type = $${i++}`); params.push(sharing_type); }
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch properties', error: err.message });
  }
}

// ------------------------------------------------------------
// GET single property details - GET /api/properties/:id
// ------------------------------------------------------------
async function getPropertyById(req, res) {
  try {
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

    // increment view count (fire and forget)
    query(`UPDATE properties SET views_count = views_count + 1 WHERE id = $1`, [id]).catch(() => {});

    // track recently viewed if logged in
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to fetch property', error: err.message });
  }
}

// ------------------------------------------------------------
// UPDATE property (owner or admin only) - PUT /api/properties/:id
// ------------------------------------------------------------
async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const check = await query('SELECT owner_id FROM properties WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
    }

    const allowedFields = [
      'title', 'description', 'price', 'monthly_rent', 'area_sqft', 'bedrooms',
      'bathrooms', 'balconies', 'floor_number', 'total_floors', 'furnishing',
      'facing', 'age_of_property', 'parking', 'amenities', 'contact_name',
      'contact_phone', 'contact_email', 'address',
      'sharing_type', 'gender_preference', 'meals_included', 'price_per_bed',
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update property', error: err.message });
  }
}

// ------------------------------------------------------------
// UPDATE own property status - PATCH /api/properties/:id/status
// Lets an owner (or admin) mark their own approved listing as sold/rented,
// or reactivate it back to "approved" if it comes back on the market.
// This is separate from the admin-only approve/reject workflow — owners
// can only move between approved <-> sold/rented, never touch pending/rejected.
// ------------------------------------------------------------
async function updateOwnPropertyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['approved', 'sold', 'rented'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of ${allowedStatuses.join(', ')}` });
    }

    const check = await query('SELECT owner_id, status FROM properties WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
    }

    if (check.rows[0].status === 'pending' || check.rows[0].status === 'rejected') {
      return res.status(400).json({ success: false, message: 'This listing is still awaiting admin approval and cannot be marked sold/rented yet' });
    }

    const result = await query('UPDATE properties SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    return res.json({ success: true, message: `Property marked as ${status}`, property: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update property status', error: err.message });
  }
}

// ------------------------------------------------------------
// DELETE property (owner or admin) - DELETE /api/properties/:id
// ------------------------------------------------------------
async function deleteProperty(req, res) {
  try {
    const { id } = req.params;
    const check = await query('SELECT owner_id FROM properties WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });

    if (check.rows[0].owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    await query('DELETE FROM properties WHERE id = $1', [id]);
    return res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Failed to delete property', error: err.message });
  }
}

// ------------------------------------------------------------
// GET properties posted by logged-in user - GET /api/properties/my-listings
// ------------------------------------------------------------
async function getMyListings(req, res) {
  try {
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
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch listings', error: err.message });
  }
}

// ------------------------------------------------------------
// Featured projects for homepage - GET /api/properties/featured-projects
// ------------------------------------------------------------
async function getFeaturedProjects(req, res) {
  try {
    const result = await query(
      `SELECT fp.*, l.city, l.locality FROM featured_projects fp
       LEFT JOIN locations l ON l.id = fp.location_id
       WHERE fp.is_active = TRUE ORDER BY fp.created_at DESC LIMIT 12`
    );
    return res.json({ success: true, projects: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured projects' });
  }
}

// ------------------------------------------------------------
// Property types list (for dropdowns/filters)
// ------------------------------------------------------------
async function getPropertyTypes(req, res) {
  try {
    const result = await query('SELECT * FROM property_types ORDER BY id ASC');
    return res.json({ success: true, types: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch property types' });
  }
}

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  updateOwnPropertyStatus,
  deleteProperty,
  getMyListings,
  getFeaturedProjects,
  getPropertyTypes,
};