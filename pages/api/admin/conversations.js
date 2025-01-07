// pages/api/admin/conversations.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { agentId, messages } = req.body;

    if (!agentId || !messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Query for existing conversation
      const conversationsRef = db.collection('conversations');
      const querySnapshot = await conversationsRef
        .where('agentId', '==', agentId)
        .where('createdBy', '==', 'admin')
        .get();
      
      if (!querySnapshot.empty) {
        // Update existing conversation
        const conversationDoc = querySnapshot.docs[0];
        await conversationsRef.doc(conversationDoc.id).update({
          messages: [...conversationDoc.data().messages, ...messages],
          lastUpdatedAt: new Date()
        });
      } else {
        // Create new conversation
        await conversationsRef.add({
          agentId,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
          createdBy: 'admin',
          messages,
          participants: ['admin', agentId],
          teamId: 'admin_team',
          name: `Admin Chat with ${agentId}`,
          isShared: true
        });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling conversation:', error);
      return res.status(500).json({ 
        error: 'Failed to handle conversation',
        message: error.message 
      });
    }
  }

  if (req.method === 'GET') {
    const { agentId } = req.query;

    try {
      const conversationsRef = db.collection('conversations');
      const querySnapshot = await conversationsRef
        .where('agentId', '==', agentId)
        .where('createdBy', '==', 'admin')
        .get();

      const conversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch conversations',
        message: error.message 
      });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}