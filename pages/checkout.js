// pages/checkout.js

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CheckoutPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCheckout = async (priceId) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/create-checkout-session', {
        priceId,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to initiate checkout. Please try again later.');
      }
    } catch (error) {
      console.error('Error during checkout:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900">Choose Your Subscription</h1>
        </div>

        {/* Subscription Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Individual Plan */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Individual Plan</CardTitle>
              <CardDescription>Perfect for individual users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Price: $10/month</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Single user access</li>
                <li>Basic tools</li>
                <li>Email support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleCheckout('price_individual_placeholder')}
                disabled={isLoading}
                className="w-full h-11"
              >
                {isLoading ? 'Redirecting...' : 'Choose Individual Plan'}
              </Button>
            </CardFooter>
          </Card>

          {/* Small Teams Plan */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Small Teams Plan</CardTitle>
              <CardDescription>Great for small teams.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Price: $30/month</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Up to 5 team members</li>
                <li>Advanced tools</li>
                <li>Priority email support</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleCheckout('price_teams_placeholder')}
                disabled={isLoading}
                className="w-full h-11"
              >
                {isLoading ? 'Redirecting...' : 'Choose Small Teams Plan'}
              </Button>
            </CardFooter>
          </Card>

          {/* Enterprise Plan */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise Plan</CardTitle>
              <CardDescription>Custom solutions for large organizations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Price: $100/month</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Unlimited team members</li>
                <li>All tools included</li>
                <li>Dedicated account manager</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleCheckout('price_enterprise_placeholder')}
                disabled={isLoading}
                className="w-full h-11"
              >
                {isLoading ? 'Redirecting...' : 'Choose Enterprise Plan'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
