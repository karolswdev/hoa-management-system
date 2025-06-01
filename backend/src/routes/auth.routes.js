const express = require('express');
const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/auth.validator.js');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: Registration successful. Account pending approval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful. Your account is pending approval.
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidation'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorConflict'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorServer'
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorValidation'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorUnauthorized'
 *       403:
 *         description: Account not approved or access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorForbidden'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorServer'
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent. Please check your inbox.
 *       400:
 *         description: Invalid email format or user account not active/eligible.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid email format.
 *       404:
 *         description: Email not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email not found.
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-token:
 *   get:
 *     summary: Verify a password reset token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The password reset token.
 *         example: abc123xyz789
 *     responses:
 *       200:
 *         description: Token is valid.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token is valid.
 *       400:
 *         description: Invalid or expired password reset token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid or expired password reset token.
 *       500:
 *         description: Internal server error
 */
router.get('/verify-reset-token', authController.verifyResetToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password with a token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: "THE_GENERATED_TOKEN_FROM_EMAIL"
 *                 description: The password reset token received by the user.
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "NewSecurePassword123!"
 *                 description: The new password for the user account. Must meet complexity requirements.
 *     responses:
 *       200:
 *         description: Password has been reset successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been reset successfully.
 *       400:
 *         description: Bad Request - Invalid/expired token, password complexity not met, or missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     invalidToken: "Invalid or expired password reset token."
 *                     passwordComplexity: "Password does not meet complexity requirements. Minimum 8 characters, including uppercase, lowercase, number, and special character."
 *                     missingFields: "Token and newPassword are required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorServer'
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);


// Placeholder for UserResponse schema (to be defined in Swagger setup)
// components:
//   schemas:
//     UserResponse:
//       type: object
//       properties:
//         id:
//           type: integer
//         name:
//           type: string
//         email:
//           type: string
//         role:
//           type: string
//         status:
//           type: string
//         email_verified:
//           type: boolean
//         is_system_user:
//           type: boolean
//         created_at:
//           type: string
//           format: date-time
//         updated_at:
//           type: string
//           format: date-time
//     ErrorValidation:
//       type: object
//       properties:
//         message:
//           type: string
//           example: Validation failed.
//         errors:
//           type: array
//           items:
//             type: string
//           example: ["Name is required."]
//     ErrorConflict:
//       type: object
//       properties:
//         message:
//           type: string
//           example: Email already registered.
//     ErrorUnauthorized:
//       type: object
//       properties:
//         message:
//           type: string
//           example: Invalid email or password.
//     ErrorForbidden:
//       type: object
//       properties:
//         message:
//           type: string
//           example: Account pending approval.
//     ErrorServer:
//       type: object
//       properties:
//         message:
//           type: string
//           example: Internal server error

module.exports = router;