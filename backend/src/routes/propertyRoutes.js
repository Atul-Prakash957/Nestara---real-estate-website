const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const userController = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', propertyController.listProperties);
router.get('/property-types', propertyController.getPropertyTypes);

router.get('/my-listings', requireAuth, propertyController.getMyListings);
router.get('/my-leads', requireAuth, userController.getMyLeads);
router.get('/shortlist', requireAuth, userController.getShortlist);
router.get('/recently-viewed', requireAuth, userController.getRecentlyViewed);
router.get('/recent-searches', requireAuth, userController.getRecentSearches);
router.post('/recent-searches', optionalAuth, userController.saveRecentSearch);

router.post('/:propertyId/shortlist', requireAuth, userController.addShortlist);
router.delete('/:propertyId/shortlist', requireAuth, userController.removeShortlist);
router.post('/:propertyId/contact', optionalAuth, userController.sendLead);

router.post('/', requireAuth, upload.array('images', 10), propertyController.createProperty);
router.get('/:id', optionalAuth, propertyController.getPropertyById);
router.put('/:id', requireAuth, propertyController.updateProperty);
router.patch('/:id/status', requireAuth, propertyController.updateOwnPropertyStatus);
router.delete('/:id', requireAuth, propertyController.deleteProperty);

module.exports = router;