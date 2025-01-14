// pages/api/admin/import.js

import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import funnels from '../../../data/funnels';

export const config = {
  api: {
    bodyParser: true,
  },
};

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK || '{}');
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  console.log('API Route Hit:', req.method);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} Not Allowed` 
    });
  }

  try {
    console.log('Processing funnels:', funnels.length);

    const batch = db.batch();
    
    for (const funnel of funnels) {
      const docRef = db.collection('funnels').doc();
      const funnelData = {
        ...funnel,
        importedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      batch.set(docRef, funnelData);
    }

    await batch.commit();
    console.log('Batch commit successful');

    return res.status(200).json({ 
      success: true, 
      message: `Successfully imported ${funnels.length} funnels` 
    });
    
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}