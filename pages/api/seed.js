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
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { collection, file } = req.query;
  if (!collection || !file) {
    console.error('Missing query parameters:', { collection, file });
    return res.status(400).json({ success: false, message: 'Missing collection or file parameter' });
  }

  console.log('Initializing seeding process for:', { collection, file });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Authorization header missing or invalid.');
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const idToken = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(idToken);
    console.log('Authenticated user:', decodedToken.uid);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  const db = getFirestore();
  try {
    const userDoc = await db.collection('users').where('authenticationID', '==', decodedToken.uid).get();

    if (userDoc.empty || !userDoc.docs[0].data().SystemAdmin) {
      console.error('User does not have sufficient permissions:', decodedToken.uid);
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
  } catch (error) {
    console.error('User permission check error:', error);
    return res.status(500).json({ success: false, message: 'Error verifying user permissions' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { default: seedData } = await import(`../../data/${file}`);

    if (!Array.isArray(seedData) || seedData.length === 0) {
      throw new Error('Invalid or empty dataset');
    }

    console.log('Loaded seed data from file:', file);

    const totalRecords = seedData.length;
    const CHUNK_SIZE = 10;
    const chunks = [];

    for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
      chunks.push(seedData.slice(i, i + CHUNK_SIZE));
    }

    res.write(`data: ${JSON.stringify({ type: 'start', totalRecords, message: 'Seeding process started.' })}\n\n`);

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
            .collection(collection)
            .where('agentId', '==', record.agentId)
            .where('datatype', '==', record.datatype)
            .where('description', '==', record.description)
            .get();

          if (querySnapshot.empty) {
            const docRef = db.collection(collection).doc();
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
      `data: ${JSON.stringify({ type: 'complete', totalProcessed: processedRecords, message: 'Seeding process completed successfully!' })}\n\n`
    );
    res.end();
  } catch (error) {
    console.error('Seeding error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Unknown error occurred' })}\n\n`);
    res.end();
  }
}
