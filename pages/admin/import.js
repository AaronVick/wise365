// pages/admin/import.js

import React, { useState } from 'react';
import { useRouter } from 'next/router';

const ImportPage = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleImport = async () => {
    try {
      setIsLoading(true);
      setStatus('Importing...');
      
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(`Success: ${data.message}`);
        // Optional: Redirect or refresh after successful import
        // setTimeout(() => router.push('/admin/funnels'), 2000);
      } else {
        setStatus(`Error: ${data.message || 'Import failed'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setStatus(`Import error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Import Funnels</h1>
      <button
        onClick={handleImport}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium`}
      >
        {isLoading ? 'Importing...' : 'Start Import'}
      </button>
      {status && (
        <p className={`mt-4 p-4 rounded ${
          status.includes('Success') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {status}
        </p>
      )}
    </div>
  );
};

export default ImportPage;