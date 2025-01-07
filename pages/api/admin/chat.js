import admin from '@/lib/firebaseAdmin';
import { Configuration, OpenAIApi } from 'openai';

const db = admin.firestore();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { agentId, message, prompt } = req.body;

    try {
      const openaiRes = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 150,
        temperature: 0.7,
      });

      const reply = openaiRes.data.choices[0]?.text.trim();

      await db.collection('agentChats').add({
        agentId,
        userMessage: message,
        botReply: reply,
        timestamp: admin.firestore.Timestamp.now(),
      });

      res.status(200).json({ reply });
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      res.status(500).json({ error: 'Failed to generate a response.' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed.' });
  }
}
