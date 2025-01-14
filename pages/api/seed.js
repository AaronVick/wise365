// pages/api/seed.js

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import '../../lib/firebaseAdmin';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    responseLimit: false,
    timeout: 600000, // 10 minutes
  },
};

// Collection dependency configuration
const COLLECTION_DEPENDENCIES = {
  userData: {
    userRef: {
      collection: 'users',
      field: 'authenticationID',  // Field to match in users collection
      required: true
    }
  },
  agentData: {
    agentId: {
      collection: 'agents',
      field: 'id',
      required: true
    }
  },
  conversationNames: {
    userRef: {
      collection: 'users',
      field: 'authenticationID',
      required: true
    }
  },
  // Add more collection dependencies as needed
};

async function resolveReferences(db, record, collection) {
  const dependencies = COLLECTION_DEPENDENCIES[collection];
  if (!dependencies) {
    return record;
  }

  const resolvedRecord = { ...record };
  const errors = [];

  for (const [field, config] of Object.entries(dependencies)) {
    if (record[field]) {
      try {
        const query = await db.collection(config.collection)
          .where(config.field, '==', record[field])
          .get();

        if (query.empty) {
          const error = `Referenced ${config.collection} document not found for ${field}: ${record[field]}`;
          if (config.required) {
            throw new Error(error);
          } else {
            console.warn(error);
          }
        } else {
          resolvedRecord[`${field}Ref`] = query.docs[0].ref;
        }
      } catch (error) {
        errors.push(error.message);
      }
    } else if (config.required) {
      errors.push(`Required field ${field} is missing`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return resolvedRecord;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { collection, file, auth } = req.query;

  // Validate query parameters
  if (!collection || !file) {
    console.error('Missing query parameters:', { collection, file });
    return res.status(400).json({ success: false, message: 'Missing collection or file parameter' });
  }

  // Validate file path
  const dataFolder = path.resolve(process.cwd(), 'data');
  const filePath = path.join(dataFolder, file);
  
  try {
    const fileStats = fs.statSync(filePath);
    if (!fileStats.isFile()) {
      throw new Error('Not a file');
    }
  } catch (error) {
    console.error('File validation error:', error);
    return res.status(400).json({ success: false, message: `Invalid file: ${file}` });
  }

  // Validate auth token
  if (!auth) {
    console.error('Missing auth token');
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing auth token' });
  }

  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(auth);
    console.log('Authenticated user:', decodedToken.uid);
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const db = getFirestore();

  // Verify user permissions
  try {
    const userSnap = await db.collection('users')
      .where('authenticationID', '==', decodedToken.uid)
      .get();

    if (userSnap.empty || !userSnap.docs[0].data().SystemAdmin) {
      throw new Error('Insufficient permissions');
    }
  } catch (error) {
    console.error('Permission check error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: 'Unauthorized: Insufficient permissions'
    })}\n\n`);
    return res.end();
  }

  try {
    // Import seed data
    const { default: seedData } = await import(`../../data/${file}`);

    if (!Array.isArray(seedData) || seedData.length === 0) {
      throw new Error('Invalid or empty dataset');
    }

    console.log(`Processing ${seedData.length} records for ${collection}`);

    const CHUNK_SIZE = 10;
    const chunks = [];

    for (let i = 0; i < seedData.length; i += CHUNK_SIZE) {
      chunks.push(seedData.slice(i, i + CHUNK_SIZE));
    }

    // Start seeding process
    res.write(`data: ${JSON.stringify({
      type: 'start',
      totalRecords: seedData.length,
      message: 'Starting seeding process'
    })}\n\n`);

    let processedRecords = 0;

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      res.write(`data: ${JSON.stringify({
        type: 'chunk-start',
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        message: `Processing chunk ${chunkIndex + 1} of ${chunks.length}`
      })}\n\n`);

      const batch = db.batch();
      const chunkResults = [];

      for (const record of chunk) {
        try {
          // Basic validation
          if (!record || typeof record !== 'object') {
            throw new Error('Invalid record format');
          }

          // Check for existing record
          const querySnapshot = await db.collection(collection)
            .where('agentId', '==', record.agentId)
            .where('datatype', '==', record.datatype)
            .where('description', '==', record.description)
            .get();

          if (querySnapshot.empty) {
            // Resolve references before saving
            const resolvedRecord = await resolveReferences(db, record, collection);
            
            const docRef = db.collection(collection).doc();
            batch.set(docRef, {
              ...resolvedRecord,
              lastUpdated: new Date(),
              createdAt: new Date(),
              createdBy: decodedToken.uid
            });

            chunkResults.push({
              status: 'added',
              agentId: record.agentId,
              datatype: record.datatype,
              description: record.description
            });
          } else {
            chunkResults.push({
              status: 'skipped',
              agentId: record.agentId,
              datatype: record.datatype,
              description: record.description,
              reason: 'Record already exists'
            });
          }
        } catch (error) {
          console.error('Error processing record:', error);
          chunkResults.push({
            status: 'error',
            agentId: record.agentId,
            datatype: record.datatype,
            description: record.description,
            error: error.message
          });
        }
      }

      try {
        await batch.commit();
        processedRecords += chunk.length;

        res.write(`data: ${JSON.stringify({
          type: 'chunk-complete',
          currentChunk: chunkIndex + 1,
          totalChunks: chunks.length,
          processedRecords,
          totalRecords: seedData.length,
          chunkResults
        })}\n\n`);
      } catch (error) {
        console.error('Batch commit error:', error);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          message: `Failed to commit batch ${chunkIndex + 1}: ${error.message}`
        })}\n\n`);
        return res.end();
      }

      // Small delay between chunks
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      totalProcessed: processedRecords,
      message: 'Seeding process completed successfully'
    })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Seeding error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message || 'Unknown error occurred'
    })}\n\n`);
    res.end();
  }
}