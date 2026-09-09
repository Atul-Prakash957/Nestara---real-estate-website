const { query } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Fetch all properties for admin panel
const getAllPropertiesAdmin = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const conditions = [];
  const params = [];
  
  if (status) { 
    conditions.push('p.status = $1'); 
    params.push(status); 
  }
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
});

// Update property status (approve, reject, etc)
const updatePropertyStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'approved', 'rejected', 'sold', 'rented'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of ${validStatuses.join(', ')}` });
  }
  
  const result = await query('UPDATE properties SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });
  
  return res.json({ success: true, message: `Property marked as ${status}`, property: result.rows[0] });
});

// Toggle if a property is featured
const toggleFeatured = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isFeatured } = req.body;
  
  const result = await query(
    'UPDATE properties SET is_featured = $1 WHERE id = $2 RETURNING *',
    [!!isFeatured, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Property not found' });
  
  return res.json({ success: true, property: result.rows[0] });
});

// Get admin dashboard statistics
const getDashboardStats = asyncHandler(async (req, res) => {
  /*
    BEGINNER SQL EXPLANATION:
    Promise.all runs all these COUNT queries at the exact same time (concurrently) 
    so the dashboard loads 4x faster than if we ran them one after another.
  */
  const [users, properties, pending, leads] = await Promise.all([
    query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']),
    query('SELECT COUNT(*) FROM properties'),
    query(`SELECT COUNT(*) FROM properties WHERE status = 'pending'`),
    query('SELECT COUNT(*) FROM property_leads'),
  ]);

  /*
    BEGINNER SQL EXPLANATION (GROUP BY):
    This query counts how many properties exist for each type (e.g. 10 Villas, 5 Apartments).
    'GROUP BY pt.name' clumps the rows together by name, and COUNT(*) counts the rows in each clump.
  */
  const byType = await query(`
    SELECT pt.name, COUNT(*) as count FROM properties p
    JOIN property_types pt ON pt.id = p.property_type_id
    GROUP BY pt.name ORDER BY count DESC
  `);

  /*
    This groups properties by city to show the most popular cities on the admin dashboard.
  */
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
});

// Fetch all registered users
const getAllUsers = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, name, email, phone, role, is_email_verified, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  return res.json({ success: true, users: result.rows });
});

// Activate or deactivate a user
const toggleUserActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
    [id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
  
  return res.json({ success: true, user: result.rows[0] });
});

// Change user role
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const validRoles = ['user', 'agent', 'admin'];

  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `role must be one of ${validRoles.join(', ')}` });
  }

  // Prevent an admin from removing their own admin privileges by mistake
  if (id === req.user.id && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'You cannot remove your own admin access' });
  }

  const result = await query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

  return res.json({ success: true, message: `${result.rows[0].name} is now ${role}`, user: result.rows[0] });
});

module.exports = {
  getAllPropertiesAdmin,
  updatePropertyStatus,
  toggleFeatured,
  getDashboardStats,
  getAllUsers,
  toggleUserActive,
  updateUserRole,
};