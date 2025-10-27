import userDB from '../repository/user.db';
import { User } from '../model/user';

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


export default {
    getUserByName,
    getUserByEmail,
    getAllUsers
};
