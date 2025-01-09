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

        if (!messages || !Array.isArray(messages)) {
            console.error('Invalid messages format:', messages);
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        console.log('Sending request to OpenAI with messages:', messages);

        const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        });

        const reply = completion.data.choices[0]?.message?.content;
        if (!reply) {
            console.error('No reply received from OpenAI:', completion.data);
            return res.status(500).json({ error: 'Failed to receive response from OpenAI' });
        }

        console.log('OpenAI response received:', reply);
        return res.status(200).json({ reply });
    } catch (error) {
        console.error('Error processing LLM request:', error.message, error.stack);
        if (error.response) {
            console.error('OpenAI API error response:', error.response.data);
        }
        return res.status(500).json({ error: 'Failed to process request', details: error.message });
    }
}
