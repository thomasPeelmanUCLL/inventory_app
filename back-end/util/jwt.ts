import jwt from 'jsonwebtoken';
import { Role } from '../types';

const generateJwtToken = ({ email, role }: { email: string; role: Role }): string => {
    console.log('JWT_SECRET:', process.env.JWT_SECRET); // Debugging
    console.log('JWT_EXPIRES_HOURS:', process.env.JWT_EXPIRES_HOURS); // Debugging

    const expiresIn = process.env.JWT_EXPIRES_HOURS
        ? `${process.env.JWT_EXPIRES_HOURS}h`
        : '1h'; // Default to 1 hour if not set

    const options = {
        expiresIn,
        issuer: 'http://localhost:3000',
    };

    try {
        return jwt.sign({ email, role }, process.env.JWT_SECRET!, options);
    } catch (error) {
        console.log(error);
        throw new Error('Error generating JWT token, see server log for details.');
    }
};

export { generateJwtToken };
