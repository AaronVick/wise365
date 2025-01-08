// pages/api/admin/prompts/save.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, llm, prompt } = req.body;

  if (!agentId || !llm || !prompt) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId, llm, promptProvided: !!prompt },
    });
  }

  try {
    // Get agent document reference
    const agentSnapshot = await db
      .collection('agentsDefined')
      .where('agentId', '==', agentId)
      .get();

    if (agentSnapshot.empty) {
      return res.status(404).json({ error: `Agent ${agentId} not found` });
    }

    const agentDoc = agentSnapshot.docs[0];
    const agentData = agentDoc.data();

    // Get current prompt data
    const llmKey = llm === 'chatGPT' ? 'openAI' : 'Anthropic';
    const currentPrompt = agentData.prompt?.[llmKey]?.description;

    // Prepare update data
    const updateData = {
      [`prompt.${llmKey}`]: {
        description: prompt,
        version: llm === 'chatGPT' ? 'ChatGPT-4' : 'Claude-3_5-Sonet',
        lastUpdated: new Date().toISOString()
      }
    };

    // If there's a current prompt, store it in history
    if (currentPrompt) {
      updateData[`prompt.${llmKey}.history`] = {
        prompt: currentPrompt,
        timestamp: agentData.prompt?.[llmKey]?.lastUpdated || new Date().toISOString(),
        version: agentData.prompt?.[llmKey]?.version
      };
    }

    // Update the document
    await db.collection('agentsDefined').doc(agentDoc.id).update(updateData);

    return res.status(200).json({ 
      success: true,
      message: 'Prompt updated successfully'
    });

  } catch (error) {
    console.error('Error saving prompt:', error);
    return res.status(500).json({ 
      error: 'Failed to save prompt',
      details: error.message 
    });
  }
}