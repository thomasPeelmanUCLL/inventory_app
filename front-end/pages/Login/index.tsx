import LoginForm from '../../components/auth/loginform';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Sign in to your account
                    </h2>
                </div>
                <LoginForm />
                <div className="text-center">
                    <Link href="/Register" className="text-blue-400 hover:text-blue-300">
                        Don&apos;t have an account? Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
