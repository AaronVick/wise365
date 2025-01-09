// pages/api/chat.js
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  console.log('=== API Request Started ===');
  
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, agentId, conversationName, isDefault } = req.body;
    console.log('Received request payload:', {
      agentId,
      conversationName,
      isDefault,
      messageCount: messages?.length,
      messages: messages // Log full messages for debugging
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Log the system prompt being used
    const systemPrompt = messages.find(m => m.role === 'system')?.content;
    console.log('System prompt:', systemPrompt);

    // Log the user's message
    const userMessage = messages.find(m => m.role === 'user')?.content;
    console.log('User message:', userMessage);

    console.log('Sending request to OpenAI...');
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000, // Adjust as needed
      presence_penalty: 0.6, // Helps maintain context
      frequency_penalty: 0.6, // Helps avoid repetition
    });

    console.log('OpenAI response received:', {
      status: completion.status,
      statusText: completion.statusText,
      usage: completion.data.usage,
      finishReason: completion.data.choices[0].finish_reason
    });

    const reply = completion.data.choices[0].message.content;
    console.log('Agent reply:', reply);

    // Send back the response with additional metadata
    const response = {
      reply,
      metadata: {
        agentId,
        conversationName,
        isDefault,
        timestamp: new Date().toISOString(),
        tokensUsed: completion.data.usage?.total_tokens
      }
    };

    console.log('Sending response to client:', response);
    console.log('=== API Request Completed Successfully ===');

    return res.status(200).json(response);
  } catch (error) {
    console.error('=== API Error ===');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    if (error.response) {
      console.error('OpenAI API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    // Send detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        error: 'Error processing chat request',
        details: error.message,
        stack: error.stack,
        openaiError: error.response?.data
      });
    }

    return res.status(500).json({ 
      error: 'Error processing chat request' 
    });
  }
}