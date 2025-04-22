import { HardwareComponent, Image, User } from '@prisma/client';
import { Request as ExpressRequest } from 'express'; // Change the import to be more specific

type Role = 'admin' | 'user' | 'guest';

type UserInput = {
    id?: number; // Make id optional
    email: string;
    password: string;
    name: string;
    age: number;
    role: Role;
};

type ImageInput = {
    url: string;
    details: string;
};

type HardwareComponentInput = {
    name: string;
    details: string;
    price: number;
};

type SetupInput = {
    ownerId: number;
    details: string;
    hardwareComponentIds?: number[];
    imageIds?: number[];
};

type SetupUpdateInput = {
    id: number;
    details?: string;
    hardwareComponentIds?: number[];
    imageIds?: number[];
};

type SetupUpdateData = {
    details?: string;
    hardwareComponents?: number[];
    images?: number[];
};

type AuthRequest = ExpressRequest & {
    auth: {
        email: string;
        role: Role;
    };
};

type CommentInput = {
    content: string;
    setup_id: number;
    user_id: number;
};

export {
    AuthRequest,
    SetupUpdateData,
    ImageInput,
    Role,
    SetupInput,
    UserInput,
    CommentInput,
    HardwareComponentInput,
    SetupUpdateInput,
};

// testing phaze

type AuthenticationResponse = {
    token: string;
    email: string;
    role: string;
    username: string;
};

type LoginInput = {
    email: string;
    password: string;
};

export { AuthenticationResponse, LoginInput };
