// pages/api/claude.js

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

    // Prepare payload for Anthropic Claude API
    const anthropicPayload = {
      model: 'claude-3.5',
      prompt: `
        Agent Name: ${agentInfo.agentName}
        Role: ${agentInfo.role}
        Context: ${JSON.stringify(agentData)}
        Generate a helpful and specific prompt for this agent.
      `,
      max_tokens_to_sample: 1000,
      temperature: 0.7,
    };

    const response = await fetch('https://api.anthropic.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ prompt: data.completion });
  } catch (error) {
    console.error('Error in /api/claude:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
