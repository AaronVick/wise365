// pages/api/verify-admin.js
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    const idToken = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const db = getFirestore();
    
    // Check if user exists in users collection and has SystemAdmin: true
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    if (!userData.SystemAdmin) {  // Specifically checking the SystemAdmin boolean field
      return res.status(403).json({ error: 'Not authorized as system administrator' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying admin status:', error);
    return res.status(401).json({ error: 'Invalid token or unauthorized' });
  }
}