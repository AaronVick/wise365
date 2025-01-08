// pages/api/admin/chat.js

import { Configuration, OpenAIApi } from 'openai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
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
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  };

  initializeApp({
    credential: cert(serviceAccount),
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

  const { agentId, message, prompt, conversationId, llm = 'chatGPT' } = req.body;

  // Validate the request body
  if (!agentId || !message || !prompt) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId, message, prompt },
    });
  }

  try {
    // Generate response from OpenAI
    const model = llm === 'chatGPT' ? 'gpt-4' : 'other-model'; // Support for future LLMs
    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
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
      const conversationSnapshot = await conversationRef.get();

      if (!conversationSnapshot.exists) {
        throw new Error('Conversation not found');
      }

      await conversationRef.update({
        messages: FieldValue.arrayUnion(
          { role: 'admin', content: message, timestamp: new Date().toISOString() },
          { role: agentId, content: reply, timestamp: new Date().toISOString() }
        ),
        lastUpdatedAt: new Date(),
      });

      chatDoc = conversationRef;
    } else {
      // Create a new conversation
      chatDoc = await db.collection('conversations').add({
        agentID: agentId,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        createdBy: 'admin',
        isShared: true,
        messages: [
          { role: 'admin', content: message, timestamp: new Date().toISOString() },
          { role: agentId, content: reply, timestamp: new Date().toISOString() },
        ],
        participants: ['admin', agentId],
        teamID: 'admin_team',
      });
    }

    return res.status(200).json({
      reply,
      conversationId: chatDoc.id,
    });
  } catch (error) {
    console.error('Error in chat handler:', error);

    // Handle OpenAI API errors
    if (error.response?.data) {
      return res.status(500).json({
        error: 'OpenAI API Error',
        details: error.response.data,
      });
    }

    // General error handling
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
