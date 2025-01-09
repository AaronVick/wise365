// /pages/api/chat.js
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            console.error('Invalid messages format:', messages);
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        console.log('Sending request to OpenAI with messages:', messages);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        });

        const reply = completion.choices[0]?.message?.content;
        if (!reply) {
            console.error('No reply received from OpenAI:', completion);
            return res.status(500).json({ error: 'Failed to receive response from OpenAI' });
        }

        console.log('OpenAI response received:', reply);
        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Error processing LLM request:', error.message, error.stack);
        if (error.response) {
            console.error('OpenAI API error response:', error.response.data);
        }
        return res.status(500).json({ 
            error: 'Failed to process request', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}