import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db, signInWithEmailAndPassword } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from "../components/ui/alert";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); 
  const [error, setError] = useState('');
  const router = useRouter();

  // Check for existing auth session
  useEffect(() => {
    console.log('Starting auth check...');
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          console.log('User found:', user);
          console.log('Fetching user document...');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            console.log('User document exists, redirecting...');
            router.push('/dashboard');
          } else {
            console.log('User document not found');
          }
        } else {
          console.log('No user found, redirecting to login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        console.log('Auth check complete');
        setIsAuthChecking(false);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    console.log('Starting login attempt...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Login successful for user:', user);

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.log('Creating new user document for', user.uid);
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: serverTimestamp(),
          uid: user.uid,
          role: 'user'
        });
      } else {
        console.log('User document already exists');
      }

      localStorage.setItem('userId', user.uid);
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      const errorMessages = {
        'auth/invalid-email': 'Invalid email format',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Invalid password',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/internal-error': 'Authentication service error. Please try again'
      };

      setError(errorMessages[error.code] || error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Rest of your component JSX... */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Business Wise365</h1>
          <Button variant="outline">Contact Us</Button>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          {/* Left Column - Value Proposition */}
          <div className="space-y-8">
            <h2 className="text-5xl font-bold leading-tight">
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

          {/* Right Column - Login Form */}
          <div className="w-full max-w-md">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
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
                      disabled={isLoading}
                    >
                      Create one
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Business Wise365. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
