const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const userController = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public browsing / search
router.get('/', propertyController.listProperties);
router.get('/property-types', propertyController.getPropertyTypes);
router.get('/featured-projects', propertyController.getFeaturedProjects);

// Authenticated user-specific (must come before /:id to avoid route collision)
router.get('/my-listings', requireAuth, propertyController.getMyListings);
router.get('/shortlist', requireAuth, userController.getShortlist);
router.get('/recently-viewed', requireAuth, userController.getRecentlyViewed);
router.get('/recent-searches', requireAuth, userController.getRecentSearches);
router.post('/recent-searches', optionalAuth, userController.saveRecentSearch);

router.post('/:propertyId/shortlist', requireAuth, userController.addShortlist);
router.delete('/:propertyId/shortlist', requireAuth, userController.removeShortlist);
router.post('/:propertyId/contact', optionalAuth, userController.sendLead);

// Create / read / update / delete a property
router.post('/', requireAuth, upload.array('images', 10), propertyController.createProperty);
router.get('/:id', optionalAuth, propertyController.getPropertyById);
router.put('/:id', requireAuth, propertyController.updateProperty);
router.delete('/:id', requireAuth, propertyController.deleteProperty);

module.exports = router;
