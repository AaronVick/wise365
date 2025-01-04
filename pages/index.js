import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, setDoc, doc } from 'firebase/firestore';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@/lib/firebase'; // Updated import path for firebase setup

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

      console.log('User logged in:', user);

      // Sync the user with the backend (if needed)
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

      console.log('User registered:', user);

      // Sync the user with the backend (if needed)
      await syncUserWithBackend(user);

      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
    }
    setIsLoading(false);
  };

  // Sync user with the backend API (if needed)
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Your SaaS Platform</h1>
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
            with our powerful SaaS solution.
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

        {/* Right side - Auth Forms */}
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
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
                      <Input id="email" type="email" placeholder="name@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" required />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create an Account</CardTitle>
                  <CardDescription>
                    Enter your details to create a new account
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input id="register-email" type="email" placeholder="name@example.com" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input id="register-password" type="password" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input id="confirm-password" type="password" required />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-4 bg-white border-t">
        <div className="max-w-7xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 Your SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
