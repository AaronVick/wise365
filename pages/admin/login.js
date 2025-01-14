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
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [user, authLoading] = useAuthState(auth);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) return;
      console.log('Authenticated UID:', user.uid);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          console.error('User document not found in Firestore.');
          throw new Error('User not found.');
        }

        const userData = userDoc.data();
        console.log('User Data:', userData);

        if (userData.SystemAdmin === true) {
          const idToken = await user.getIdToken();
          localStorage.setItem('auth_token', idToken);
          router.replace('/admin');
        } else {
          console.error('User is not a SystemAdmin.');
          await auth.signOut();
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        console.error('Admin verification failed:', error.message);
        setError('Error verifying admin access. Please contact support.');
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login Successful:', userCredential.user.uid);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      console.log('Fetched Firestore Document:', userData);

      if (userData.SystemAdmin === true) {
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem('auth_token', idToken);
        router.replace('/admin');
      } else {
        throw new Error('Not authorized as admin');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
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
