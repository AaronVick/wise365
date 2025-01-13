// pages/api/seed.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    };

    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    // Don't throw here, let the API handler handle the error
  }
}

const db = getFirestore();

// Import seed data
import agentData from '@/data/seedData';

export default async function handler(req, res) {
  // Add CORS headers if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    console.log('Starting seed process...');
    const results = [];
    const collectionRef = db.collection('resources');

    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;

    for (const item of agentData) {
      try {
        const querySnapshot = await collectionRef
          .where('agentId', '==', item.agentId)
          .where('datatype', '==', item.datatype)
          .get();

        if (querySnapshot.empty) {
          const docRef = collectionRef.doc();
          batch.set(docRef, {
            ...item,
            lastUpdated: new Date(),
          });

          results.push({
            status: 'added',
            agentId: item.agentId,
            datatype: item.datatype,
            docId: docRef.id,
          });

          batchCount++;

          if (batchCount === BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${BATCH_SIZE} documents`);
            batch = db.batch();
            batchCount = 0;
          }
        } else {
          results.push({
            status: 'skipped',
            agentId: item.agentId,
            datatype: item.datatype,
            reason: 'already exists',
          });
        }
      } catch (itemError) {
        console.error(`Error processing item:`, itemError);
        results.push({
          status: 'error',
          agentId: item.agentId,
          datatype: item.datatype,
          error: itemError.message || 'Unknown error processing item',
        });
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} documents`);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Seeding process completed successfully',
      results: results,
      totalProcessed: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in seed process:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: 'Error seeding data',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}