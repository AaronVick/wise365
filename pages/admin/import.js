// pages/admin/import.js
import React, { useState } from 'react';

const ImportPage = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    setIsLoading(true);
    setStatus('Starting import...');

    try {
      // Make API call to local endpoint instead of Vercel URL
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Log the raw response for debugging
      console.log('Raw response:', response);

      // Check if the response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const data = await response.json();
      console.log('Response data:', data);

      // Update status based on response
      setStatus(data.message || 'Import completed successfully');

    } catch (error) {
      console.error('Import error:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Import Funnels</h1>
      
      <button
        onClick={handleImport}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded
          ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}
          text-white font-medium
        `}
      >
        {isLoading ? 'Importing...' : 'Start Import'}
      </button>

      {status && (
        <div className={`
          mt-4 p-4 rounded
          ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
        `}>
          {status}
        </div>
      )}
    </div>
  );
};

export default ImportPage;