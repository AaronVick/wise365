// pages/api/collections.js

import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify authentication token if present in headers
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split('Bearer ')[1];
      try {
        await getAuth().verifyIdToken(token);
      } catch (authError) {
        console.error('Authentication error:', authError);
        return res.status(401).json({ success: false, message: 'Invalid authentication token' });
      }
    }

    // Get Firestore instance
    const db = getFirestore();
    
    try {
      // List all collections
      const collections = await db.listCollections();
      const collectionNames = collections.map((col) => col.id);
      
      console.log('Successfully fetched collections:', collectionNames);
      
      // Return sorted collection names
      res.status(200).json({ 
        success: true, 
        collections: collectionNames.sort()
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch collections',
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}