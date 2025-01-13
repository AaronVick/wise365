// pages/api/seed.js

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import '../../lib/firebase';
import '../../lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
    timeout: 600000, // 10 minutes
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Authentication Verification
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    console.log('Authenticated user:', decodedToken.uid);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const db = getFirestore();

  // Connection Test
  try {
    const existingCount = (await db.collection('agentData').get()).size;
    res.write(
      `data: ${JSON.stringify({
        type: 'connection-test',
        message: 'Connection successful',
        existingCount,
      })}\n\n`
    );
  } catch (error) {
    console.error('Connection error:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to connect to Firestore',
      })}\n\n`
    );
    res.end();
    return;
  }

  try {
    // Import the seed data dynamically
    const { default: agentData } = await import('../../data/seedData.js');

    if (!Array.isArray(agentData) || agentData.length === 0) {
      throw new Error('Invalid or empty dataset');
    }

    const totalRecords = agentData.length;
    const CHUNK_SIZE = 10;
    const chunks = [];

    // Divide dataset into chunks
    for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
      chunks.push(agentData.slice(i, i + CHUNK_SIZE));
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        totalRecords,
        message: 'Seeding process started.',
      })}\n\n`
    );

    let processedRecords = 0;

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      res.write(
        `data: ${JSON.stringify({
          type: 'chunk-start',
          currentChunk: chunkIndex + 1,
          totalChunks: chunks.length,
          message: `Processing chunk ${chunkIndex + 1}...`,
        })}\n\n`
      );

      const batch = db.batch();
      const chunkResults = [];

      for (const record of chunk) {
        try {
          if (!record.agentId || !record.datatype || !record.description) {
            throw new Error(`Missing required fields: ${JSON.stringify(record)}`);
          }

          const querySnapshot = await db
            .collection('agentData')
            .where('agentId', '==', record.agentId)
            .where('datatype', '==', record.datatype)
            .where('description', '==', record.description)
            .get();

          if (querySnapshot.empty) {
            const docRef = db.collection('agentData').doc();
            batch.set(docRef, {
              ...record,
              lastUpdated: new Date(),
            });

            chunkResults.push({
              status: 'added',
              agentId: record.agentId,
              datatype: record.datatype,
              description: record.description,
            });
          } else {
            chunkResults.push({
              status: 'skipped',
              agentId: record.agentId,
              datatype: record.datatype,
              description: record.description,
              reason: 'Already exists',
            });
          }
        } catch (error) {
          chunkResults.push({
            status: 'error',
            agentId: record.agentId,
            datatype: record.datatype,
            description: record.description,
            error: error.message,
          });
        }
      }

      await batch.commit();
      processedRecords += chunk.length;

      res.write(
        `data: ${JSON.stringify({
          type: 'chunk-complete',
          currentChunk: chunkIndex + 1,
          totalChunks: chunks.length,
          processedRecords,
          totalRecords,
          chunkResults,
        })}\n\n`
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'complete',
        totalProcessed: processedRecords,
        message: 'Seeding process completed successfully!',
      })}\n\n`
    );
    res.end();
  } catch (error) {
    console.error('Seeding error:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: error.message || 'Unknown error occurred',
      })}\n\n`
    );
    res.end();
  }
}
