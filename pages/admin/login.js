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
    let isSubscribed = true;

    const checkAdminAccess = async () => {
      if (user) {
        console.log('Checking admin access for user:', user.uid);
    
        try {
          // Fetch user document
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
    
          if (!userDoc.exists()) {
            console.error('User document not found in Firestore.');
            throw new Error('User document missing.');
          }
    
          const userData = userDoc.data();
          console.log('Retrieved user data:', userData);
    
          // Validate SystemAdmin access
          if (userData.SystemAdmin === true) {
            const idToken = await user.getIdToken();
            console.log('Admin verified. Redirecting to admin dashboard.');
            localStorage.setItem('auth_token', idToken);
            router.replace('/admin');
          } else {
            console.error('User is not an admin.');
            throw new Error('Unauthorized access.');
          }
        } catch (error) {
          console.error('Admin access verification failed:', error);
          setError('Error verifying admin access. Please contact support.');
          await auth.signOut();
          localStorage.removeItem('auth_token');
        }
      }
    };
    

    if (!authLoading && user) {
      checkAdminAccess();
    }

    return () => {
      isSubscribed = false;
    };
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to sign in user:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User document not found in Firestore.');
      }

      const userData = userDoc.data();
      console.log('User data retrieved after login:', userData);

      if (userData.SystemAdmin === true) {
        const idToken = await userCredential.user.getIdToken();
        console.log('Admin access verified. Redirecting to admin page...');
        localStorage.setItem('auth_token', idToken);
        router.replace('/admin');
      } else {
        throw new Error('Not authorized as admin.');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessages = {
        'auth/invalid-email': 'Invalid email format.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Invalid password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
      };
      setError(errorMessages[error.code] || error.message || 'Unexpected error. Please try again.');
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                required
              />
            </label>
          </div>
          <button
            type="submit"
            className={`w-full py-2 px-4 text-white rounded-md ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
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

