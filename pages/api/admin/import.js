// pages/api/admin/import.js

import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import funnels from '@/data/funnels';  // Make sure to use the correct path

// Configure API route
export const config = {
  api: {
    externalResolver: true,
  },
};

// Initialize Firebase Admin
function initFirebase() {
  if (!getApps().length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw error;
    }
  }
  return getFirestore();
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  try {
    console.log('Starting import process...');
    console.log('Number of funnels to import:', funnels.length);

    // Initialize Firestore
    const db = initFirebase();
    
    // Create batch
    const batch = db.batch();
    
    // Process each funnel
    funnels.forEach((funnel, index) => {
      const docRef = db.collection('funnels').doc();
      const timestamp = new Date().toISOString();
      
      batch.set(docRef, {
        ...funnel,
        createdAt: timestamp,
        updatedAt: timestamp,
        id: docRef.id
      });
    });

    // Commit the batch
    console.log('Committing batch...');
    await batch.commit();
    console.log('Batch committed successfully');

    // Send success response
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${funnels.length} funnels`
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Import failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}