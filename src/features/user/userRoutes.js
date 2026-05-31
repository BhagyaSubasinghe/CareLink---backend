const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getAllUsers,
} = require('./userController');
const { verifyToken } = require('../../shared/middlewares/authMiddleware');

const router = express.Router();

// Protected routes
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.delete('/account', verifyToken, deleteUserAccount);

// Admin routes
router.get('/', verifyToken, getAllUsers);

module.exports = router;
