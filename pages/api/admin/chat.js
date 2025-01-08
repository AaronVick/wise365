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

  const { agentId, message, conversationId, llm = 'chatGPT' } = req.body;

  if (!agentId || !message) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId, message },
    });
  }

  try {
    // Fetch agent data from `agentsDefined`
    const agentQuerySnapshot = await db
      .collection('agentsDefined')
      .where('agentId', '==', agentId)
      .get();

    if (agentQuerySnapshot.empty) {
      return res.status(404).json({ error: `Agent ${agentId} not found.` });
    }

    const agentData = agentQuerySnapshot.docs[0].data();

    // Retrieve the appropriate prompt based on the selected LLM
    const llmKey = llm === 'chatGPT' ? 'openAI' : 'Anthropic';
    const promptData = agentData.prompt?.[llmKey];

    if (!promptData || !promptData.description) {
      return res.status(400).json({
        error: `No prompt found for agent ${agentId} and LLM ${llm}`,
        details: { availablePrompts: Object.keys(agentData.prompt || {}) },
      });
    }

    const systemPrompt = promptData.description;

    // Generate response from OpenAI
    const model = llm === 'chatGPT' ? 'gpt-4' : 'claude-v1'; // Adjust model for each LLM
    const completion = await openai.createChatCompletion({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
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
          { from: 'admin', conversation: message, timestamp: new Date().toISOString() },
          { from: agentId, conversation: reply, timestamp: new Date().toISOString() }
        ),
        lastUpdatedAt: new Date(),
      });
    
      chatDoc = conversationRef;
    } else {
      // Create a new conversation
      chatDoc = await db.collection('conversations').add({
        agentId: agentId,  // Changed from agentID to match your structure
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        createdBy: 'admin',
        isShared: true,
        from: 'admin',
        conversation: message,
        chatName: '',
        conversationName: '',
        timestamp: new Date().toISOString(),
        userId: 'admin'
      });
    }

    

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

    if (error.response?.data) {
      return res.status(500).json({
        error: 'OpenAI API Error',
        details: error.response.data,
      });
    }

    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
