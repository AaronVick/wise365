// pages/api/chat.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",  // or your preferred model
      messages: messages,
      temperature: 0.7,
    });

    return res.status(200).json({ 
      reply: completion.data.choices[0].message.content 
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ 
      error: 'Error processing chat request' 
    });
  }
}