import { User } from '../../../model/user';

describe('User Class', () => {
    it('should create a user instance with valid data', () => {
        const user = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: 'password123',
            age: 25,
            role: 'admin',
        });

        expect(user.getName()).toBe('John Doe');
        expect(user.getEmail()).toBe('johndoe@example.com');
        expect(user.getRole()).toBe('admin');
    });

    it('should throw an error if name is empty', () => {
        expect(() => {
            new User({
                id: 1,
                name: '',
                email: 'johndoe@example.com',
                password: 'password123',
                age: 25,
                role: 'admin',
            });
        }).toThrow('Username is required');
    });

    it('should throw an error if email is empty', () => {
        expect(() => {
            new User({
                id: 1,
                name: 'John Doe',
                email: '',
                password: 'password123',
                age: 25,
                role: 'user',
            });
        }).toThrow('Email is required');
    });

    it('should compare two users correctly', () => {
        const user1 = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: 'password123',
            age: 25,
            role: 'admin',
        });

        const user2 = new User({
            id: 1,
            name: 'John Doe',
            email: 'johndoe@example.com',
            password: 'password123',
            age: 25,
            role: 'admin',
        });

        expect(user1.equals(user2)).toBe(true);
    });
});
