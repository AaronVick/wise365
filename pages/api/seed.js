// pages/api/seed.js
import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebase';
import '../../lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
    responseLimit: false,
    timeout: 600000, // Increased to 10 minutes
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Helper function to send SSE updates with error handling
  const sendProgressUpdate = (res, data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending progress update:', error);
    }
  };

  // Keep track of the last successful write
  let lastSuccessfulWrite = Date.now();
  const WRITE_TIMEOUT = 30000; // 30 seconds

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const db = getFirestore();
    if (!db) {
      throw new Error('Failed to initialize Firestore');
    }

    // Reduced batch and chunk sizes for more frequent updates
    const BATCH_SIZE = 50;
    const CHUNK_SIZE = 250;
    
    const chunks = [];
    for (let i = 0; i < agentData.length; i += CHUNK_SIZE) {
      chunks.push(agentData.slice(i, i + CHUNK_SIZE));
    }

    let totalProcessed = 0;
    const results = [];
    const collectionRef = db.collection('agentData');

    // Initial progress update
    sendProgressUpdate(res, {
      type: 'start',
      total: agentData.length,
      message: 'Starting seed process...'
    });
    lastSuccessfulWrite = Date.now();

    for (const chunk of chunks) {
      const chunkIndex = chunks.indexOf(chunk);
      let batch = db.batch();
      let batchCount = 0;

      // Send chunk start update
      sendProgressUpdate(res, {
        type: 'chunk-start',
        current: chunkIndex + 1,
        total: chunks.length,
        message: `Processing chunk ${chunkIndex + 1}/${chunks.length}`
      });
      lastSuccessfulWrite = Date.now();

      for (const item of chunk) {
        try {
          // Check for connection timeout
          if (Date.now() - lastSuccessfulWrite > WRITE_TIMEOUT) {
            throw new Error('Connection timeout - no successful writes for 30 seconds');
          }

          // Validate required fields
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
                total: agentData.length,
                message: `Processed ${totalProcessed}/${agentData.length} records`
              });
              lastSuccessfulWrite = Date.now();
              
              batch = db.batch();
              batchCount = 0;

              // Add a small delay between batches to prevent overwhelming
              await new Promise(resolve => setTimeout(resolve, 100));
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
          lastSuccessfulWrite = Date.now();
        }
      }

      // Commit remaining items in the batch
      if (batchCount > 0) {
        await batch.commit();
        totalProcessed += batchCount;
        
        sendProgressUpdate(res, {
          type: 'chunk-complete',
          current: chunkIndex + 1,
          total: chunks.length,
          processed: totalProcessed,
          message: `Completed chunk ${chunkIndex + 1}/${chunks.length}`
        });
        lastSuccessfulWrite = Date.now();
      }
    }

    // Send completion update
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
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    sendProgressUpdate(res, {
      type: 'error',
      success: false,
      error: error.message || 'An unknown error occurred',
      timestamp: new Date().toISOString()
    });

    res.end();
  }
}