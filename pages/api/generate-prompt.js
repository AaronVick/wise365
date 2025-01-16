// pages/api/generate-prompt.js
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { llmType, systemMessage } = req.body;

  try {
    let prompt;
    
    if (llmType === 'Anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: systemMessage
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      prompt = data.content[0].text;

    } else if (llmType === 'OpenAI') {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const response = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert prompt engineer.'
          },
          {
            role: 'user',
            content: systemMessage
          }
        ],
        max_tokens: 1000
      });

      prompt = response.data.choices[0].message.content;
    }

    return res.status(200).json({ prompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return res.status(500).json({ error: error.message });
  }
}