// /pages/api/admin.js

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
      const agents = agentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(agents);
    }

    if (tab === 'training') {
      const agentDataCollection = collection(db, 'agentData');

      // Apply query for specific agentId if provided
      const trainingQuery = agentId
        ? query(agentDataCollection, where('agentId', '==', agentId))
        : agentDataCollection;

      const trainingSnapshot = await getDocs(trainingQuery);

      // Map the data
      const trainingData = trainingSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json(trainingData);
    }

    return res.status(400).json({ error: 'Invalid tab specified.' });
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
