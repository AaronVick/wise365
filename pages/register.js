// pages/register.js

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Handle form submission
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Gather form data
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    const name = e.target.name.value.trim();
    const teamName = `${name}'s Team`; // Default team name for new registrations

    try {
      // 1. Create Firebase Authentication user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check if team already exists
      const teamsRef = collection(db, 'teams');
      const teamQuery = query(teamsRef, where('name', '==', teamName));
      const teamSnapshot = await getDocs(teamQuery);

      let teamId;
      let role;

      if (!teamSnapshot.empty) {
        // Team exists
        const existingTeam = teamSnapshot.docs[0].data();
        teamId = existingTeam.teamId;
        role = 'Member'; // Assign as Member for existing team
      } else {
        // Create a new team
        const newTeamDoc = doc(teamsRef);
        teamId = newTeamDoc.id;

        const newTeamData = {
          teamId,
          name: teamName,
          members: [user.uid],
          createdAt: serverTimestamp(),
          subscriptionStatus: 'free', // Default subscription
        };

        await setDoc(newTeamDoc, newTeamData);
        role = 'Manager'; // Assign as Manager for new team
      }

      // 3. Create a user document
      const userDocRef = doc(db, 'users', user.uid);
      const userData = {
        email,
        name,
        uid: user.uid,
        role,
        createdAt: serverTimestamp(),
        theme: 'light',
        teamId,
        tenantId: `placeholder-tenant-${Date.now()}`, // Placeholder tenantId
        profilePicture: '',
      };

      await setDoc(userDocRef, userData);

      // 4. Store essential data in localStorage for client-side use
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('teamId', teamId);

      console.log('Registration complete');
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);

      const errorMessages = {
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/invalid-email': 'Invalid email format',
        'auth/operation-not-allowed': 'Email/password registration is not enabled',
        'auth/weak-password': 'Password must be at least 6 characters long',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/internal-error': 'Registration service error. Please try again',
      };

      setError(errorMessages[error.code] || error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration form UI
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
                  {isLoading ? 'Creating Account...' : 'Create Account'}
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
          <p>© 2025 Business Wise365. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;
