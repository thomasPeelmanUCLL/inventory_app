import { Setup } from './setup';
import { User } from './user';

interface CommentPrisma {
    id: number;
    userId: number;
    setupId: number;
    content: string;
    createdAt: Date;
}

export class Comment {
    readonly id?: number;
    readonly userId: number; // Changed from user_id
    readonly setupId: number; // Changed from setup_id
    private content: string;
    private createdAt: Date;

    constructor(comment: {
        id?: number;
        userId: number;
        setupId: number;
        content: string;
        createdAt?: Date;
    }) {
        this.validate(comment);
        this.id = comment.id;
        this.userId = comment.userId;
        this.setupId = comment.setupId;
        this.content = comment.content;
        this.createdAt = comment.createdAt || new Date();
    }

    // GETTERS

    getCreatedAt(): Date {
        return this.createdAt;
    }

    /**
     * Returns the comment ID.
     * @returns {number} The comment ID.
     */
    public getId(): number | undefined {
        return this.id;
    }

    /**
     * Returns the setup ID.
     * @returns {number} The setup ID.
     */
    public getSetupID(): number {
        return this.setupId;
    }

    /**
     * Returns the user ID.
     * @returns {number} The user ID.
     */
    public getUserID(): number {
        return this.userId;
    }

    /**
     * Returns the content of the comment.
     * @returns {string} The content of the comment.
     */
    public getContent(): string {
        return this.content;
    }

    validate(comment: { id?: number; setupId: number; userId: number; content: string }) {
        if (!comment.content?.trim()) {
            throw new Error('Content is required');
        }
        if (!comment.setupId) {
            throw new Error('Setup ID is required');
        }
        if (!comment.userId) {
            throw new Error('User ID is required');
        }
    }

    // SETTERS

    /**
     * Sets the content of the comment.
     * @param {string} content - The new content of the comment.
     */
    public setContent(content: string): void {
        this.content = content;
    }

    equals(comment: Comment): boolean {
        return (
            this.id === comment.getId() &&
            this.setupId === comment.getSetupID() &&
            this.userId === comment.getUserID() &&
            this.content === comment.getContent()
        );
    }

    static from({ id, userId, setupId, content, createdAt }: CommentPrisma) {
        return new Comment({
            id,
            userId,
            setupId,
            content,
            createdAt,
        });
    }
}
