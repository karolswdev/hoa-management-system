const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, VerificationToken } = require('../../models'); // Adjust path as necessary if models are not in root/models
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // For a more secure plain token, though UUIDv4 is generally good.

/**
 * Registers a new user.
 * @param {object} userData - User data including name, email, and password.
 * @returns {Promise<object>} The created user object or throws an error.
 */
async function registerUser(userData) {
  const { name, email, password } = userData;

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already registered.');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10

  // Create user
  // role defaults to 'member' and status to 'pending' as per model definition
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    // email_verified and is_system_user will use their default values from the model
  });

  // Exclude password from the returned user object
  const userJson = newUser.toJSON();
  delete userJson.password;
  return userJson;
}

/**
 * Logs in an existing user.
 * @param {object} loginData - User login data including email and password.
 * @returns {Promise<object>} An object containing the JWT and user details (excluding password).
 * @throws {Error} If authentication fails or account is not approved.
 */
async function loginUser(loginData) {
  const { email, password } = loginData;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  if (user.status !== 'approved') {
    let message = 'Account access denied.';
    if (user.status === 'pending') {
      message = 'Account pending approval.';
    } else if (user.status === 'rejected') {
      message = 'Your account has been rejected.';
    }
    const error = new Error(message);
    error.statusCode = 403; // Forbidden
    throw error;
  }

  // Generate JWT
  const tokenPayload = {
    userId: user.id,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h', // Default to 1 hour
  });

  // Exclude password from the returned user object
  const userJson = user.toJSON();
  delete userJson.password;

  return {
    token,
    user: userJson,
  };
}

/**
 * Requests a password reset token for a user.
 * @param {string} email - The user's email address.
 * @returns {Promise<void>}
 * @throws {Error} If email is not found, user is not active, or other issues occur.
 */
async function requestPasswordReset(email) {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    const error = new Error('Email not found.');
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== 'approved') {
    const error = new Error('User account is not active or eligible for password reset.');
    error.statusCode = 400;
    throw error;
  }

  // Generate a unique token
  const plainToken = uuidv4(); // Or crypto.randomBytes(32).toString('hex');
  const hashedToken = await bcrypt.hash(plainToken, 10);

  // Set token expiry (e.g., 1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Store the verification token
  await VerificationToken.create({
    userId: user.id,
    token: hashedToken,
    type: 'password_reset',
    expiresAt,
  });

  // Prepare email content (log instead of sending)
  const resetLink = `https://your-frontend-domain.com/reset-password?token=${plainToken}`;
  const emailContent = {
    to: user.email,
    subject: 'Password Reset Request',
    body: `
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };

  console.log('--- Password Reset Email ---');
  console.log(`Recipient: ${emailContent.to}`);
  console.log(`Subject: ${emailContent.subject}`);
  console.log(`Body: ${emailContent.body}`);
  console.log('-----------------------------');
}

/**
 * Verifies a password reset token.
 * @param {string} token - The password reset token from the query parameter.
 * @returns {Promise<boolean>} True if the token is valid.
 * @throws {Error} If the token is invalid, expired, or not found.
 */
async function verifyPasswordResetToken(token) {
  if (!token) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400; // Bad Request
    throw error;
  }

  // Find all non-expired password_reset tokens
  const potentialTokens = await VerificationToken.findAll({
    where: {
      type: 'password_reset',
      expiresAt: {
        [require('sequelize').Op.gt]: new Date(), // Check if expiresAt is greater than current time
      },
    },
    include: [{ model: User, attributes: ['id', 'email'] }], // Optional: include user for context
  });

  let isValidToken = false;
  let matchedUser = null;

  for (const vt of potentialTokens) {
    const isMatch = await bcrypt.compare(token, vt.token);
    if (isMatch) {
      isValidToken = true;
      matchedUser = vt.User; // Store user if needed for further steps (e.g. actual reset)
      // Optionally, delete the token after successful verification to prevent reuse
      // await vt.destroy();
      break;
    }
  }

  if (!isValidToken) {
    const error = new Error('Invalid or expired password reset token.');
    // Determine if 404 (not found) or 400 (bad request, e.g. expired)
    // For simplicity, using 400 for all invalid/expired cases here.
    error.statusCode = 400;
    throw error;
  }

  // If you need to return user details or a specific message:
  // return { message: "Token is valid.", userId: matchedUser.id };
  return true; // Or simply return true/false
}

/**
 * Resets a user's password using a valid token.
 * @param {string} token - The password reset token.
 * @param {string} newPassword - The new password.
 * @returns {Promise<void>}
 * @throws {Error} If token is invalid, password complexity fails, or other issues.
 */
async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    const error = new Error('Token and newPassword are required.');
    error.statusCode = 400;
    throw error;
  }

  // Password complexity is handled by Joi validator, but can be double-checked here if desired.
  // For this implementation, we assume Joi validation has passed if this function is reached.

  // Find all non-expired password_reset tokens
  const potentialTokens = await VerificationToken.findAll({
    where: {
      type: 'password_reset',
      expiresAt: {
        [require('sequelize').Op.gt]: new Date(),
      },
    },
  });

  let validVerificationToken = null;
  for (const vt of potentialTokens) {
    const isMatch = await bcrypt.compare(token, vt.token);
    if (isMatch) {
      validVerificationToken = vt;
      break;
    }
  }

  if (!validVerificationToken) {
    const error = new Error('Invalid or expired password reset token.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(validVerificationToken.userId);
  if (!user) {
    // This case should ideally not happen if token integrity is maintained
    const error = new Error('User associated with token not found.');
    error.statusCode = 500; // Internal server error, as this indicates data inconsistency
    throw error;
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user's password
  user.password = hashedPassword;
  await user.save();

  // Invalidate/delete the token
  await validVerificationToken.destroy();

  // Log the event (basic console log for now)
  console.log(`Password reset successfully for user ID: ${user.id}`);

  // Optional: Invalidate other active sessions (future enhancement)
}


module.exports = {
  registerUser,
  loginUser,
  requestPasswordReset,
  verifyPasswordResetToken,
  resetPassword,
};