const express = require('express');
const {
  getAllMedicines,
  getMedicineById,
  searchMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('./medicineController');
const { verifyToken } = require('../../shared/middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getAllMedicines);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

// Admin routes
router.post('/', verifyToken, createMedicine);
router.put('/:id', verifyToken, updateMedicine);
router.delete('/:id', verifyToken, deleteMedicine);

module.exports = router;
