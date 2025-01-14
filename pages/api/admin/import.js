// pages/api/admin/import.js


import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, apps } from 'firebase-admin/app';
import funnels from '../../../data/funnels';

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');

// Initialize Firebase Admin SDK if not already initialized
if (!apps.length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    if (!Array.isArray(funnels) || funnels.length === 0) {
      return res.status(400).json({ success: false, message: 'Funnels data is empty or invalid.' });
    }

    const batch = db.batch();
    funnels.forEach((record) => {
      if (!record.id || !record.name || !record.details) {
        throw new Error(`Invalid record: ${JSON.stringify(record)}`);
      }

      const docRef = db.collection('funnels').doc(record.id);
      batch.set(docRef, record);
    });

    await batch.commit();

    return res.status(200).json({ success: true, message: 'Data successfully imported!' });
  } catch (error) {
    console.error('Error importing data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import data.',
      error: error.message,
    });
  }
}
