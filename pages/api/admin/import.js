// pages/api/admin/import.js

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import funnels from '../../../data/funnels';

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

const db = getFirestore();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    if (!Array.isArray(funnels) || funnels.length === 0) {
      return res.status(400).json({ success: false, message: 'Funnels data is empty or invalid.' });
    }

    const batch = db.batch();
    
    // Process each funnel
    funnels.forEach((funnel, index) => {
      if (!funnel.name) {
        throw new Error(`Invalid funnel at index ${index}: Missing required field 'name'`);
      }

      // Create a document reference with auto-generated ID
      const docRef = db.collection('funnels').doc();
      
      // Add the funnel data with a timestamp
      batch.set(docRef, {
        ...funnel,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    await batch.commit();
    
    return res.status(200).json({ 
      success: true, 
      message: `Successfully imported ${funnels.length} funnels!` 
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import data.',
      error: error.message,
    });
  }
}