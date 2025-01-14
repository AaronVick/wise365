// pages/_app.js

import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { DashboardProvider } from '../contexts/DashboardContext';
import { ErrorBoundary } from 'react-error-boundary';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

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

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const isPublicRoute = router.pathname === '/' || router.pathname === '/admin/login' || router.pathname === '/register';
    
    if (!loading) {
      if (!user && !isPublicRoute) {
        const isAdminRoute = router.pathname.startsWith('/admin');
        router.replace(isAdminRoute ? '/admin/login' : '/');
      }
      setAuthChecked(true);
    }
  }, [user, loading, router.pathname]);

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
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