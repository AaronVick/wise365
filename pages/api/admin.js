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
  console.log('Received request with tab:', tab, 'agentId:', agentId);

  try {
    if (tab === 'agents') {
      const agentsCollection = collection(db, 'agents');
      const agentsSnapshot = await getDocs(agentsCollection);
      const agents = agentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log('Fetched agents:', agents);
      return res.status(200).json(agents);
    }

    if (tab === 'training') {
      const agentDataCollection = collection(db, 'agentData');
      console.log('Querying agentData collection with agentId:', agentId);
      
      const allDocs = await getDocs(agentDataCollection);
      console.log('Total documents in agentData:', allDocs.size);

      let trainingData;
      if (agentId) {
        const trainingQuery = query(
          agentDataCollection, 
          where('agentId', '==', String(agentId.toLowerCase()))
        );
        const trainingSnapshot = await getDocs(trainingQuery);
        console.log('Filtered query returned:', trainingSnapshot.size, 'documents');
        
        trainingData = trainingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
      } else {
        trainingData = allDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      return res.status(200).json(trainingData);
    }

    if (tab === 'conversations') {
      const conversationsCollection = collection(db, 'conversations');
      
      let conversationQuery;
      if (agentId) {
        conversationQuery = query(
          conversationsCollection,
          where('agentId', '==', agentId),
          where('createdBy', '==', 'admin')
        );
      } else {
        conversationQuery = query(
          conversationsCollection,
          where('createdBy', '==', 'admin')
        );
      }

      const conversationsSnapshot = await getDocs(conversationQuery);
      const conversations = conversationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json(conversations);
    }

    return res.status(400).json({ error: 'Invalid tab specified.' });
  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}