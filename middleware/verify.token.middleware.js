const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = function(req, res, next) {
  // Get the token from the request headers or query parameters
  const token = req.headers.authorization || req.query.token;

  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  // Extract the token from the "Bearer <token>" format
  const accessToken = token.split(' ')[1];

  // Verify and decode the token
  jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Extract the user ID from the decoded token
    req.userId = decoded.userId;

    next();
  });
};

module.exports = verifyToken;
