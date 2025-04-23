import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const main = async () => {
    // Clear existing data
    await prisma.user.deleteMany();
    await prisma.inventory.deleteMany();

    // Create users
    const users = await Promise.all([
        prisma.user.create({
            data: {
                id: 1,
                password: await bcrypt.hash('lindas123', 12),
                name: 'linda',
                email: 'linda.lawson@ucll.be',
                role: 'admin',
                age: 23,
            },
        }),
        prisma.user.create({
            data: {
                id: 2,
                password: await bcrypt.hash('john123', 12),
                name: 'john',
                email: 'john.doe@example.com',
                role: 'user',
                age: 28,
            },
        }),
        prisma.user.create({
            data: {
                id: 3,
                password: await bcrypt.hash('max123', 12),
                name: 'max',
                email: 'max.mustermann@example.com',
                role: 'user',
                age: 35,
            },
        }),
        prisma.user.create({
            data: {
                password: await bcrypt.hash('guest123', 12),
                name: 'guest',
                email: 'guestuser@example.com',
                role: 'guest',
                age: 35,
            },
        }),
    ]);



    console.log('Seed data created:');
    console.log('Users:', users);

    // Create inventories
    const inventories = await Promise.all([
        prisma.inventory.create({
            data: {
                id: 1,
                name: 'Inventory A',
                description: 'Description for Inventory A',
            },
        }),
        prisma.inventory.create({
            data: {
                id: 2,
                name: 'Inventory B',
                description: 'Description for Inventory B',
            },
        }),
        prisma.inventory.create({
            data: {
                id: 3,
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
