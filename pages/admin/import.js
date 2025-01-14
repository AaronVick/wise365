// pages/admin/import.js
import React, { useState } from 'react';

const ImportPage = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    setIsLoading(true);
    setStatus('Starting import...');

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'import' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const result = await response.json();
      setStatus(`Success: ${result.message}`);
      
    } catch (error) {
      console.error('Import error details:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Import Funnels</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleImport}
          disabled={isLoading}
          className={`
            px-4 py-2 rounded-md
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
            text-white font-medium transition-colors
          `}
        >
          {isLoading ? 'Importing...' : 'Start Import'}
        </button>

        {status && (
          <div className={`
            p-4 rounded-md
            ${status.includes('Success') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
            }
          `}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportPage;