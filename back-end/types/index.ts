import { User } from '@prisma/client';
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

type InventoryInput = {
    id?: number; // Make id optional
    name: string;
    description: string;
};

type AuthRequest = ExpressRequest & {
    auth: {
        email: string;
        role: Role;
    };
};

export { AuthRequest, Role, UserInput };

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

export { AuthenticationResponse, LoginInput, InventoryInput };
