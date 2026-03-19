import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSession } from '../lib/auth-client';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hasRecovered = () => sessionStorage.getItem('chunk-reload-attempted') === '1';
        const markRecovered = () => sessionStorage.setItem('chunk-reload-attempted', '1');

        const maybeRecover = (message: string) => {
            const lower = message.toLowerCase();
            if (
                lower.includes('loading chunk') ||
                lower.includes('chunkloaderror') ||
                lower.includes('failed to fetch dynamically imported module')
            ) {
                if (!hasRecovered()) {
                    markRecovered();
                    window.location.reload();
                }
            }
        };

        const onError = (event: ErrorEvent) => maybeRecover(event.message || '');
        const onUnhandled = (event: PromiseRejectionEvent) => {
            const reason = (event.reason as any)?.message || String(event.reason || '');
            maybeRecover(reason);
        };

        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onUnhandled);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onUnhandled);
        };
    }, []);

    const publicRoutes = ['/', '/login', '/register'];
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (isPending && !isPublicRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!session && !isPublicRoute) {
        if (typeof window !== 'undefined') {
            router.push('/login');
        }
        return null;
    }

    return <Component {...pageProps} />;
}
