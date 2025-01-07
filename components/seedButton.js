import { useState } from 'react';

export default function SeedButton() {
  const [status, setStatus] = useState('');

  const handleSeed = async () => {
    setStatus('Seeding data...');
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setStatus(result.message || 'Seeding complete!');
      } else {
        const error = await response.json();
        setStatus(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error seeding data:', error);
      setStatus('An unexpected error occurred.');
    }
  };

  return (
    <div>
      <button
        onClick={handleSeed}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Seed Data
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
