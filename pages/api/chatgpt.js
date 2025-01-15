// pages/api/chatgpt.js

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agentInfo, agentData } = req.body;

    if (!agentInfo || !agentData) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Prepare payload for OpenAI API
    const openAiPayload = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for generating prompts.' },
        { role: 'assistant', content: `Agent Name: ${agentInfo.agentName}\nRole: ${agentInfo.role}\nContext: ${JSON.stringify(agentData)}` },
        { role: 'user', content: 'Generate a prompt for the given context.' },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAiPayload),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ prompt: data.choices[0].message.content });
  } catch (error) {
    console.error('Error in /api/chatgpt:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
