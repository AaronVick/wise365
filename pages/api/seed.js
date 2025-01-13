// pages/api/seed.js
import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebase';
import '../../lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: false, // SSE does not use the request body parser
    externalResolver: true,
    responseLimit: false,
    timeout: 600000, // 10 minutes
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Content-Type', 'text/event-stream');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const db = getFirestore();
  if (!db) {
    res.write('data: {"type":"error","message":"Firestore initialization failed"}\n\n');
    return res.end();
  }

  // Dummy data placeholder: Replace `agentData` with your actual JSON dataset
  const agentData = []; // Ensure this is replaced dynamically or preloaded
  const CHUNK_SIZE = 10; // Process 10 records at a time
  const results = [];
  let totalProcessed = 0;

  // Helper function to send updates
  const sendProgressUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const collectionRef = db.collection('agentData');
    const chunks = [];
    for (let i = 0; i < agentData.length; i += CHUNK_SIZE) {
      chunks.push(agentData.slice(i, i + CHUNK_SIZE));
    }

    sendProgressUpdate({
      type: 'start',
      total: agentData.length,
      message: 'Starting seeding process...',
    });

    for (const [chunkIndex, chunk] of chunks.entries()) {
      let batch = db.batch();

      sendProgressUpdate({
        type: 'chunk-start',
        chunk: chunkIndex + 1,
        totalChunks: chunks.length,
        message: `Processing chunk ${chunkIndex + 1}/${chunks.length}...`,
      });

      for (const item of chunk) {
        try {
          if (!item.agentId || !item.datatype) {
            throw new Error(`Missing required fields: ${JSON.stringify(item)}`);
          }

          const querySnapshot = await collectionRef
            .where('agentId', '==', item.agentId)
            .where('datatype', '==', item.datatype)
            .get();

          if (querySnapshot.empty) {
            const docRef = collectionRef.doc();
            batch.set(docRef, { ...item, lastUpdated: new Date() });

            results.push({
              status: 'added',
              agentId: item.agentId,
              datatype: item.datatype,
              docId: docRef.id,
            });
          } else {
            results.push({
              status: 'skipped',
              agentId: item.agentId,
              datatype: item.datatype,
              reason: 'Record already exists',
            });
          }
        } catch (itemError) {
          results.push({
            status: 'error',
            agentId: item.agentId,
            datatype: item.datatype,
            error: itemError.message || 'Unknown error',
          });
        }
      }

      // Commit the batch
      await batch.commit();
      totalProcessed += chunk.length;

      sendProgressUpdate({
        type: 'chunk-complete',
        chunk: chunkIndex + 1,
        totalChunks: chunks.length,
        processed: totalProcessed,
        total: agentData.length,
        message: `Completed chunk ${chunkIndex + 1}/${chunks.length}`,
      });
    }

    sendProgressUpdate({
      type: 'complete',
      totalProcessed,
      results,
      message: 'Seeding process completed successfully!',
    });
  } catch (error) {
    sendProgressUpdate({
      type: 'error',
      message: error.message || 'An unknown error occurred',
    });
  } finally {
    res.end();
  }
}
