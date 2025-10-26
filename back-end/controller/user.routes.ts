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
 *         emailVerified:
 *           type: boolean
 *           description: Whether the email has been verified
 *           default: false
 *           example: false
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2024-01-15T10:30:00Z"
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
import express, { NextFunction, Request, Response } from 'express';
import userService from '../service/user.service';
import {optionalAuth} from "../middleware/auth.middleware";

const userRouter = express.Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users or search by email
 *     description: |
 *       Retrieve a list of all users in the system, or search for a specific user by email address.
 *       Returns an empty array if no users are found or if an error occurs.
 *
 *       **Note**: For authentication (login/signup), use Better Auth endpoints at `/api/auth/*`
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
 *             examples:
 *               allUsers:
 *                 summary: All users
 *                 value:
 *                   - id: "ckl1234567890abcdef"
 *                     email: "john@example.com"
 *                     name: "John Doe"
 *                     role: "user"
 *                     age: 25
 *                     emailVerified: false
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *                   - id: "ckl0987654321fedcba"
 *                     email: "jane@example.com"
 *                     name: "Jane Smith"
 *                     role: "admin"
 *                     age: 30
 *                     emailVerified: true
 *                     createdAt: "2024-01-10T08:00:00Z"
 *                     updatedAt: "2024-01-10T08:00:00Z"
 *               singleUser:
 *                 summary: User found by email
 *                 value:
 *                   - id: "ckl1234567890abcdef"
 *                     email: "john@example.com"
 *                     name: "John Doe"
 *                     role: "user"
 *                     age: 25
 *                     emailVerified: false
 *                     createdAt: "2024-01-15T10:30:00Z"
 *                     updatedAt: "2024-01-15T10:30:00Z"
 *               notFound:
 *                 summary: No users found
 *                 value: []
 */
userRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.query;

        if (email) {
            const user = await userService.getUserByEmail({ email: String(email) });
            res.status(200).json(user ? [user] : []);
        } else {
            const users = await userService.getAllUsers();
            res.status(200).json(users || []);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        // Return empty array instead of throwing error
        res.status(200).json([]);
    }
});

export { userRouter };
