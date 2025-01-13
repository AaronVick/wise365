// components/ui/seedButton.js

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SeedButton() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to seed the database? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setStatus('Seeding data...');

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Failed to seed data';
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Seed response:', data); // Debug log
      setStatus(`Success! ${data.message || 'Data seeded successfully.'}`);
    } catch (error) {
      console.error('Seeding error:', error);
      setStatus(`Error: ${error.message || 'Failed to seed data'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSeed}
        disabled={isLoading}
        className="bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300"
      >
        {isLoading ? 'Seeding...' : 'Seed Database'}
      </Button>
      {status && (
        <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {status}
        </p>
      )}
    </div>
  );
}