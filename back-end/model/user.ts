// src/model/user.ts
import { User as UserPrisma } from '@prisma/client';
import { Role } from '../types';
// import bcrypt from 'bcryptjs';

export class User {
    private id?: number;
    private name: string;
    private email: string;
    private password: string;
    private role: Role;
    private age: number;

    constructor(user: {
        id?: number;
        email: string;
        password: string;
        name: string;
        age: number;
        role: Role;
    }) {
        this.validate(user);

        this.id = user.id || 0;
        this.name = user.name;
        this.email = user.email;
        this.password = user.password;
        this.age = user.age;
        this.role = user.role;
    }

    // In User class
    getId(): number {
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

    getAge(): number {
        return this.age;
    }

    getRole(): Role {
        return this.role;
    }

    validate(user: {
        id?: number;
        name: string;
        email: string;
        password: string;
        role: Role;
        age: number;
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
        if (!user.role) {
            throw new Error('Role is required');
        }
        if (!user.age) {
            throw new Error('Age is required');
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

    static from({ id, email, password, name, role, age }: UserPrisma): User {
        return new User({
            id,
            email,
            password,
            name,
            role: role as Role,
            age,
        });
    }
}
