import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const main = async () => {
    // Clear existing data
    await prisma.comment.deleteMany();
    await prisma.setup.deleteMany();
    await prisma.image.deleteMany();
    await prisma.hardwareComponent.deleteMany();
    await prisma.user.deleteMany();

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

    // Create hardware components with more realistic specs and prices
    const hardwareComponents = await Promise.all([
        prisma.hardwareComponent.create({
            data: {
                id: 1,
                name: 'NVIDIA GeForce RTX 4090',
                details: 'NVIDIA Ada Lovelace architecture, 24GB GDDR6X, Ray Tracing',
                price: 1599.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 2,
                name: 'AMD Ryzen 9 7950X',
                details: '16-core, 32-thread, up to 5.7GHz boost',
                price: 699.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 3,
                name: 'Corsair Dominator Platinum RGB 32GB',
                details: 'DDR5-6200MHz CL36 Memory Kit',
                price: 219.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 4,
                name: 'Samsung 990 PRO 2TB',
                details: 'PCIe 4.0 NVMe SSD, 7,450MB/s Read',
                price: 249.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 5,
                name: 'Lian Li O11 Dynamic EVO',
                details: 'Premium ATX case with tempered glass panels',
                price: 169.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 6,
                name: 'ASUS ROG SWIFT PG32UQX',
                details: '32" 4K HDR 144Hz Gaming Monitor',
                price: 2999.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 7,
                name: 'Logitech G Pro X Superlight',
                details: 'Wireless Gaming Mouse, 63g Ultra-lightweight',
                price: 159.99,
            },
        }),
        prisma.hardwareComponent.create({
            data: {
                id: 8,
                name: 'Custom Water Cooling Loop',
                details: 'EK Water Blocks Premium Custom Loop',
                price: 899.99,
            },
        }),
    ]);

    // Create images with actual setup photos
    const images = await Promise.all([
        prisma.image.create({
            data: {
                id: 1,
                url: 'https://dlcdnwebimgs.asus.com/gain/37A21D4D-29F3-4374-AC70-27917436F12F/w1000/h732',
                details: 'ROG Gaming Setup with RGB',
            },
        }),
        prisma.image.create({
            data: {
                id: 2,
                url: 'https://www.corsair.com/corsairmedia/sys_master/productcontent/Setup_2.png',
                details: 'Corsair Streaming Setup',
            },
        }),
        prisma.image.create({
            data: {
                id: 3,
                url: 'https://cdn.shopify.com/s/files/1/0153/8863/files/Workspace-Headphone-Setup-Desktop-Gaming-Setup.jpg',
                details: 'Minimalist Audiophile Gaming Setup',
            },
        }),
        prisma.image.create({
            data: {
                id: 4,
                url: 'https://cdn.autonomous.ai/static/upload/images/common/upload/20201013/4689bfe53d4.jpg',
                details: 'Professional Developer Workstation',
            },
        }),
        prisma.image.create({
            data: {
                id: 5,
                url: 'https://i.pinimg.com/originals/81/d3/8f/81d38f4b4bb23c663c1e85fb5f82c732.jpg',
                details: 'White & Clean Setup',
            },
        }),
        prisma.image.create({
            data: {
                id: 6,
                url: 'https://cdn.shopify.com/s/files/1/0153/8863/files/Workspace-Headphone-Setup-Desktop-Gaming-Setup-2.jpg',
                details: 'Productivity Focused Setup',
            },
        }),
    ]);

    // Create setups with detailed descriptions and component connections

    const setups = await Promise.all([
        prisma.setup.create({
            data: {
                id: 1,
                details: `Ultimate RGB Gaming Paradise
            // ... (rest of the details)`,
                lastUpdated: new Date(),
                ownerId: users[0].id,
                images: {
                    connect: [{ id: images[0].id }],
                },
                hardwareComponents: {
                    connect: hardwareComponents.slice(0, 4).map((comp) => ({
                        id: comp.id,
                    })),
                },
                comments: {
                    create: [
                        {
                            content: 'Incredible build! Those temps with the custom loop?',
                            userId: users[1].id,
                            createdAt: new Date('2023-01-15T10:00:00Z'),
                        },
                        {
                            content: 'GPU never exceeds 55°C under full load!',
                            userId: users[0].id,
                            createdAt: new Date('2023-01-15T11:30:00Z'),
                        },
                    ],
                },
            },
        }),
        prisma.setup.create({
            data: {
                id: 2,
                details: `Professional Content Creator Studio
            // ... (rest of the details)`,
                lastUpdated: new Date(),
                ownerId: users[1].id,
                images: {
                    connect: [{ id: images[1].id }],
                },
                hardwareComponents: {
                    connect: hardwareComponents.slice(2, 6).map((comp) => ({
                        id: comp.id,
                    })),
                },
                comments: {
                    create: [
                        {
                            content: 'Amazing editing station! Render times must be incredible.',
                            userId: users[0].id,
                            createdAt: new Date('2023-01-16T09:00:00Z'),
                        },
                        {
                            content: '4K exports are now real-time with CUDA acceleration!',
                            userId: users[1].id,
                            createdAt: new Date('2023-01-16T09:45:00Z'),
                        },
                    ],
                },
            },
        }),
        prisma.setup.create({
            data: {
                id: 3,
                details: `Minimalist Productivity Haven
            // ... (rest of the details)`,
                lastUpdated: new Date(),
                ownerId: users[0].id,
                images: {
                    connect: [{ id: images[4].id }],
                },
                hardwareComponents: {
                    connect: hardwareComponents.slice(4, 7).map((comp) => ({
                        id: comp.id,
                    })),
                },
                comments: {
                    create: [
                        {
                            content: 'The cable management is incredible! So clean!',
                            userId: users[1].id,
                            createdAt: new Date('2023-01-20T11:00:00Z'),
                        },
                    ],
                },
            },
        }),
        prisma.setup.create({
            data: {
                id: 4,
                details: `Developer's Command Center
            // ... (rest of the details)`,
                lastUpdated: new Date(),
                ownerId: users[2].id,
                images: {
                    connect: [{ id: images[3].id }],
                },
                hardwareComponents: {
                    connect: hardwareComponents.slice(1, 5).map((comp) => ({
                        id: comp.id,
                    })),
                },
                comments: {
                    create: [
                        {
                            content:
                                "'Impressive dev environment! How's the K8s cluster performing?'",
                            userId: users[0].id,
                            createdAt: new Date('2023-01-25T09:30:00Z'),
                        },
                        {
                            content:
                                'Running like a dream with the new CPU. CI/CD is lightning fast!',
                            userId: users[2].id,
                            createdAt: new Date('2023-01-25T10:00:00Z'),
                        },
                    ],
                },
            },
        }),
    ]);

    console.log('Seed data created:');
    console.log('Users:', users);
    console.log('Hardware Components:', hardwareComponents);
    console.log('Images:', images);
    console.log('Setups:', setups);
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
