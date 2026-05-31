const jwt = require('jsonwebtoken');

module.exports = function generateToken(userId) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};
