import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';

const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login'); // Redirect unauthenticated users to login
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner while checking authentication
  }

  if (!user) {
    return null; // Prevent rendering the dashboard until authentication is confirmed
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </header>
      <main className="p-6">
        <div className="bg-white p-4 rounded shadow">
          <h2>Welcome to your Dashboard</h2>
          <p>This is a placeholder for the dashboard content.</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
