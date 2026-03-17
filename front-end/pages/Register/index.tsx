import RegisterForm from '../../components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-800 py-12 px-4">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="text-center text-3xl font-extrabold text-white">
                        Create your account
                    </h2>
                </div>
                <RegisterForm />
                <div className="text-center">
                    <Link href="/Login" className="text-blue-400 hover:text-blue-300">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
