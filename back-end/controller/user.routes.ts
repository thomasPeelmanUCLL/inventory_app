/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management endpoints (Authentication handled by Better Auth at /api/auth/*)
 *
 * components:
 *   securitySchemes:
 *     betterAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: Session Token
 *       description: Better Auth session token (user ID)
 *
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique user identifier (CUID format)
 *           example: "ckl1234567890abcdef"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           description: User's display name
 *           example: "John Doe"
 *         role:
 *           type: string
 *           enum: [admin, user, guest]
 *           default: user
 *           description: User's role in the system
 *           example: "user"
 *         age:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           description: User's age
 *           example: 25
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *           example: "Invalid credentials"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Error timestamp
 *           example: "2024-01-15T10:30:00Z"
 *
 *     Role:
 *       type: string
 *       enum: [admin, user, guest]
 *       description: User role in the system
 */

import express from 'express';
import userService from '../service/user.service';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../util/validators';
import { userToDTO, usersToDTO } from '../dto/user.dto';

const userRouter = express.Router();

// These expose names and emails, so signed-in users only
userRouter.use(requireAuth);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users or search by email
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: email
 *         required: false
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to search for a specific user
 *         example: "user@example.com"
 *     responses:
 *       200:
 *         description: List of users (or single user if email query provided)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
userRouter.get(
    '/',
    asyncHandler(async (req, res) => {
        const { email } = req.query;
        if (email) {
            res.json([userToDTO(await userService.getUserByEmail({ email: String(email) }))]);
        } else {
            res.json(usersToDTO(await userService.getAllUsers()));
        }
    }),
);

/**
 * @swagger
 * /users/name/{name}:
 *   get:
 *     summary: Get user by username
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
userRouter.get(
    '/name/:name',
    asyncHandler(async (req, res) => {
        res.json(userToDTO(await userService.getUserByName({ name: req.params.name })));
    }),
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (CUID)
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 */
userRouter.get(
    '/:id',
    asyncHandler(async (req, res) => {
        res.json(userToDTO(await userService.getUserById({ id: req.params.id })));
    }),
);

export { userRouter };
