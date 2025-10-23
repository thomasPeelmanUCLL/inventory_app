import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useSession } from '../lib/auth-client';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const publicRoutes = ['/Login', '/Register'];
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
      router.push('/Login');
    }
    return null;
  }

  return <Component {...pageProps} />;
}
