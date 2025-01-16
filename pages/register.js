// pages/register.js

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from "../components/ui/alert";

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const name = e.target.name.value.trim();

    try {
      // 1. Create Firebase auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create a new team document
      const teamsRef = collection(db, 'teams');
      const teamDoc = doc(teamsRef);
      const teamData = {
        teamId: teamDoc.id,
        name: `${name}'s Team`, // Default team name
        members: [user.uid],
        createdAt: serverTimestamp(),
        subscriptionStatus: 'free', // Default status
      };

      // 3. Create user document with team reference
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        email,
        name,
        uid: user.uid,
        role: 'teamAdmin', // Since they're the first user of the team
        createdAt: serverTimestamp(),
        theme: 'light',
        teamId: teamDoc.id,
        profilePicture: '', // Add empty string as default
      };

      // 4. Write both documents to Firestore
      await Promise.all([
        setDoc(teamDoc, teamData),
        setDoc(userDocRef, userData)
      ]);

      // 5. Store essential info
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('teamId', teamDoc.id);

      console.log('Registration complete with team creation');
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email format',
        'auth/operation-not-allowed': 'Email/password registration is not enabled',
        'auth/weak-password': 'Password must be at least 6 characters long',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/internal-error': 'Registration service error. Please try again'
      };

      setError(errorMessages[error.code] || error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Business Wise365</h1>
          <Button variant="outline">Contact Us</Button>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Create an Account</CardTitle>
              <CardDescription>
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a secure password"
                    required
                    className="h-11"
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
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <div className="text-sm text-gray-500 text-center">
                  Already have an account?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-normal"
                    onClick={() => router.push('/')}
                  >
                    Sign in
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
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

export default RegisterPage;