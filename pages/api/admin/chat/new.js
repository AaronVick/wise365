import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, name } = req.body;

  if (!agentId || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const docRef = await db.collection('conversations').add({
      agentID: agentId,
      name: name,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      createdBy: 'admin',
      isShared: true,
      messages: [],
      participants: ['admin', agentId],
      teamID: 'admin_team'
    });

    const newChat = {
      id: docRef.id,
      agentID: agentId,
      name: name,
      createdAt: new Date(),
      messages: []
    };

    return res.status(200).json(newChat);
  } catch (error) {
    console.error('Error creating new chat:', error);
    return res.status(500).json({ error: 'Failed to create new chat' });
  }
}