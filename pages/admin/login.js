// pages/admin/login.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  // Clean up any existing sessions on component mount
  useEffect(() => {
    const cleanupSession = async () => {
      try {
        await signOut(auth);
        localStorage.clear(); // Clear all local storage
        console.log('Previous session cleaned up');
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
    cleanupSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('Starting fresh login process...');

    try {
      // Ensure clean state
      await signOut(auth);
      localStorage.clear();
      
      console.log('Attempting login with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login Successful:', userCredential.user.uid);
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('authenticationID', '==', userCredential.user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User document not found in Firestore');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Detailed logging
      console.log('Document ID:', userDoc.id);
      console.log('Full User Data:', JSON.stringify(userData, null, 2));
      console.log('User Email:', userData.email);
      console.log('SystemAdmin field:', userData.SystemAdmin);
      console.log('Available fields:', Object.keys(userData));

      setDebugInfo(`Found user document for email: ${userData.email}`);

      if (userData.email !== email) {
        throw new Error('Email mismatch in records');
      }

      if (userData.SystemAdmin === true) {
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', idToken);
        router.replace('/admin');
      } else {
        throw new Error('Not authorized as admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(`Login failed: ${error.message}`);
      setDebugInfo(`Login error details: ${error.message}`);
      // Clean up on error
      await signOut(auth);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {debugInfo && <p className="text-gray-500 text-xs mt-2 whitespace-pre-wrap">{debugInfo}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}