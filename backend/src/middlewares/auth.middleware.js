const jwt = require('jsonwebtoken');
const { User } = require('../../models'); // Adjust path if models are not in root/models

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches user information to req.user if token is valid.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token is required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Optionally, fetch user from DB to ensure they still exist and are active
    // This adds a DB hit but increases security. For this example, we'll trust the token payload.
    // const user = await User.findByPk(decoded.userId);
    // if (!user || user.status !== 'approved') {
    //   return res.status(401).json({ message: 'Invalid token or user not active.' });
    // }

    req.user = {
      id: decoded.userId, // Ensure this matches the payload key (userId or id)
      role: decoded.role,
      // Add other non-sensitive user details from token if needed
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    // For other errors, pass to generic error handler
    console.error('JWT verification error:', error);
    return res.status(403).json({ message: 'Forbidden: Token verification failed.' });
  }
}

/**
 * Middleware factory to authorize users based on roles.
 * @param  {...string} allowedRoles - List of roles allowed to access the route.
 * @returns {function} Express middleware function.
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This should ideally not happen if verifyToken runs first and sets req.user
      return res.status(403).json({ message: 'Forbidden: User role not available.' });
    }

    const rolesArray = [...allowedRoles];
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource.' });
    }
    next();
  };
}

/**
 * Middleware to optionally verify JWT token.
 * If a token is provided and valid, req.user is populated.
 * If no token or an invalid token is provided, it proceeds without error, and req.user remains undefined.
 * This is useful for routes that behave differently for guests vs. authenticated users.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      // Invalid token, but we don't block the request, just don't set req.user
      console.warn('Optional auth: Invalid token received, proceeding as guest.', error.name);
    }
  }
  next();
}

module.exports = {
  verifyToken,
  authorizeRoles,
  optionalAuth,
};