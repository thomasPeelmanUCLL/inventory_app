import { User as UserPrisma } from '@prisma/client';
import { Role } from '../types';

export class User {
    private id?: string;
    private name: string;
    private email: string;
    private password: string;  // Still keep for internal use in old routes
    private role?: Role;
    private age?: number;

    constructor(user: {
        id?: string;
        email: string;
        password: string;
        name: string;
        age?: number;
        role?: Role;
    }) {
        this.validate(user);
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.password = user.password;
        this.age = user.age;
        this.role = user.role;
    }

    getId(): string {
        if (this.id === undefined) {
            throw new Error('User ID is undefined');
        }
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getPassword(): string {
        return this.password;
    }

    getEmail(): string {
        return this.email;
    }

    getAge(): number | undefined {
        return this.age;
    }

    getRole(): Role | undefined {
        return this.role;
    }

    validate(user: {
        id?: string;
        name: string;
        email: string;
        password: string;
        role?: Role;
        age?: number;
    }) {
        if (!user.name?.trim()) {
            throw new Error('Username is required');
        }
        if (!user.email?.trim()) {
            throw new Error('Email is required');
        }
        if (!user.password?.trim()) {
            throw new Error('Password is required');
        }
    }

    equals(user: User): boolean {
        return (
            this.name === user.getName() &&
            this.email === user.getEmail() &&
            this.password === user.getPassword() &&
            this.role === user.getRole() &&
            this.age === user.getAge()
        );
    }

    // FIXED: Removed password from destructuring
    static from({ id, email, name, role, age }: UserPrisma): User {
        return new User({
            id,
            email,
            password: '', // Dummy password since it's in Account table
            name,
            role: role ? (role as Role) : undefined,
            age: age ?? undefined,
        });
    }
}
