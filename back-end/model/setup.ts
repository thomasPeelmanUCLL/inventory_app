import { User } from './user';
import { Image } from './image';
import { Comment } from './comment';
import { HardwareComponent } from './hardwareComponent';

// Import Prisma models
import {
    User as UserPrisma,
    HardwareComponent as HardwareComponentPrisma,
    Image as ImagesPrisma,
    Comment as CommentPrisma,
    Setup as SetupPrisma,
} from '@prisma/client';

interface SetupConstructorParams {
    id?: number;
    ownerId: number;
    owner: User;
    hardwareComponents?: HardwareComponent[];
    images?: Image[];
    details: string;
    lastUpdated: Date;
    comments?: Comment[];
}

export class Setup {
    private id?: number;
    private owner: User;
    private hardwareComponents: HardwareComponent[];
    private images: Image[];
    private details: string;
    private lastUpdated: Date;
    private comments: Comment[];

    constructor(setup: SetupConstructorParams) {
        this.validate(setup);
        this.id = setup.id;
        this.owner = setup.owner;
        this.details = setup.details;
        this.lastUpdated = new Date(setup.lastUpdated);
        this.hardwareComponents = setup.hardwareComponents ?? [];
        this.images = setup.images ?? [];
        this.comments = setup.comments ?? [];
    }

    static from(
        prismaSetup: SetupPrisma & {
            owner: UserPrisma;
            hardwareComponents: HardwareComponentPrisma[];
            images: ImagesPrisma[];
            comments: CommentPrisma[];
        }
    ): Setup {
        return new Setup({
            id: prismaSetup.id,
            ownerId: prismaSetup.ownerId,
            owner: User.from(prismaSetup.owner),
            hardwareComponents: prismaSetup.hardwareComponents.map(HardwareComponent.from),
            images: prismaSetup.images.map(Image.from),
            details: prismaSetup.details,
            lastUpdated: prismaSetup.lastUpdated,
            comments: prismaSetup.comments.map(Comment.from),
        });
    }

    private validate(setup: SetupConstructorParams): void {
        if (setup.id !== undefined && setup.id < 0) {
            throw new Error('Setup ID must be a non-negative number');
        }

        if (!setup.owner) {
            throw new Error('Owner is required');
        }

        if (typeof setup.ownerId !== 'number' || setup.ownerId <= 0) {
            throw new Error('Setup ownerId must be a positive number');
        }

        if (!setup.details || setup.details.trim() === '') {
            throw new Error('Details cannot be empty');
        }

        if (!setup.lastUpdated) {
            throw new Error('Last updated date is required');
        }

        if (setup.lastUpdated.getTime() > Date.now()) {
            throw new Error('Last updated date must not be in the future');
        }

        if (setup.hardwareComponents && !Array.isArray(setup.hardwareComponents)) {
            throw new Error('Hardware components must be an array');
        }

        if (setup.images && !Array.isArray(setup.images)) {
            throw new Error('Images must be an array');
        }

        if (setup.comments && !Array.isArray(setup.comments)) {
            throw new Error('Comments must be an array');
        }
    }

    // Getters
    getId(): number {
        if (this.id === undefined) {
            throw new Error('ID is undefined');
        }
        return this.id;
    }
    // In User class

    getOwnerId(): number {
        const ownerId = this.owner.getId();
        if (ownerId === undefined) {
            throw new Error('Owner ID is undefined');
        }
        return ownerId;
    }

    getOwner(): User {
        return this.owner;
    }

    getHardwareComponents(): HardwareComponent[] {
        return [...this.hardwareComponents];
    }

    getImages(): Image[] {
        return [...this.images];
    }

    getDetails(): string {
        return this.details;
    }

    getLastUpdated(): Date {
        return new Date(this.lastUpdated);
    }

    getComments(): Comment[] {
        return [...this.comments];
    }

    getTotalPrice(): number {
        return this.hardwareComponents.reduce(
            (total, component) => total + component.getPrice(),
            0
        );
    }

    // Setters and Modifiers
    setDetails(details: string): void {
        if (!details || details.trim() === '') {
            throw new Error('Details cannot be empty');
        }
        this.details = details;
        this.updateLastModified();
    }

    addHardwareComponent(hardwareComponent: HardwareComponent): void {
        if (this.hardwareComponents.some((comp) => comp.getId() === hardwareComponent.getId())) {
            throw new Error('Hardware component already exists in the setup');
        }
        this.hardwareComponents.push(hardwareComponent);
        this.updateLastModified();
    }

    removeHardwareComponent(componentId: number): void {
        const initialLength = this.hardwareComponents.length;
        this.hardwareComponents = this.hardwareComponents.filter(
            (comp) => comp.getId() !== componentId
        );
        if (this.hardwareComponents.length === initialLength) {
            throw new Error('Hardware component not found in the setup');
        }
        this.updateLastModified();
    }

    addImage(image: Image): void {
        if (this.images.some((img) => img.getId() === image.getId())) {
            throw new Error('Image already exists in the setup');
        }
        this.images.push(image);
        this.updateLastModified();
    }

    removeImage(imageId: number): void {
        const initialLength = this.images.length;
        this.images = this.images.filter((img) => img.getId() !== imageId);
        if (this.images.length === initialLength) {
            throw new Error('Image not found in the setup');
        }
        this.updateLastModified();
    }

    addComment(comment: Comment): void {
        if (this.comments.some((c) => c.getId() === comment.getId())) {
            throw new Error('Comment already exists in the setup');
        }
        this.comments.push(comment);
        this.updateLastModified();
    }

    removeComment(commentId: number): void {
        const initialLength = this.comments.length;
        this.comments = this.comments.filter((comment) => comment.getId() !== commentId);
        if (this.comments.length === initialLength) {
            throw new Error('Comment not found in the setup');
        }
        this.updateLastModified();
    }

    private updateLastModified(): void {
        this.lastUpdated = new Date();
    }

    // Optional: Method to convert to Prisma format
    toPrisma(): Partial<SetupPrisma> {
        return {
            id: this.id,
            ownerId: this.getOwnerId(),
            details: this.details,
            lastUpdated: this.lastUpdated,
        };
    }
}
