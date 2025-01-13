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
    const authToken = localStorage.getItem('auth_token'); // Replace with your token key

    if (!authToken) {
      // Redirect to the login page if the user is not authenticated
      router.push('/login'); // Adjust to match your login route
    }
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("ErrorBoundary caught an error", error, info);
        // Add external logging service here if needed (e.g., Sentry)
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
