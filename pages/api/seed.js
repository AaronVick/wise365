// pages/api/seed.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
    responseLimit: false,
    timeout: 300000, // 5 minutes
  },
};

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

import agentData from '@/data/seedData';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  const sendProgressUpdate = (res, data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const totalRecords = agentData.length;
    console.log(`Total records to process: ${totalRecords}`);
    
    sendProgressUpdate(res, {
      type: 'start',
      total: totalRecords,
      message: 'Starting seed process...'
    });

    const results = [];
    const collectionRef = db.collection('resources');
    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 100;
    let totalProcessed = 0;
    
    const chunks = [];
    const CHUNK_SIZE = 500;
    for (let i = 0; i < agentData.length; i += CHUNK_SIZE) {
      chunks.push(agentData.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const chunkIndex = chunks.indexOf(chunk);
      sendProgressUpdate(res, {
        type: 'chunk-start',
        current: chunkIndex + 1,
        total: chunks.length,
        message: `Processing chunk ${chunkIndex + 1}/${chunks.length}`
      });
      
      for (const item of chunk) {
        try {
          if (!item.agentId || !item.datatype) {
            throw new Error(`Missing required fields for item: ${JSON.stringify(item)}`);
          }

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
              totalProcessed += batchCount;
              
              sendProgressUpdate(res, {
                type: 'progress',
                processed: totalProcessed,
                total: totalRecords,
                message: `Processed ${totalProcessed}/${totalRecords} records`
              });
              
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
            totalProcessed++;
          }
        } catch (itemError) {
          console.error(`Error processing item:`, itemError);
          results.push({
            status: 'error',
            agentId: item.agentId,
            datatype: item.datatype,
            error: itemError.message || 'Unknown error processing item',
          });
          totalProcessed++;
          
          sendProgressUpdate(res, {
            type: 'error',
            message: `Error processing item: ${itemError.message}`,
            item: { agentId: item.agentId, datatype: item.datatype }
          });
        }
      }
      
      if (batchCount > 0) {
        await batch.commit();
        totalProcessed += batchCount;
        batch = db.batch();
        batchCount = 0;
        
        sendProgressUpdate(res, {
          type: 'chunk-complete',
          current: chunkIndex + 1,
          total: chunks.length,
          processed: totalProcessed,
          message: `Completed chunk ${chunkIndex + 1}/${chunks.length}`
        });
      }
    }

    sendProgressUpdate(res, {
      type: 'complete',
      success: true,
      message: 'Seeding process completed successfully',
      results: results,
      totalProcessed: totalProcessed,
      timestamp: new Date().toISOString()
    });

    res.end();

  } catch (error) {
    const errorMessage = error.message || 'An unknown error occurred';
    console.error('Detailed error:', {
      message: errorMessage,
      stack: error.stack,
      name: error.name
    });
    
    sendProgressUpdate(res, {
      type: 'error',
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });

    res.end();
  }
}