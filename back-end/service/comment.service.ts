import commentDB from '../repository/comments.db';
import { Comment } from '../model/comment';
import { CommentInput, Role, SetupInput, UserInput } from '../types';
import setupDb from '../repository/setup.db';
import userDb from '../repository/user.db';
import { UnauthorizedError } from 'express-jwt';

const getAllComments = async (): Promise<Comment[]> => {
    const comments = await commentDB.getAllComments();
    return comments;
};

const getComment = async ({ email, role }: { email: string; role: Role }): Promise<Comment[]> => {
    if (role === 'admin') {
        return commentDB.getAllComments();
    } else if (role === 'user') {
        return commentDB.getCommentByEmail(email);
    } else {
        throw new UnauthorizedError('credentials_required', {
            message: 'you are not authorized to view this comment',
        });
    }
};

const getCommentById = async (id: number): Promise<Comment | null> => {
    return await commentDB.getCommentById(id);
};

const createComment = async ({ content, setup_id, user_id }: CommentInput): Promise<Comment> => {
    const setup = await setupDb.getSetupById({ id: setup_id });
    const user = await userDb.getUserById({ id: user_id });
    if (!setup) {
        throw new Error('Setup not found');
    }
    if (!user) {
        throw new Error('User not found');
    }
    const setupId = setup.getId();
    if (setupId === undefined) {
        throw new Error('Setup ID is undefined');
    }
    const userId = user.getId();
    if (userId === undefined) {
        throw new Error('User ID is undefined');
    }

    const commentData = { content, setupId, userId };
    return await commentDB.createComment(commentData);
};

const updateComment = async (id: number, content: string): Promise<Comment | null> => {
    const comment = await commentDB.getCommentById(id);
    if (!comment) {
        throw new Error('Comment not found');
    }

    return await commentDB.updateComment(id, content);
};

const deleteComment = async (id: number): Promise<void> => {
    const comment = await commentDB.getCommentById(id);
    if (!comment) {
        throw new Error('Comment not found');
    }

    await commentDB.deleteComment(id);
};

export default {
    getAllComments,
    getComment,
    getCommentById,
    createComment,
    updateComment,
    deleteComment,
};
