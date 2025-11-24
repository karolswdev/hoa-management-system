const rateLimit = require('express-rate-limit');
const logger = require('./logger');

const isTestEnv = process.env.NODE_ENV === 'test';
const skipInTest = () => isTestEnv;

// Default rate limit for all API endpoints
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: skipInTest,
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  skipSuccessfulRequests: false,
  skip: skipInTest,
  message: {
    message: 'Too many authentication attempts, please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      message: 'Too many authentication attempts, please try again later.',
    });
  },
});

// Rate limit for login attempts (per IP + email combination)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per IP per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  skip: skipInTest,
  keyGenerator: (req) => {
    // Create key from IP + email for more granular limiting
    return `${req.ip}-${req.body.email || 'unknown'}`;
  },
  message: {
    message: 'Too many login attempts, please try again in 15 minutes.',
  },
  handler: (req, res) => {
    logger.warn('Login rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });
    res.status(429).json({
      message: 'Too many login attempts, please try again in 15 minutes.',
    });
  },
});

// Rate limit for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per IP per hour
  skipSuccessfulRequests: false,
  skip: skipInTest,
  message: {
    message: 'Too many registration attempts, please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Registration rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });
    res.status(429).json({
      message: 'Too many registration attempts, please try again later.',
    });
  },
});

// Rate limit for password reset requests
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per IP per hour
  skipSuccessfulRequests: false,
  skip: skipInTest,
  keyGenerator: (req) => {
    // Create key from IP + email
    return `${req.ip}-${req.body.email || 'unknown'}`;
  },
  message: {
    message: 'Too many password reset attempts, please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });
    res.status(429).json({
      message: 'Too many password reset attempts, please try again later.',
    });
  },
});

// Extremely low limit for verification re-sends (IP + email combo)
const verificationResendLimiter = rateLimit({
  windowMs: 6 * 60 * 60 * 1000, // 6 hours
  max: 1, // Only one resend in the window to stay on free tier
  skipSuccessfulRequests: false,
  skip: skipInTest,
  keyGenerator: (req) => `${req.ip}-${req.body.email || 'unknown'}`,
  message: {
    message: 'Verification email already sent recently. Please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Verification resend rate limit exceeded', {
      ip: req.ip,
      email: req.body.email,
    });
    res.status(429).json({
      message: 'Verification email already sent recently. Please try again later.',
    });
  },
});

// Rate limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 file uploads per IP per 15 minutes
  skip: skipInTest,
  message: {
    message: 'Too many file uploads, please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
    });
    res.status(429).json({
      message: 'Too many file uploads, please try again later.',
    });
  },
});

// Rate limit for board contact requests (IP + email combination)
const boardContactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 contact requests per IP + email per hour
  skipSuccessfulRequests: false,
  skip: skipInTest,
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.requestor_email || 'unknown'}`;
  },
  message: {
    message: 'Too many contact requests. Please try again later.',
  },
  handler: (req, res) => {
    logger.warn('Board contact rate limit exceeded', {
      ip: req.ip,
      email: req.body.requestor_email,
    });
    res.status(429).json({
      message: 'Too many contact requests. Please try again later.',
    });
  },
});

module.exports = {
  defaultLimiter,
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationResendLimiter,
  uploadLimiter,
  boardContactLimiter,
};
