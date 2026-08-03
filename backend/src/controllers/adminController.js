const { query } = require('../config/db');

// GET /api/admin/properties?status=pending
async function getAllPropertiesAdmin(req, res) {
  try {
    const { status } = req.query;
    const conditions = [];
    const params = [];
    if (status) { conditions.push('p.status = $1'); params.push(status); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
        u.name AS owner_name, u.email AS owner_email,
        (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY is_primary DESC LIMIT 1) AS primary_image
       FROM properties p
       LEFT JOIN property_types pt ON pt.id = p.property_type_id
       LEFT JOIN locations l ON l.id = p.location_id
       LEFT JOIN users u ON u.id = p.owner_id
       ${where}
       ORDER BY p.created_at DESC`,
      params
    );
    return res.json({ success: true, properties: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch properties', error: err.message });
  }
}

// PATCH /api/admin/properties/:id/status  { status: 'approved'|'rejected'|'sold'|'rented' }
async function updatePropertyStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'sold', 'rented'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of ${validStatuses.join(', ')}` });
    }
    const result = await query('UPDATE properties SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });
    return res.json({ success: true, message: `Property marked as ${status}`, property: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
}

// PATCH /api/admin/properties/:id/feature  { isFeatured: true }
async function toggleFeatured(req, res) {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;
    const result = await query(
      'UPDATE properties SET is_featured = $1 WHERE id = $2 RETURNING *',
      [!!isFeatured, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });
    return res.json({ success: true, property: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update featured flag', error: err.message });
  }
}

// GET /api/admin/dashboard-stats
async function getDashboardStats(req, res) {
  try {
    const [users, properties, pending, leads] = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']),
      query('SELECT COUNT(*) FROM properties'),
      query(`SELECT COUNT(*) FROM properties WHERE status = 'pending'`),
      query('SELECT COUNT(*) FROM property_leads'),
    ]);

    const byType = await query(`
      SELECT pt.name, COUNT(*) as count FROM properties p
      JOIN property_types pt ON pt.id = p.property_type_id
      GROUP BY pt.name ORDER BY count DESC
    `);

    const byCity = await query(`
      SELECT l.city, COUNT(*) as count FROM properties p
      JOIN locations l ON l.id = p.location_id
      GROUP BY l.city ORDER BY count DESC LIMIT 10
    `);

    return res.json({
      success: true,
      stats: {
        totalUsers: Number(users.rows[0].count),
        totalProperties: Number(properties.rows[0].count),
        pendingApprovals: Number(pending.rows[0].count),
        totalLeads: Number(leads.rows[0].count),
        propertiesByType: byType.rows,
        propertiesByCity: byCity.rows,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: err.message });
  }
}

// GET /api/admin/users
async function getAllUsers(req, res) {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role, is_email_verified, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    return res.json({ success: true, users: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
  }
}

// PATCH /api/admin/users/:id/toggle-active
async function toggleUserActive(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user', error: err.message });
  }
}

// POST /api/admin/featured-projects
async function createFeaturedProject(req, res) {
  try {
    const { name, builder_name, city, locality, price_range, banner_image, possession_date } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required' });

    let locationId = null;
    if (city && locality) {
      const loc = await query(
        `INSERT INTO locations (city, locality) VALUES ($1,$2)
         ON CONFLICT (city, locality) DO UPDATE SET city = EXCLUDED.city RETURNING id`,
        [city, locality]
      );
      locationId = loc.rows[0].id;
    }

    const result = await query(
      `INSERT INTO featured_projects (name, builder_name, location_id, price_range, banner_image, possession_date)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, builder_name || null, locationId, price_range || null, banner_image || null, possession_date || null]
    );

    return res.status(201).json({ success: true, project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create featured project', error: err.message });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['user', 'agent', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `role must be one of ${validRoles.join(', ')}` });
    }

    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin access' });
    }

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

return res.status(201).json({ success: true, project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create featured project', error: err.message });
  }
}

// GET /api/admin/featured-projects - all projects, including inactive ones
async function getFeaturedProjectsAdmin(req, res) {
  try {
    const result = await query(
      `SELECT fp.*, l.city, l.locality FROM featured_projects fp
       LEFT JOIN locations l ON l.id = fp.location_id
       ORDER BY fp.created_at DESC`
    );
    return res.json({ success: true, projects: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured projects', error: err.message });
  }
}

// PUT /api/admin/featured-projects/:id
async function updateFeaturedProject(req, res) {
  try {
    const { id } = req.params;
    const { name, builder_name, city, locality, price_range, banner_image, possession_date } = req.body;

    let locationId;
    if (city && locality) {
      const loc = await query(
        `INSERT INTO locations (city, locality) VALUES ($1,$2)
         ON CONFLICT (city, locality) DO UPDATE SET city = EXCLUDED.city RETURNING id`,
        [city, locality]
      );
      locationId = loc.rows[0].id;
    }

    const fields = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); params.push(name); }
    if (builder_name !== undefined) { fields.push(`builder_name = $${i++}`); params.push(builder_name); }
    if (locationId !== undefined) { fields.push(`location_id = $${i++}`); params.push(locationId); }
    if (price_range !== undefined) { fields.push(`price_range = $${i++}`); params.push(price_range); }
    if (banner_image !== undefined) { fields.push(`banner_image = $${i++}`); params.push(banner_image); }
    if (possession_date !== undefined) { fields.push(`possession_date = $${i++}`); params.push(possession_date); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    params.push(id);
    const result = await query(
      `UPDATE featured_projects SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });

    return res.json({ success: true, project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update featured project', error: err.message });
  }
}

// PATCH /api/admin/featured-projects/:id/toggle-active
async function toggleFeaturedProjectActive(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE featured_projects SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, project: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle project', error: err.message });
  }
}

// DELETE /api/admin/featured-projects/:id
async function deleteFeaturedProject(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM featured_projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    return res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete featured project', error: err.message });
  }
}

module.exports = {
  getAllPropertiesAdmin,
  updatePropertyStatus,
  toggleFeatured,
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
  updateUserRole,
  createFeaturedProject,
  getFeaturedProjectsAdmin,
  updateFeaturedProject,
  toggleFeaturedProjectActive,
  deleteFeaturedProject,
};
