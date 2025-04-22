// src/controller/comment.router.ts
import express, { NextFunction, Request, Response } from 'express';
import commentService from '../service/comment.service';
import userService from '../service/user.service';
import jwt from 'jsonwebtoken';
import { Role, AuthRequest } from '../types';

const commentRouter = express.Router();

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        const auth = jwt.verify(token, process.env.JWT_SECRET!) as { email: string; role: Role };
        (req as AuthRequest).auth = auth;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

/**
 * @swagger
 * /comments:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all comments
 *     responses:
 *       200:
 *         description: List of all comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
commentRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const comments = await commentService.getAllComments();
        res.status(200).json(comments);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get comment by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: The comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 */
commentRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const comment = await commentService.getCommentById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.status(200).json(comment);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /comments:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               setupId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       404:
 *         description: User or Setup not found
 */
commentRouter.post(
    '/',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const { content, setupId } = req.body;
            const comment = await commentService.createComment({
                content,
                setup_id: setupId,
                user_id: user.getId(),
            });

            res.status(201).json(comment);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment or User not found
 */
commentRouter.put(
    '/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { email, role } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const comment = await commentService.getCommentById(id);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            if (comment.getUserID() !== user.getId() && role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this comment' });
            }

            const updatedComment = await commentService.updateComment(id, req.body.content);
            res.status(200).json(updatedComment);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a comment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         description: Comment deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment or User not found
 */
commentRouter.delete(
    '/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { email, role } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const comment = await commentService.getCommentById(id);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            if (comment.getUserID() !== user.getId() && role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this comment' });
            }

            await commentService.deleteComment(id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

export { commentRouter };
