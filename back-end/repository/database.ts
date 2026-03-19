import { PrismaClient } from '@prisma/client';

const database = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

// Test the database connection
database
    .$connect()
    .then(() => {
        console.log('Successfully connected to the database');
    })
    .catch((error) => {
        console.error('Failed to connect to the database:', error);
    });

export default database;
