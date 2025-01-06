//  pages/api/admin/conversations.js

import admin from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { agentId, messages, participants } = req.body;

    try {
      const conversationRef = admin.firestore().collection('conversations').doc(agentId);
      const conversation = await conversationRef.get();

      if (conversation.exists) {
        // Append new messages to the existing conversation
        await conversationRef.update({
          messages: admin.firestore.FieldValue.arrayUnion(...messages),
          lastUpdatedAt: new Date(),
        });
      } else {
        // Create a new conversation document
        await conversationRef.set({
          agentId,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
          messages,
          participants,
          name: `Chat with ${agentId}`,
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving conversation:', error);
      res.status(500).json({ error: 'Failed to save conversation' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
