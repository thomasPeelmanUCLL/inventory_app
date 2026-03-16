import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useSession } from '../lib/auth-client';
import { AuthProvider } from '../components/AuthProvider';
import { ErrorBoundary } from '../components/ErrorHandling';
import '../styles/globals.css';

function AppContent({ Component, pageProps }: AppProps) {
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

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
