import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import funnels from '../../data/funnels'; // Adjust path as needed
import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebaseAdmin'; // Ensure Firebase Admin is initialized

export default function ImportFunnelsPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!confirm('Are you sure you want to import funnel data? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setStatus('Initializing Firebase import...');

    try {
      const db = getFirestore();
      const batch = db.batch();

      funnels.forEach((funnel) => {
        const docRef = db.collection('funnels').doc(); // Adjust collection name if needed
        batch.set(docRef, funnel);
      });

      await batch.commit();

      setStatus('Import completed successfully!');
    } catch (error) {
      console.error('Error during import:', error);
      setStatus('Import failed. Check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Import Funnels</h1>
        <p className="text-gray-600 mb-6">
          This page allows you to import predefined funnel data into your Firebase collection.
        </p>
        <button
          onClick={handleImport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Start Import'}
        </button>
        {status && (
          <div className="mt-4 text-gray-800">
            <p>{status}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
