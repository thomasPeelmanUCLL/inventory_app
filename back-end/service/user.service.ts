import bcrypt from 'bcrypt';
import userDB from '../repository/user.db';
import { AuthenticationResponse, UserInput, LoginInput } from '../types';
import { generateJwtToken } from '../util/jwt';
import { User } from '../model/user';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllUsers = async (): Promise<User[]> => userDB.getAllUsers();

const getUserByName = async ({ name }: { name: string }): Promise<User> => {
    const user = await userDB.getUserByName({ name });
    if (!user) {
        throw new Error(`User with username: ${name} does not exist.`);
    }
    return user;
};

const getUserByEmail = async ({ email }: { email: string }): Promise<User> => {
    const user = await userDB.getUserByEmail({ email });
    if (!user) {
        throw new Error(`User with email: ${email} does not exist.`);
    }
    return user;
};

const authenticate = async ({ email, password }: UserInput): Promise<AuthenticationResponse> => {
    console.log('gets in authenticate with { email, password } :', { email, password });
    const user = await getUserByEmail({ email });
    const isValidPassword = await bcrypt.compare(password, user.getPassword());

    if (!isValidPassword) {
        throw new Error('Incorrect password.');
    }

    // Provide defaults for optional fields
    const role = user.getRole() || 'user';

    return {
        token: generateJwtToken({ email, role }),
        email: email,
        role: role,  // Now guaranteed to be a string
        username: user.getName(),
    };
};

const createUser = async ({ name, password, email, age, role }: UserInput): Promise<User> => {
    const existingUser = await userDB.getUserByEmail({ email });
    if (existingUser) {
        throw new Error(`User with username ${email} is already registered.`);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
        name,
        password: hashedPassword,
        email,
        age,  // Can be undefined
        role  // Can be undefined
    });
    return await userDB.createUser(user);
};

export default { getUserByName, authenticate, createUser, getAllUsers, getUserByEmail };
