// /pages/api/chat.js
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to validate message structure
const validateMessages = (messages) => {
    if (!messages || !Array.isArray(messages)) {
        return {
            valid: false,
            error: 'Messages must be an array'
        };
    }

    const isValidMessage = messages.every(msg => 
        msg && 
        typeof msg === 'object' && 
        ['system', 'user', 'assistant'].includes(msg.role) &&
        typeof msg.content === 'string'
    );

    if (!isValidMessage) {
        return {
            valid: false,
            error: 'Each message must have valid role and content'
        };
    }

    return {
        valid: true
    };
};

// Helper function to format OpenAI error response
const formatOpenAIError = (error) => {
    return {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
        details: error.response?.data
    };
};

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
        return res.status(405).json({ 
            error: 'Method not allowed',
            allowedMethods: ['POST']
        });
    }

    try {
        console.log('Chat API received request:', {
            method: req.method,
            headers: req.headers,
            bodyLength: JSON.stringify(req.body).length,
            timestamp: new Date().toISOString()
        });

        const { messages } = req.body;

        // Validate incoming messages
        const validation = validateMessages(messages);
        if (!validation.valid) {
            console.error('Message validation failed:', validation.error);
            return res.status(400).json({
                error: 'Invalid message format',
                details: validation.error,
                receivedMessages: messages
            });
        }

        // Log the incoming messages for debugging
        console.log('Processing messages:', messages.map(m => ({
            role: m.role,
            contentLength: m.content.length,
            contentPreview: m.content.substring(0, 100) + '...'
        })));

        // Make request to OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        });

        const reply = completion.choices[0]?.message?.content;
        
        // Validate OpenAI response
        if (!reply) {
            console.error('Empty response from OpenAI:', completion);
            return res.status(500).json({ 
                error: 'No response content from OpenAI',
                completion: {
                    id: completion.id,
                    model: completion.model,
                    choices: completion.choices
                }
            });
        }

        // Log successful response
        console.log('OpenAI response received:', {
            completionId: completion.id,
            replyLength: reply.length,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({ 
            reply,
            metadata: {
                completionId: completion.id,
                model: completion.model,
                usage: completion.usage
            }
        });

    } catch (error) {
        console.error('Error in chat API:', {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });

        // Handle specific OpenAI API errors
        if (error.response) {
            const openAIError = formatOpenAIError(error);
            return res.status(error.status || 500).json({
                error: 'OpenAI API Error',
                details: openAIError
            });
        }

        // Handle other errors
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            ...(process.env.NODE_ENV === 'development' && {
                stack: error.stack,
                details: error.toString()
            })
        });
    }
}