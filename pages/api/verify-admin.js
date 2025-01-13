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
    console.log('Missing or invalid authorization header');
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    const idToken = authHeader.split(' ')[1];
    console.log('Verifying token...');
    const decodedToken = await getAuth().verifyIdToken(idToken);
    console.log('Decoded token UID:', decodedToken.uid);
    
    const db = getFirestore();
    
    // First try with decoded token UID
    let userDoc = await db.collection('users').doc(decodedToken.uid).get();
    console.log('First attempt userDoc exists:', userDoc.exists);
    
    // If not found, try with the authenticationID field
    if (!userDoc.exists) {
      console.log('User doc not found by UID, trying authenticationID query...');
      const userQuery = await db.collection('users')
        .where('authenticationID', '==', decodedToken.uid)
        .get();
      
      if (!userQuery.empty) {
        userDoc = userQuery.docs[0];
        console.log('Found user doc by authenticationID');
      }
    }
    
    if (!userDoc.exists) {
      console.log('User document not found');
      return res.status(403).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    console.log('User data:', userData);
    console.log('SystemAdmin value:', userData.SystemAdmin);

    if (!userData.SystemAdmin) {
      console.log('User is not a system admin');
      return res.status(403).json({ error: 'Not authorized as system administrator' });
    }

    console.log('Authorization successful');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in verify-admin:', error);
    return res.status(401).json({ error: 'Invalid token or unauthorized', details: error.message });
  }
}