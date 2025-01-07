// pages/api/admin/chat.js

import { Configuration, OpenAIApi } from 'openai';
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

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, message, prompt, conversationId, isNewConversation } = req.body;

  if (!agentId || !message || !prompt) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId: !agentId, message: !message, prompt: !prompt }
    });
  }

  try {
    // Send to OpenAI
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply = completion.data.choices[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error('No response from OpenAI');
    }

    let chatDoc;
    if (conversationId) {
      // Update existing conversation
      const conversationRef = db.collection('conversations').doc(conversationId);
      const conversation = await conversationRef.get();
      
      if (!conversation.exists) {
        throw new Error('Conversation not found');
      }

      const newMessages = [
        `"role": "admin", "content": "${message}", "timestamp": "${new Date().toISOString()}"`,
        `"role": "${agentId}", "content": "${reply}", "timestamp": "${new Date().toISOString()}"`
      ];
      
      // When creating a new conversation:
      chatDoc = await db.collection('conversations').add({
        agentID: agentId,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        createdBy: 'admin',
        isShared: true,
        messages: [
          `"role": "admin", "content": "${message}", "timestamp": "${new Date().toISOString()}"`,
          `"role": "${agentId}", "content": "${reply}", "timestamp": "${new Date().toISOString()}"`
        ],
        participants: ['admin', agentId],
        teamID: 'admin_team'
      });

      await conversationRef.update({
        messages: [...(conversation.data().messages || []), ...newMessages],
        lastUpdatedAt: new Date()
      });

      chatDoc = conversationRef;
    } else {
      // Create new conversation if needed
      chatDoc = await db.collection('conversations').add({
        agentID: agentId,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        createdBy: 'admin',
        isShared: true,
        messages: [
          JSON.stringify({ role: 'admin', content: message }),
          JSON.stringify({ role: agentId, content: reply })
        ],
        participants: ['admin', agentId],
        teamID: 'admin_team'
      });
    }

    return res.status(200).json({ 
      reply,
      conversationId: chatDoc.id 
    });
  } catch (error) {
    console.error('Error in chat handler:', error);
    
    if (error.response?.data) {
      return res.status(500).json({
        error: 'OpenAI API Error',
        details: error.response.data
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
}