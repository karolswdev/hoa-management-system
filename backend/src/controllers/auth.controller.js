const authService = require('../services/auth.service');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validator');

/**
 * Handles user registration.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function register(req, res, next) {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    // Call registration service
    const user = await authService.registerUser(value);

    // Send response
    return res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user // Excludes password as handled by service
    });

  } catch (err) {
    // Handle errors from service (e.g., email conflict) or other unexpected errors
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Pass to a generic error handler if one is set up
    next(err); 
  }
}

/**
 * Handles user login.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function login(req, res, next) {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    // Call login service
    const { token, user } = await authService.loginUser(value);

    // Send response
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user // Excludes password as handled by service
    });

  } catch (err) {
    // Handle errors from service (e.g., invalid credentials, account not approved)
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Pass to a generic error handler
    next(err);
  }
}

/**
 * Handles forgot password request.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function forgotPassword(req, res, next) {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        // error: 'Invalid email format.' // More specific as per requirements
        message: 'Validation failed.',
        errors: error.details.map(d => d.message)
      });
    }

    await authService.requestPasswordReset(value.email);

    return res.status(200).json({
      message: 'Password reset email sent. Please check your inbox.'
    });

  } catch (err) {
    if (err.statusCode) {
      // Specific error messages based on service layer logic
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Default error for invalid email format if not caught by Joi (though Joi should catch it)
    if (err.message.toLowerCase().includes('email')) { // Basic check
        return res.status(400).json({ error: 'Invalid email format.' });
    }
    next(err);
  }
}

/**
 * Handles verification of a password reset token.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function verifyResetToken(req, res, next) {
  try {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    await authService.verifyPasswordResetToken(token);

    return res.status(200).json({ message: 'Token is valid.' });

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Default error for token issues
    return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    // next(err); // Or pass to generic error handler
  }
}

/**
 * Handles resetting a user's password.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
async function resetPassword(req, res, next) {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      // Check for password complexity error specifically
      if (error.details.some(d => d.path.includes('newPassword') && d.type === 'string.pattern.base')) {
        return res.status(400).json({
          error: "Password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
        });
      }
      // Generic validation error for missing fields or other issues
      return res.status(400).json({
        error: error.details.map(d => d.message).join(', ') || "Token and newPassword are required."
      });
    }

    await authService.resetPassword(value.token, value.newPassword);

    return res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (err) {
    if (err.statusCode) {
      // Specific error messages from service layer (e.g., invalid token)
      return res.status(err.statusCode).json({ error: err.message });
    }
    // Default error for other issues
    // Log the error for debugging if it's unexpected
    console.error('Unexpected error in resetPassword controller:', err);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
    // next(err); // Or pass to generic error handler
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};