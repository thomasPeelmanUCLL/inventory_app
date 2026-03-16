import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const main = async () => {
    // Clear existing data
    await prisma.user.deleteMany();
    await prisma.inventory.deleteMany();

    // Create users (using Better Auth compatible structure)
    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'linda',
                email: 'linda.lawson@ucll.be',
                role: 'admin',
                age: 23,
                emailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'john',
                email: 'john.doe@example.com',
                role: 'user',
                age: 28,
                emailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'max',
                email: 'max.mustermann@example.com',
                role: 'user',
                age: 35,
                emailVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'guest',
                email: 'guestuser@example.com',
                role: 'guest',
                age: 35,
                emailVerified: false,
            },
        }),
    ]);

    // Create account credentials for each user
    const passwords = ['lindas123', 'john123', 'max123', 'guest123'];
    for (let i = 0; i < users.length; i++) {
        const hashed = await bcrypt.hash(passwords[i], 12);
        await prisma.account.create({
            data: {
                userId: users[i].id,
                accountId: users[i].id,
                providerId: 'credential',
                password: hashed,
            },
        });
    }

    console.log('Seed data created:');
    console.log('Users:', users);

    // Create inventories
    const inventories = await Promise.all([
        prisma.inventory.create({
            data: {
                name: 'Inventory A',
                description: 'Description for Inventory A',
            },
        }),
        prisma.inventory.create({
            data: {
                name: 'Inventory B',
                description: 'Description for Inventory B',
            },
        }),
        prisma.inventory.create({
            data: {
                name: 'Inventory C',
                description: 'Description for Inventory C',
            },
        }),
    ]);
    console.log('Inventories:', inventories);

};

(async () => {
    try {
        await main();
        await prisma.$disconnect();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
})();
