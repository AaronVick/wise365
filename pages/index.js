// pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '@/lib/firebase';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          router.push('/dashboard');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const email = e.target.email.value;
      const password = e.target.password.value;

      // Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          name: user.displayName || email.split('@')[0], // Use email prefix if no display name
          createdAt: serverTimestamp(),
          uid: user.uid,
          teamId: null,
          role: 'user',
          profilePicture: user.photoURL || null
        });
      }

      // Store user ID in localStorage for persistence
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', user.email);

      // Navigate to dashboard
      router.push({
        pathname: '/dashboard',
        query: { uid: user.uid }
      });

    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.code === 'auth/user-not-found' ? 'User not found' :
        error.code === 'auth/wrong-password' ? 'Invalid password' :
        error.code === 'auth/too-many-requests' ? 'Too many login attempts. Please try again later.' :
        'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Sync user with the backend API
  const syncUserWithBackend = async (user) => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/v1/public/get-user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to sync user with backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing user with backend:', error);
      // Continue anyway as this is not critical
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Business Wise365</h1>
          <Button variant="ghost">Contact Us</Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 p-4 md:p-8">
        {/* Left side - Value Proposition */}
        <div className="max-w-xl space-y-6">
          <h2 className="text-4xl font-bold text-gray-900">
            Transform Your Business with Our Platform
          </h2>
          <p className="text-xl text-gray-600">
            Streamline your workflow, boost productivity, and scale your operations
            with our powerful AI-driven team solution.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    required 
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
                <div className="text-sm text-gray-500 text-center">
                  Don't have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => router.push('/register')}
                  >
                    Create one
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-white border-t">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 Business Wise365. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;