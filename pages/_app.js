import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { DashboardProvider } from '../contexts/DashboardContext';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const inter = Inter({ subsets: ['latin'], fallback: ['sans-serif'] });

function ErrorFallback({ error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-6 bg-white rounded shadow-lg">
        <h2 className="text-lg font-semibold text-red-600">Something went wrong:</h2>
        <pre className="mt-2 text-sm text-gray-500">
          {error?.message || "An unexpected error occurred."}
        </pre>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem('auth_token');
      const isAdminRoute = router.pathname.startsWith('/admin');

      if (!authToken) {
        if (isAdminRoute) {
          router.push('/admin/login');
        } else {
          router.push('/');
        }
        return;
      }

      try {
        const response = await fetch('/api/verify-auth', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }
        setAuthChecked(true);
      } catch (error) {
        console.error('Authentication failed:', error);
        localStorage.removeItem('auth_token');
        router.push('/');
      }
    };

    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked, router.pathname]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => console.error("ErrorBoundary caught an error", error, info)}
    >
      <DashboardProvider>
        <main className={inter.className}>
          <Component {...pageProps} />
        </main>
      </DashboardProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
