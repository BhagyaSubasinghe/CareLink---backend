const express = require('express');
const { getUsers, deleteUser, getDoctors } = require('../controllers/adminController');
const { protect, authorize } = require('../src/shared/middlewares/authMiddleware');

const router = express.Router();

// Apply auth middleware for all routes in this file
router.use(protect);
router.use(authorize('admin')); // Only admins can access these routes

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.route('/doctors')
  .get(getDoctors);

module.exports = router;
