import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { signUp } from '../../lib/auth-client';

interface RegisterFormProps {
    onRegisterSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
    const router = useRouter();
    const [registrationForm, setRegistrationForm] = useState({ email: '', password: '', name: '' });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegistrationForm({ ...registrationForm, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            const result = await signUp.email({
                email: registrationForm.email,
                password: registrationForm.password,
                name: registrationForm.name,
            });
            if (result.error) {
                setErrorMessage(result.error.message || 'Registration failed. Please try again.');
                return;
            }
            setSuccessMessage('Registration successful! Redirecting to home...');
            setRegistrationForm({ email: '', password: '', name: '' });
            setTimeout(() => {
                if (onRegisterSuccess) onRegisterSuccess();
                router.push('/');
            }, 1500);
        } catch (registrationError: any) {
            setErrorMessage(
                registrationError.message || 'Failed to create user. Please try again.',
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && <p className="text-red-400 mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-400 mb-4">{successMessage}</p>}
            <div>
                <label className="block text-white font-medium mb-1">Email:</label>
                <input
                    type="email"
                    name="email"
                    value={registrationForm.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-white font-medium mb-1">Name:</label>
                <input
                    type="text"
                    name="name"
                    value={registrationForm.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-white font-medium mb-1">Password:</label>
                <input
                    type="password"
                    name="password"
                    value={registrationForm.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                />
            </div>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Creating account...' : 'Register'}
            </button>
        </form>
    );
};

export default RegisterForm;
