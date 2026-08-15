const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard-stats', admin.getDashboardStats);

router.get('/properties', admin.getAllPropertiesAdmin);
router.patch('/properties/:id/status', admin.updatePropertyStatus);
router.patch('/properties/:id/feature', admin.toggleFeatured);

router.get('/users', admin.getAllUsers);
router.patch('/users/:id/toggle-active', admin.toggleUserActive);
router.patch('/users/:id/role', admin.updateUserRole);

module.exports = router;