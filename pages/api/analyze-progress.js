// pages/api/analyze-progress.js

import { Configuration, OpenAIApi } from "openai";

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { milestone, userData, task } = req.body;

    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant helping to analyze user progress through business development milestones.',
      },
      {
        role: 'user',
        content: `Please analyze the following milestone progress:
          Milestone: ${JSON.stringify(milestone, null, 2)}
          User Data: ${JSON.stringify(userData, null, 2)}
          Task: ${task}`,
      },
    ];

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.data.choices[0].message.content;
    const progressMatch = responseText.match(/progress: (\d+)/i);
    const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;

    return res.status(200).json({
      progress,
      explanation: responseText,
    });
  } catch (error) {
    console.error('Error analyzing progress:', error);
    return res.status(500).json({ error: 'Error analyzing progress' });
  }
}
