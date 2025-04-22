// src/repository/comment.db.ts
import database from './database';
import { Comment } from '../model/comment';

const getAllComments = async (): Promise<Comment[]> => {
    try {
        const comments = await database.comment.findMany({
            include: {
                user: true,
                setup: true,
            },
        });
        return comments.map(Comment.from);
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error fetching comments');
    }
};

const getCommentByEmail = async (email: string): Promise<Comment[]> => {
    try {
        const comments = await database.comment.findMany({
            where: { user: { email } },
            include: {
                user: true,
                setup: true,
            },
        });
        return comments.map(Comment.from);
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error fetching comments');
    }
};

const getCommentById = async (id: number): Promise<Comment | null> => {
    try {
        const comment = await database.comment.findUnique({
            where: { id },
            include: {
                user: true,
                setup: true,
            },
        });
        return comment ? Comment.from(comment) : null;
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error fetching comment');
    }
};

const createComment = async (comment: {
    userId: number;
    setupId: number;
    content: string;
}): Promise<Comment> => {
    try {
        const newComment = await database.comment.create({
            data: comment,
            include: {
                user: true,
                setup: true,
            },
        });
        return Comment.from(newComment);
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error creating comment');
    }
};

const updateComment = async (id: number, content: string): Promise<Comment | null> => {
    try {
        const updatedComment = await database.comment.update({
            where: { id },
            data: { content },
            include: {
                user: true,
                setup: true,
            },
        });
        return Comment.from(updatedComment);
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error updating comment');
    }
};

const deleteComment = async (id: number): Promise<void> => {
    try {
        await database.comment.delete({
            where: { id },
        });
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error deleting comment');
    }
};

const getCommentBySetupAndUser = async ({
    setupId,
    userId,
}: {
    setupId: number;
    userId: number;
}): Promise<Comment | null> => {
    try {
        const comment = await database.comment.findFirst({
            where: { setupId, userId },
            include: {
                user: true,
                setup: true,
            },
        });
        return comment ? Comment.from(comment) : null;
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Error fetching comment');
    }
};

export default {
    getAllComments,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
    getCommentByEmail,
    getCommentBySetupAndUser,
};
