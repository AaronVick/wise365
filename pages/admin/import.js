import React, { useState } from 'react';
import seedData from '../../data/funnels';

export default function ImportPage() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  const handleImport = async () => {
    setStatus('Importing data...');
    setError(null);

    try {
      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStatus('Import completed successfully!');
      console.log('Import result:', result);
    } catch (err) {
      setStatus('');
      setError(`Import failed: ${err.message}`);
      console.error('Import error:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Import Funnel Data</h1>
      <p>Click the button below to import funnel data into the database.</p>
      <button
        onClick={handleImport}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Import Data
      </button>

      {status && <p style={{ marginTop: '20px', color: 'green' }}>{status}</p>}
      {error && <p style={{ marginTop: '20px', color: 'red' }}>{error}</p>}
    </div>
  );
}
