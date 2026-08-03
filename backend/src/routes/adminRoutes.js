const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes require a valid token AND role === 'admin'
router.use(requireAuth, requireRole('admin'));

router.get('/dashboard-stats', admin.getDashboardStats);

router.get('/properties', admin.getAllPropertiesAdmin);
router.patch('/properties/:id/status', admin.updatePropertyStatus);
router.patch('/properties/:id/feature', admin.toggleFeatured);

router.get('/users', admin.getAllUsers);
router.patch('/users/:id/toggle-active', admin.toggleUserActive);
router.patch('/users/:id/role', admin.updateUserRole);

router.get('/featured-projects', admin.getFeaturedProjectsAdmin);
router.post('/featured-projects', admin.createFeaturedProject);
router.put('/featured-projects/:id', admin.updateFeaturedProject);
router.patch('/featured-projects/:id/toggle-active', admin.toggleFeaturedProjectActive);
router.delete('/featured-projects/:id', admin.deleteFeaturedProject);

module.exports = router;
