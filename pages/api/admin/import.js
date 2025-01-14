// pages/api/admin/import.js
import { getFirestore } from 'firebase-admin/firestore';
import '../../../lib/firebaseAdmin';  // This will handle the initialization
import funnels from '@/data/funnels';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Starting import process...');
    console.log('Number of funnels to import:', funnels.length);

    const db = getFirestore();
    const batch = db.batch();

    // Process each funnel
    funnels.forEach((funnel) => {
      const docRef = db.collection('funnels').doc();
      const timestamp = new Date().toISOString();
      
      batch.set(docRef, {
        ...funnel,
        createdAt: timestamp,
        updatedAt: timestamp,
        id: docRef.id
      });

      console.log(`Added funnel to batch: ${funnel.name}`);
    });

    console.log('Committing batch...');
    await batch.commit();
    console.log('Batch committed successfully');

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${funnels.length} funnels`
    });

  } catch (error) {
    console.error('Import error details:', error);
    return res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}