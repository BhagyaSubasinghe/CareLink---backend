const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const {
  getAllMedicines,
  getMedicineById,
  searchMedicines,
  getMedicinesByType,
  scanReceipt,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock
} = require('./medicineController');
const { verifyToken, authorize } = require('../../shared/middlewares/authMiddleware');

/**
 * Validation middleware
 */
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * ============================================
 * PUBLIC ROUTES (No Authentication)
 * ============================================
 */

/**
 * GET /api/v1/medicines
 * Get all medicines with filtering and pagination
 */
router.get(
  '/',
  [
    query('type')
      .optional()
      .isIn(['tablet', 'syrup', 'injection', 'cream', 'powder']).withMessage('Invalid medicine type'),
    query('requiresPrescription')
      .optional()
      .isIn(['true', 'false']).withMessage('Must be true or false'),
    query('sort')
      .optional()
      .isIn(['name', 'price-asc', 'price-desc', 'rating', 'newest']).withMessage('Invalid sort option'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 }).withMessage('Max price must be a positive number')
  ],
  validateErrors,
  getAllMedicines
);

/**
 * GET /api/v1/medicines/search
 * Search medicines by query
 */
router.get(
  '/search',
  [
    query('q')
      .notEmpty().withMessage('Search query is required'),
    query('type')
      .optional()
      .isIn(['tablet', 'syrup', 'injection', 'cream', 'powder']).withMessage('Invalid medicine type'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateErrors,
  searchMedicines
);

/**
 * GET /api/v1/medicines/type/:type
 * Get medicines by type
 */
router.get(
  '/type/:type',
  [
    param('type')
      .isIn(['tablet', 'syrup', 'injection', 'cream', 'powder']).withMessage('Invalid medicine type')
  ],
  validateErrors,
  getMedicinesByType
);

/**
 * POST /api/v1/medicines/scan
 * Scan prescription/receipt image for medicines (OCR)
 */
router.post(
  '/scan',
  [
    body('image')
      .notEmpty().withMessage('Image is required')
      .isString().withMessage('Image must be a string (base64 encoded)')
  ],
  validateErrors,
  scanReceipt
);

/**
 * GET /api/v1/medicines/:id
 * Get medicine by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId().withMessage('Invalid medicine ID')
  ],
  validateErrors,
  getMedicineById
);

/**
 * ============================================
 * ADMIN ROUTES (Authentication Required)
 * ============================================
 */

/**
 * POST /api/v1/medicines
 * Create a new medicine (admin only)
 */
router.post(
  '/',
  verifyToken,
  authorize('admin'),
  [
    body('name')
      .notEmpty().withMessage('Medicine name is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('brand')
      .notEmpty().withMessage('Brand is required')
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Brand must be between 2 and 100 characters'),
    body('price')
      .notEmpty().withMessage('Price is required')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('dosage')
      .notEmpty().withMessage('Dosage is required')
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Dosage must be between 2 and 50 characters'),
    body('type')
      .notEmpty().withMessage('Type is required')
      .isIn(['tablet', 'syrup', 'injection', 'cream', 'powder']).withMessage('Invalid medicine type'),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('requiresPrescription')
      .optional()
      .isBoolean().withMessage('Must be true or false'),
    body('uses')
      .optional()
      .isArray().withMessage('Uses must be an array'),
    body('sideEffects')
      .optional()
      .isArray().withMessage('Side effects must be an array')
  ],
  validateErrors,
  createMedicine
);

/**
 * PUT /api/v1/medicines/:id
 * Update medicine (admin only)
 */
router.put(
  '/:id',
  verifyToken,
  authorize('admin'),
  [
    param('id')
      .isMongoId().withMessage('Invalid medicine ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('brand')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Brand must be between 2 and 100 characters'),
    body('price')
      .optional()
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('dosage')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Dosage must be between 2 and 50 characters'),
    body('type')
      .optional()
      .isIn(['tablet', 'syrup', 'injection', 'cream', 'powder']).withMessage('Invalid medicine type'),
    body('stock')
      .optional()
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
    body('requiresPrescription')
      .optional()
      .isBoolean().withMessage('Must be true or false')
  ],
  validateErrors,
  updateMedicine
);

/**
 * PATCH /api/v1/medicines/:id/stock
 * Update medicine stock (admin only)
 */
router.patch(
  '/:id/stock',
  verifyToken,
  authorize('admin'),
  [
    param('id')
      .isMongoId().withMessage('Invalid medicine ID'),
    body('stock')
      .notEmpty().withMessage('Stock is required')
      .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
  ],
  validateErrors,
  updateStock
);

/**
 * DELETE /api/v1/medicines/:id
 * Delete medicine (admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  authorize('admin'),
  [
    param('id')
      .isMongoId().withMessage('Invalid medicine ID')
  ],
  validateErrors,
  deleteMedicine
);

module.exports = router;
