// pages/admin/import.js

import React, { useState } from 'react';

const ImportPage = () => {
  const [status, setStatus] = useState('');

  const handleImport = async () => {
    try {
      setStatus('Importing...');
      const response = await fetch('/api/admin/import', { method: 'POST' });

      if (response.ok) {
        setStatus('Import successful!');
      } else {
        const errorData = await response.json();
        setStatus(`Import failed: ${errorData.message}`);
      }
    } catch (error) {
      setStatus(`Import error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Import Funnels</h1>
      <button onClick={handleImport}>Start Import</button>
      <p>{status}</p>
    </div>
  );
};

export default ImportPage;
