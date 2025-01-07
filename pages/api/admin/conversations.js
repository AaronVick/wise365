import { getFirestore, collection, doc, getDoc, updateDoc, setDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { agentId, messages } = req.body;

    if (!agentId || !messages) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      // Query for existing conversation
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('agentId', '==', agentId),
        where('createdBy', '==', 'admin')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Update existing conversation
        const conversationDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'conversations', conversationDoc.id), {
          messages: [...conversationDoc.data().messages, ...messages],
          lastUpdatedAt: serverTimestamp()
        });
      } else {
        // Create new conversation
        await addDoc(conversationsRef, {
          agentId,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
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
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('agentId', '==', agentId),
        where('createdBy', '==', 'admin')
      );
      
      const querySnapshot = await getDocs(q);
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