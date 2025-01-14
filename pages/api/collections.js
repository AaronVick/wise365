// pages/api/collections.js

import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const db = getFirestore();
    const collections = await db.listCollections();
    const collectionNames = collections.map((col) => col.id);

    console.log('Fetched collections:', collectionNames);

    res.status(200).json({ success: true, collections: collectionNames });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch collections' });
  }
}
