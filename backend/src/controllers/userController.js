const { query } = require('../config/db');
const { sendLeadNotificationEmail } = require('../utils/mailer');
const asyncHandler = require('../utils/asyncHandler');

// ---------------- SHORTLIST ----------------

// Add property to user's shortlist
const addShortlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  await query(
    `INSERT INTO shortlists (user_id, property_id) VALUES ($1, $2)
     ON CONFLICT (user_id, property_id) DO NOTHING`,
    [req.user.id, propertyId]
  );
  return res.json({ success: true, message: 'Property shortlisted' });
});

// Remove property from shortlist
const removeShortlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  await query('DELETE FROM shortlists WHERE user_id = $1 AND property_id = $2', [req.user.id, propertyId]);
  return res.json({ success: true, message: 'Removed from shortlist' });
});

// Get user's shortlisted properties
const getShortlist = asyncHandler(async (req, res) => {
  /*
    BEGINNER SQL EXPLANATION:
    1. We start from the 'shortlists s' table to find properties saved by this user.
    2. We JOIN 'properties p' to get the actual property data (title, price, etc.).
    3. We LEFT JOIN 'property_types' and 'locations' to get human-readable names (like 'Villa' or 'Mumbai').
    4. The nested SELECT fetches the primary cover image for the property.
  */
  const result = await query(
    `SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
      (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY is_primary DESC LIMIT 1) AS primary_image,
      s.created_at AS shortlisted_at
     FROM shortlists s
     JOIN properties p ON p.id = s.property_id
     LEFT JOIN property_types pt ON pt.id = p.property_type_id
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [req.user.id]
  );
  return res.json({ success: true, properties: result.rows });
});

// ---------------- RECENTLY VIEWED ----------------

// Get user's recently viewed properties
const getRecentlyViewed = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, pt.name AS property_type_name, l.city, l.locality,
      (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY is_primary DESC LIMIT 1) AS primary_image,
      rv.viewed_at
     FROM recently_viewed rv
     JOIN properties p ON p.id = rv.property_id
     LEFT JOIN property_types pt ON pt.id = p.property_type_id
     LEFT JOIN locations l ON l.id = p.location_id
     WHERE rv.user_id = $1
     ORDER BY rv.viewed_at DESC LIMIT 20`,
    [req.user.id]
  );
  return res.json({ success: true, properties: result.rows });
});

// ---------------- RECENT SEARCHES ----------------

// Save a search query for the user
const saveRecentSearch = asyncHandler(async (req, res) => {
  const { searchQuery, filters } = req.body;
  if (!searchQuery) return res.status(400).json({ success: false, message: 'searchQuery is required' });

  await query(
    `INSERT INTO recent_searches (user_id, search_query, filters) VALUES ($1, $2, $3)`,
    [req.user ? req.user.id : null, searchQuery, filters ? JSON.stringify(filters) : null]
  );
  return res.json({ success: true, message: 'Search saved' });
});

// Get user's recent searches
const getRecentSearches = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT DISTINCT ON (search_query) search_query, filters, created_at
     FROM recent_searches WHERE user_id = $1
     ORDER BY search_query, created_at DESC LIMIT 10`,
    [req.user.id]
  );
  return res.json({ success: true, searches: result.rows });
});

// ---------------- LEADS / CONTACT OWNER ----------------

// Send an enquiry to property owner
const sendLead = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { name, phone, email, message } = req.body;
  
  if (!phone) return res.status(400).json({ success: false, message: 'phone is required to contact owner' });

  const propResult = await query(
    `SELECT p.title, p.owner_id, u.email AS owner_email
     FROM properties p JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1`,
    [propertyId]
  );
  if (propResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  
  const { title, owner_id, owner_email } = propResult.rows[0];

  if (req.user && req.user.id === owner_id) {
    return res.status(400).json({ success: false, message: 'You cannot send an enquiry on your own listing' });
  }

  await query(
    `INSERT INTO property_leads (property_id, user_id, name, phone, email, message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [propertyId, req.user ? req.user.id : null, name || null, phone, email || null, message || null]
  );

  // Notify the property owner by email — fire and forget
  if (owner_email) {
    sendLeadNotificationEmail(owner_email, {
      propertyTitle: title,
      propertyId,
      leadName: name,
      leadPhone: phone,
      leadEmail: email,
      message,
    }).catch((err) => console.error('Failed to send lead notification email:', err.message));
  }

  return res.json({ success: true, message: 'Your interest has been sent to the owner/agent' });
});

// Get enquiries received on properties I own
const getMyLeads = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT pl.*, p.title AS property_title
     FROM property_leads pl
     JOIN properties p ON p.id = pl.property_id
     WHERE p.owner_id = $1
     ORDER BY pl.created_at DESC`,
    [req.user.id]
  );
  return res.json({ success: true, leads: result.rows });
});

module.exports = {
  addShortlist,
  removeShortlist,
  getShortlist,
  getRecentlyViewed,
  saveRecentSearch,
  getRecentSearches,
  sendLead,
  getMyLeads,
};