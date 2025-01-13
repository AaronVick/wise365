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
  }
}

const db = getFirestore();

// Separate the agent data into a different file
import agentData from '@/data/seedData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting seed process...');
    const results = [];
    const collectionRef = db.collection('resources');

    // Create a batch for bulk operations
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore limit is 500 operations per batch

    for (const item of agentData) {
      try {
        // Check if document already exists
        const querySnapshot = await collectionRef
          .where('agentId', '==', item.agentId)
          .where('datatype', '==', item.datatype)
          .get();

        if (querySnapshot.empty) {
          // Create new document reference
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

          // If batch size limit reached, commit and create new batch
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
          error: itemError.message,
        });
      }
    }

    // Commit any remaining documents in the final batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} documents`);
    }

    return res.status(200).json({
      message: 'Seeding process completed',
      results,
    });
  } catch (error) {
    console.error('Error in seed process:', error);
    return res.status(500).json({
      error: 'Error seeding data',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}