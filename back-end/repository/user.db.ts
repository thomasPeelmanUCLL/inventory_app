import { PrismaClient } from '@prisma/client';
import { User } from '../model/user';

const prisma = new PrismaClient();

const getAllUsers = async (): Promise<User[]> => {
    const users = await prisma.user.findMany();
    return users.map((user) => User.from(user));
};

const getUserById = async ({ id }: { id: string }): Promise<User | null> => {
    const userPrisma = await prisma.user.findUnique({
        where: { id },
    });
    return userPrisma ? User.from(userPrisma) : null;
};

const getUserByName = async ({ name }: { name: string }): Promise<User | null> => {
    const userPrisma = await prisma.user.findFirst({
        where: { name },
    });
    return userPrisma ? User.from(userPrisma) : null;
};

const getUserByEmail = async ({ email }: { email: string }): Promise<User | null> => {
    const userPrisma = await prisma.user.findUnique({
        where: { email },
    });
    return userPrisma ? User.from(userPrisma) : null;
};

const createUser = async (user: User): Promise<User> => {
    const userPrisma = await prisma.user.create({
        data: {
            name: user.getName(),
            // REMOVED password - it's stored in Account table by Better Auth
            email: user.getEmail(),
            age: user.getAge() || 0,
            role: user.getRole() || 'user',
        },
    });
    return User.from(userPrisma);
};

export default {
    getAllUsers,
    getUserById,
    getUserByName,
    getUserByEmail,
    createUser,
};
