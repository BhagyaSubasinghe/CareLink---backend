const jwt = require('jsonwebtoken');

module.exports = function generateToken(userId, role = 'patient') {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};
