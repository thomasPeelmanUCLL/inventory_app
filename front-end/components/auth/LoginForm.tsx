import { useRouter } from 'next/router';
import { useState } from 'react';
import { signIn } from '../../lib/auth-client';

interface LoginFormProps {
    className?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ className }) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
    const router = useRouter();

    const clearErrors = () => {
        setEmailError('');
        setPasswordError('');
        setStatusMessage(null);
    };

    const validate = (): boolean => {
        let isValid = true;
        if (!email.trim()) {
            setEmailError('Email is required');
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            setEmailError('Please enter a valid email address');
            isValid = false;
        }
        if (!password.trim()) {
            setPasswordError('Password is required');
            isValid = false;
        }
        return isValid;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        clearErrors();
        if (!validate()) return;
        await loginUser(email, password);
    };

    const handleGuestLogin = async () => {
        clearErrors();
        await loginUser('guest@example.com', 'guest123');
    };

    const loginUser = async (loginEmail: string, loginPassword: string) => {
        try {
            const result = await signIn.email({ email: loginEmail, password: loginPassword });
            if (result.error) {
                setStatusMessage({ message: result.error.message || 'Login failed. Please check your credentials.', type: 'error' });
                return;
            }
            setStatusMessage({ message: 'Login successful! Redirecting...', type: 'success' });
            setTimeout(() => { router.push('/'); }, 1500);
        } catch (error: any) {
            setStatusMessage({ message: error.message || 'An error occurred during login.', type: 'error' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
            {statusMessage && (
                <div className={`p-3 rounded ${
                    statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {statusMessage.message}
                </div>
            )}
            <div>
                <label className="block text-white font-medium mb-1">Email:</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your email"
                />
                {emailError && <p className="mt-1 text-red-400 text-sm">{emailError}</p>}
            </div>
            <div>
                <label className="block text-white font-medium mb-1">Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                />
                {passwordError && <p className="mt-1 text-red-400 text-sm">{passwordError}</p>}
            </div>
            <button
                type="submit"
                className="w-full bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
            >
                Login
            </button>
            <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full bg-gray-500 text-white font-semibold py-2 rounded-md hover:bg-gray-600 transition-colors duration-300"
            >
                Log in as Guest
            </button>
        </form>
    );
};

export default LoginForm;
