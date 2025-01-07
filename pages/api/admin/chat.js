//  pages/api/admin/chat.js

import { Configuration, OpenAIApi } from 'openai';
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

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received chat request:', req.body);

  const { agentId, message, prompt } = req.body;

  // Input Validation
  if (!agentId || !message || !prompt) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId: !agentId, message: !message, prompt: !prompt }
    });
  }

  try {
    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Sending request to OpenAI...');
    const openaiRes = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Received OpenAI response');
    const reply = openaiRes.data.choices[0]?.message?.content?.trim();
    
    if (!reply) {
      throw new Error('No response received from OpenAI');
    }

    // Format messages for Firestore
    const conversationMessages = [
      `"role": "admin", "content": "${message}"`,
      `"role": "${agentId}", "content": "${reply}"`
    ];

    // Save to conversations collection
    console.log('Saving to Firestore...');
    await db.collection('conversations').add({
      agentID: agentId,  // Match your schema (agentID not agentId)
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      createdBy: 'admin',
      isShared: true,
      messages: conversationMessages,
      name: `Admin Chat with ${agentId}`,
      participants: ['admin', agentId],
      teamID: 'admin_team'  // Match your schema (teamID not teamId)
    });

    console.log('Chat saved successfully');
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat handler error:', error);
    
    // Handle different types of errors
    if (error.response?.data) {
      console.error('OpenAI API Error:', error.response.data);
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