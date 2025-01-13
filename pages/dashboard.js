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
        console.log('No user found, redirecting to login...');
        router.replace('/login'); // Redirect unauthenticated users to login
      } else {
        console.log('Authenticated user:', user.uid);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading spinner while checking authentication
  }

  if (!user) {
    return null; // Avoid rendering dashboard if no user is logged in
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
