const express = require('express');
const adminUserController = require('../controllers/admin.user.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes in this file are protected and require admin role
router.use(verifyToken);
router.use(authorizeRoles('admin'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all non-system users (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip for pagination
 *     responses:
 *       200:
 *         description: A list of non-system users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse' # Defined in auth.routes.js or a common place
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', adminUserController.listUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get a specific non-system user by ID (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Details of the non-system user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid user ID format.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: User not found or is a system user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found or is a system user.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:userId', adminUserController.getUserById);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   put:
 *     summary: Update a user's status (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose status is to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, pending, rejected]
 *                 example: approved
 *     responses:
 *       200:
 *         description: User status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format or validation failed for status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (e.g., trying to update a system user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot modify system user status.
 *       404:
 *         $ref: '#/components/responses/NotFoundError' # User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:userId/status', adminUserController.updateUserStatus);

/**
 * @swagger
 * /api/admin/users/{userId}/role:
 *   put:
 *     summary: Update a user's role (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose role is to be updated
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *                 example: admin
 *     responses:
 *       200:
 *         description: User role updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Invalid user ID format or validation failed for role
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (e.g., trying to update a system user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot modify system user role.
 *       404:
 *         $ref: '#/components/responses/NotFoundError' # User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:userId/role', adminUserController.updateUserRole);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   delete:
 *     summary: Delete a non-system user and their associated data (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User and associated data deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User and associated data deleted successfully.
 *       204:
 *         description: User and associated data deleted successfully (No Content).
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (e.g., trying to delete a system user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot delete system user.
 *       404:
 *         $ref: '#/components/responses/NotFoundError' # User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:userId', adminUserController.deleteUser);

/**
 * @swagger
 * /api/admin/users/{userId}/password:
 *   put:
 *     summary: Change a user's password (Admin only)
 *     tags: [Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user whose password is to be changed
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: newSecurePassword123
 *     responses:
 *       200:
 *         description: User password changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User password changed successfully.
 *       400:
 *         description: Invalid user ID format or validation failed for newPassword
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden (e.g., trying to change password for a system user)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cannot change password for a system user.
 *       404:
 *         $ref: '#/components/responses/NotFoundError' # User not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:userId/password', adminUserController.changeUserPasswordByAdmin);

module.exports = router;