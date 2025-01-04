import { useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../lib/firebase';

const IndexPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Sync user with the backend API
  const syncUserWithBackend = async (user) => {
    try {
      const token = await user.getIdToken(); // Fetch Firebase token
      await fetch('/api/v1/public/get-user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`, // Pass token to backend
        },
      });
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Sync the user with the backend
      await syncUserWithBackend(user);

      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  // Handle user registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const email = e.target['register-email'].value;
      const password = e.target['register-password'].value;
      const confirmPassword = e.target['confirm-password'].value;

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const db = getFirestore();

      // Initialize user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        uid: user.uid,
        role: 'user',
        createdAt: new Date().toISOString(),
      });

      // Add a default team for the user
      await setDoc(doc(db, 'teams', `team-${user.uid}`), {
        name: 'Default Team',
        teamLeader: user.uid,
        createdAt: new Date().toISOString(),
      });

      // Sync the user with the backend
      await syncUserWithBackend(user);

      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div>
      <h1>Welcome</h1>

      {/* Login Form */}
      <form onSubmit={handleLogin}>
        <h2>Login</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <label htmlFor="email">Email:</label>
        <input type="email" name="email" required />
        <label htmlFor="password">Password:</label>
        <input type="password" name="password" required />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {/* Registration Form */}
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <label htmlFor="register-email">Email:</label>
        <input type="email" name="register-email" required />
        <label htmlFor="register-password">Password:</label>
        <input type="password" name="register-password" required />
        <label htmlFor="confirm-password">Confirm Password:</label>
        <input type="password" name="confirm-password" required />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default IndexPage;
