//  pages/api/admin/chat.js

import { Configuration, OpenAIApi } from 'openai';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

const db = getFirestore();

// Initialize OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!configuration.apiKey) {
  console.error('OpenAI API key is missing');
}

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received chat request');

  const { agentId, message, prompt } = req.body;

  // Input Validation
  if (!agentId || !message || !prompt) {
    console.log('Missing fields:', { agentId: !agentId, message: !message, prompt: !prompt });
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId: !agentId, message: !message, prompt: !prompt }
    });
  }

  try {
    // Verify OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    console.log('Sending request to OpenAI...');
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('Received OpenAI response');
    
    if (!completion.data?.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response:', completion.data);
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    const reply = completion.data.choices[0].message.content.trim();

    // Save to conversations collection
    console.log('Saving to Firestore...');
    const docRef = await db.collection('conversations').add({
      agentID: agentId,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      createdBy: 'admin',
      isShared: true,
      messages: [
        JSON.stringify({ role: 'admin', content: message }),
        JSON.stringify({ role: agentId, content: reply })
      ],
      name: `Admin Chat with ${agentId}`,
      participants: ['admin', agentId],
      teamID: 'admin_team'
    });

    console.log('Chat saved successfully with ID:', docRef.id);
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat handler error:', error);
    
    // Handle OpenAI API errors
    if (error.response?.data) {
      console.error('OpenAI API Error:', error.response.data);
      return res.status(500).json({
        error: 'OpenAI API Error',
        details: error.response.data
      });
    }

    // Handle other errors
    const errorMessage = error.message || 'Internal server error';
    console.error('Error details:', errorMessage);
    return res.status(500).json({
      error: errorMessage
    });
  }
}