// pages/api/admin/prompts/generate.js

import { Configuration, OpenAIApi } from 'openai';
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

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, llm } = req.body;

  if (!agentId || !llm) {
    return res.status(400).json({
      error: 'Missing required fields',
      details: { agentId, llm },
    });
  }

  try {
    // Fetch agent data
    const agentSnapshot = await db
      .collection('agentsDefined')
      .where('agentId', '==', agentId)
      .get();

    if (agentSnapshot.empty) {
      return res.status(404).json({ error: `Agent ${agentId} not found` });
    }

    const agentData = agentSnapshot.docs[0].data();

    // Fetch additional agent data
    const agentDataSnapshot = await db
      .collection('agentData')
      .where('agentId', '==', agentId)
      .get();

    const agentDataDocs = [];
    agentDataSnapshot.forEach(doc => {
      agentDataDocs.push(doc.data());
    });

    // Create prompt for GPT to analyze and suggest improvements
    const promptForGPT = `Given the following information about an AI agent, generate an optimized system prompt for ${llm === 'chatGPT' ? 'GPT-4' : 'Claude'}.

Agent Information:
Name: ${agentData.agentName}
Role: ${agentData.Role}
About: ${agentData.About}
Role Info: ${agentData.RoleInfo}
Type: ${agentData.Type}
Personality: ${agentData.personality}
Tasks: ${agentData.tasks ? agentData.tasks.join(', ') : ''}

Additional Data:
${agentDataDocs.map(doc => `
Type: ${doc.dataType}
Description: ${doc.description}
Data: ${JSON.stringify(doc.data || {})}
Examples: ${doc.examples || ''}
Traits: ${doc.traits ? doc.traits.join(', ') : ''}
`).join('\n')}

Current Prompt:
${agentData.prompt?.[llm === 'chatGPT' ? 'openAI' : 'Anthropic']?.description || 'No current prompt'}

Based on all this information, generate a new optimized system prompt that:
1. Captures the agent's core functionality and personality
2. Is formatted appropriately for the chosen LLM (${llm})
3. Incorporates key examples and traits
4. Maintains a clear, concise structure
5. Includes specific guidance on how to handle different types of user interactions

Return only the prompt text, without any explanations or metadata.`;

    // Generate new prompt using GPT-4
    const completion = await openai.createChatCompletion({
      model: llm === 'chatGPT' ? 'gpt-4' : 'claude',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    if (!completion.data.choices[0]?.message?.content) {
      console.error('OpenAI response error:', completion.data);
      throw new Error('No reply received from OpenAI');
    }

    const generatedPrompt = completion.data.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }

    return res.status(200).json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return res.status(500).json({ 
      error: 'Failed to generate prompt',
      details: error.message 
    });
  }
}