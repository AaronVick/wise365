import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data()); // Store user data in state
            console.log('User data fetched:', userDoc.data());
          } else {
            console.error('No user document found. Redirecting to login...');
            router.replace('/login');
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    };

    if (!loading && user) {
      fetchUserData();
    } else if (!loading && !user) {
      console.log('No user found, redirecting to login...');
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || isLoadingUserData) {
    return <div>Loading...</div>; // Show a loading spinner while fetching data
  }

  if (!user || !userData) {
    return null; // Avoid rendering the dashboard if user or user data is missing
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
      </header>
      <main className="p-6">
        <div className="bg-white p-4 rounded shadow">
          <h2>Welcome, {userData.name}!</h2>
          <p>Your role: {userData.role}</p>
          <p>User ID: {userData.userId}</p>
          <p>Authentication ID: {user.uid}</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
