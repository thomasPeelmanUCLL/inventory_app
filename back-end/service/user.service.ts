import userDB from '../repository/user.db';
import { User } from '../model/user';
import { createError } from '../util/errors';

const orNotFound = (user: User | null): User => {
    if (!user) throw createError.notFound('User not found');
    return user;
};

export default {
    getAllUsers: () => userDB.getAllUsers(),
    getUserById: async ({ id }: { id: string }) => orNotFound(await userDB.getUserById({ id })),
    getUserByName: async ({ name }: { name: string }) => orNotFound(await userDB.getUserByName({ name })),
    getUserByEmail: async ({ email }: { email: string }) => orNotFound(await userDB.getUserByEmail({ email })),
};
