// pages/admin/seed.js

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function SeedPage() {
  const [status, setStatus] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSeed = async () => {
    if (!confirm('Are you sure you want to seed the database? This action cannot be undone.')) {
      return;
    }

    setStatus('Seeding data...');
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('Seeding complete!');
        setResults(data.results || []);
      } else {
        setError(data.error || 'An error occurred while seeding data');
        setStatus('Failed');
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setError(error.message);
      setStatus('Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Database Seeding</h1>
        
        <div className="bg-white shadow rounded p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This will seed the database with initial agent data. Only use this if you need to
              initialize or reset the database.
            </p>
            <button
              onClick={handleSeed}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
              disabled={loading}
            >
              {loading ? 'Seeding...' : 'Seed Database'}
            </button>
          </div>

          {status && (
            <div className="mt-6">
              <h2 className="font-bold mb-2">Status: {status}</h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Results:</h3>
                  <div className="max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div 
                        key={index} 
                        className={`p-2 mb-1 rounded ${
                          result.status === 'added' ? 'bg-green-100' :
                          result.status === 'skipped' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}
                      >
                        <p className="text-sm">
                          {result.agentId} - {result.dataType}: {result.status}
                          {result.reason && ` (${result.reason})`}
                          {result.error && ` Error: ${result.error}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}