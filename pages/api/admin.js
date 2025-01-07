// /pages/admin/api/admin.js

import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  const { tab, agentId } = req.query;

  try {
    if (tab === 'agents') {
      const agentsSnapshot = await getDocs(collection(db, 'agents'));
      const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(agents);
    }

    if (tab === 'conversations') {
      const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
      const conversations = conversationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(conversations);
    }

    if (tab === 'training') {
      // Handle training data with optional agentId filter
      const agentDataCollection = collection(db, 'agentData');

      let trainingQuery;
      if (agentId) {
        trainingQuery = query(agentDataCollection, where('agentId', '==', agentId));
      } else {
        trainingQuery = agentDataCollection;
      }

      const trainingSnapshot = await getDocs(trainingQuery);
      const trainingData = trainingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return res.status(200).json(trainingData);
    }

    return res.status(400).json({ error: 'Invalid tab specified.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
