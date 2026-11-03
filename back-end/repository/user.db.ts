import database from './database';
import { User } from '../model/user';

const getAllUsers = async (): Promise<User[]> => {
    const users = await database.user.findMany({ orderBy: { name: 'asc' } });
    return users.map(User.from);
};

const getUserById = async ({ id }: { id: string }): Promise<User | null> => {
    const user = await database.user.findUnique({ where: { id } });
    return user ? User.from(user) : null;
};

const getUserByName = async ({ name }: { name: string }): Promise<User | null> => {
    const user = await database.user.findFirst({ where: { name } });
    return user ? User.from(user) : null;
};

const getUserByEmail = async ({ email }: { email: string }): Promise<User | null> => {
    const user = await database.user.findUnique({ where: { email } });
    return user ? User.from(user) : null;
};

export default { getAllUsers, getUserById, getUserByName, getUserByEmail };
