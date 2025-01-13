// pages/_app.js
import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { DashboardProvider } from '../contexts/DashboardContext';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect } from 'react';
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

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = localStorage.getItem('auth_token');
      const isAdminRoute = router.pathname.startsWith('/admin');
      
      if (!authToken) {
        // If it's an admin route, redirect to admin login
        if (isAdminRoute) {
          router.push('/admin/login');
        } else {
          // For regular routes, redirect to main login
          router.push('/');
        }
        return;
      }

      // If we have a token and it's an admin route, verify admin status
      if (isAdminRoute) {
        try {
          const response = await fetch('/api/verify-admin', {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          });
          
          if (!response.ok) {
            // If not admin, redirect to dashboard
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error verifying admin status:', error);
          router.push('/dashboard');
        }
      }
    };

    checkAuth();
  }, [router.pathname]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("ErrorBoundary caught an error", error, info);
      }}
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