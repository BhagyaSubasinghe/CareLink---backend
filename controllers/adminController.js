const User = require('../src/features/user/User');
const Doctor = require('../src/features/doctor/Doctor');

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all doctors
// @route   GET /api/v1/admin/doctors
// @access  Private/Admin
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate('user', 'email role');
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getDoctors
};
