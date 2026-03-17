import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import database from "../repository/database";

export const auth = betterAuth({
    database: prismaAdapter(database, {
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
    },
    trustedOrigins: process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : ['http://localhost:8080', 'http://127.0.0.1:8080'],
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
