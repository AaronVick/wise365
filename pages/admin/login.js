// pages/admin/login.js


import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState(''); // Add debug info state
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        console.log('No user found in checkAdminAccess');
        return;
      }
      
      console.log('Starting admin access check for UID:', user.uid);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        console.log('Attempting to fetch user document for UID:', user.uid);
        
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const errorMsg = `User document not found for UID: ${user.uid}`;
          console.error(errorMsg);
          setDebugInfo(errorMsg);
          throw new Error(errorMsg);
        }

        const userData = userDoc.data();
        console.log('User document data:', userData);
        console.log('SystemAdmin value:', userData.SystemAdmin);
        setDebugInfo(`User data retrieved. SystemAdmin status: ${userData.SystemAdmin}`);

        if (userData.SystemAdmin === true) {
          console.log('User verified as SystemAdmin');
          const idToken = await user.getIdToken();
          localStorage.setItem('auth_token', idToken);
          router.replace('/admin');
        } else {
          const errorMsg = `User ${user.uid} is not a SystemAdmin. SystemAdmin value: ${userData.SystemAdmin}`;
          console.error(errorMsg);
          setDebugInfo(errorMsg);
          await auth.signOut();
          localStorage.removeItem('auth_token');
          throw new Error('Not authorized as admin');
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        setError('Error verifying admin access. Please contact support.');
        setDebugInfo(`Error details: ${error.message}`);
        await auth.signOut();
        localStorage.removeItem('auth_token');
      }
    };

    if (!authLoading && user) {
      checkAdminAccess();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo('Starting login process...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login Successful:', userCredential.user.uid);
      setDebugInfo(`Authentication successful for UID: ${userCredential.user.uid}`);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      console.log('Fetching user document...');
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const errorMsg = 'User document not found in Firestore';
        setDebugInfo(errorMsg);
        throw new Error(errorMsg);
      }

      const userData = userDoc.data();
      console.log('User Data:', userData);
      setDebugInfo(`User data retrieved. SystemAdmin: ${userData.SystemAdmin}`);

      if (userData.SystemAdmin === true) {
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', idToken);
        router.replace('/admin');
      } else {
        throw new Error('Not authorized as admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials.');
      setDebugInfo(`Login error details: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {debugInfo && <p className="text-gray-500 text-xs mt-2">{debugInfo}</p>}
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