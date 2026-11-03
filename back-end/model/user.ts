import { User as UserPrisma } from '@prisma/client';
import { createError } from '../util/errors';

export type Role = 'admin' | 'user' | 'guest';

export class User {
    private id?: string;
    private name: string;
    private email: string;
    private role?: Role;
    private age?: number;

    constructor(user: { id?: string; email: string; name: string; age?: number; role?: Role }) {
        this.validate(user);
        this.id = user.id;
        this.name = user.name;
        this.email = user.email;
        this.age = user.age;
        this.role = user.role;
    }

    getId(): string {
        if (this.id === undefined) throw new Error('User ID is undefined');
        return this.id;
    }

    getName(): string {
        return this.name;
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

    private validate(user: { name: string; email: string }) {
        if (!user.name?.trim()) throw createError.badRequest('Username is required');
        if (!user.email?.trim()) throw createError.badRequest('Email is required');
    }

    equals(user: User): boolean {
        return (
            this.name === user.getName() &&
            this.email === user.getEmail() &&
            this.role === user.getRole() &&
            this.age === user.getAge()
        );
    }

    static from({ id, email, name, role, age }: UserPrisma): User {
        return new User({ id, email, name, role: (role as Role) || undefined, age: age ?? undefined });
    }
}
