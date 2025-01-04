// pages/index.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db, signInWithEmailAndPassword } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from "@/components/ui/alert";

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking user document:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Successfully logged in user:", user.email);

      // Get or create user document
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        console.log("Found user document:", userDoc.data());
      }

      // Store user info in localStorage
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', user.email);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError(
        error.code === 'auth/user-not-found' ? 'No account found with this email' :
        error.code === 'auth/wrong-password' ? 'Invalid password' :
        error.code === 'auth/invalid-email' ? 'Invalid email format' :
        'Failed to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold">Business Wise365</h1>
          <Button variant="outline" size="lg">
            Contact Us
          </Button>
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
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="w-full max-w-md mx-auto">
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
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
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
                    className="w-full h-11 text-lg"
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
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2024 Business Wise365. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;