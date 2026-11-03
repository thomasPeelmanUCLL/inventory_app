import { PrismaClient } from '@prisma/client';

// The one Prisma client (and connection pool) for the whole app. Query logging only in development.
const database = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
});

database
    .$connect()
    .then(() => console.log('Successfully connected to the database'))
    .catch((error) => console.error('Failed to connect to the database:', error));

export default database;
