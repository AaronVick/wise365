// pages/api/seed.js
import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebase';
import '../../lib/firebaseAdmin';

// Configure API route options
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
    responseLimit: false,
    timeout: 300000, // 5 minutes
  },
};

// Import seed data
import agentData from '../../data/seedData';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '3600');
  
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

  const sendProgressUpdate = (res, data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Set up SSE headers after handling any early returns
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get Firestore instance
    const db = getFirestore();
    
    if (!db) {
      throw new Error('Failed to initialize Firestore');
    }

    console.log('Starting seed process...');
    console.log(`Total records to process: ${agentData.length}`);
    
    sendProgressUpdate(res, {
      type: 'start',
      total: agentData.length,
      message: 'Starting seed process...'
    });

    const results = [];
    const collectionRef = db.collection('agentData');
    let batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 100;
    let totalProcessed = 0;
    
    // Split data into chunks
    const chunks = [];
    const CHUNK_SIZE = 500;
    for (let i = 0; i < agentData.length; i += CHUNK_SIZE) {
      chunks.push(agentData.slice(i, i + CHUNK_SIZE));
    }

    // Process each chunk
    for (const chunk of chunks) {
      const chunkIndex = chunks.indexOf(chunk);
      console.log(`Processing chunk ${chunkIndex + 1}/${chunks.length}`);
      
      sendProgressUpdate(res, {
        type: 'chunk-start',
        current: chunkIndex + 1,
        total: chunks.length,
        message: `Processing chunk ${chunkIndex + 1}/${chunks.length}`
      });
      
      for (const item of chunk) {
        try {
          // Validate required fields
          if (!item.agentId || !item.datatype) {
            throw new Error(`Missing required fields for item: ${JSON.stringify(item)}`);
          }
          
          // Check for existing document
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
      
      // Commit any remaining items in the batch
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