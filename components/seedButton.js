// components/seedButton.js
import React, { useState } from 'react';
import Button from './ui/button'; // Correct import for the Button component

export default function SeedButton() {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to import the funnel data into Firebase? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setStatus('Importing data...');

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || 'Failed to import data';
        } catch (e) {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Import response:', data); // Debug log
      setStatus(`Success! ${data.message || 'Data imported successfully.'}`);
    } catch (error) {
      console.error('Import error:', error);
      setStatus(`Error: ${error.message || 'Failed to import data'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSeed}
        disabled={isLoading}
        className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300"
      >
        {isLoading ? 'Importing...' : 'Import Funnel Data'}
      </Button>
      {status && (
        <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
