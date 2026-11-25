import express from 'express';
import {
  createProperty,
  updateProperty,
  deleteProperty,
  getOwnerProperties,
  createUnit,
  updateUnit,
  deleteUnit,
  blockDates,
  unblockDates,
  addPricingRule,
  updatePricingRule,
  deletePricingRule,
  getOwnerBookings,
  getOccupancyReport,
  getRevenueReport,
  getCombinedReports,
  getUnitCalendar,
} from '../controllers/ownerController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validate } from '../validators/authValidator.js';
import {
  createPropertySchema,
  updatePropertySchema,
  createUnitSchema,
  blockDateSchema,
  pricingRuleSchema,
} from '../validators/propertyValidator.js';

const router = express.Router();

// All owner routes require authentication and the 'owner' or 'admin' role
router.use(authenticateToken);
router.use(authorizeRoles('owner', 'admin'));

// Property Management
router.post('/properties', validate(createPropertySchema), createProperty);
router.get('/properties', getOwnerProperties);
router.put('/properties/:id', validate(updatePropertySchema), updateProperty);
router.delete('/properties/:id', deleteProperty);

// Unit Inventory Management
router.post('/units', validate(createUnitSchema), createUnit);
router.post('/properties/:propertyId/units', (req, res, next) => {
  req.body.propertyId = req.params.propertyId;
  next();
}, validate(createUnitSchema), createUnit);
router.put('/units/:id', updateUnit);
router.delete('/units/:id', deleteUnit);
router.get('/units/:id/calendar', getUnitCalendar);

const injectUnitAndDates = (req, res, next) => {
  if (!req.body.unitId && req.params.id) req.body.unitId = req.params.id;
  if (!req.body.from && req.body.startDate) {
    req.body.from = req.body.startDate;
    delete req.body.startDate;
  }
  if (!req.body.to && req.body.endDate) {
    req.body.to = req.body.endDate;
    delete req.body.endDate;
  }
  next();
};

// Date Blocking
router.post('/units/:id/block', injectUnitAndDates, validate(blockDateSchema), blockDates);
router.post('/units/:id/block-dates', injectUnitAndDates, validate(blockDateSchema), blockDates);
router.delete('/units/:id/block/:blockId', unblockDates);

// Pricing Rules Management
router.post('/units/:id/pricing', injectUnitAndDates, validate(pricingRuleSchema), addPricingRule);
router.post('/units/:id/pricing-rules', injectUnitAndDates, validate(pricingRuleSchema), addPricingRule);
router.put('/pricing/:id', updatePricingRule);
router.delete('/pricing/:id', deletePricingRule);

// Bookings & Analytics Reports
router.get('/bookings', getOwnerBookings);
router.get('/reports', getCombinedReports);
router.get('/reports/occupancy', getOccupancyReport);
router.get('/reports/revenue', getRevenueReport);

export default router;
