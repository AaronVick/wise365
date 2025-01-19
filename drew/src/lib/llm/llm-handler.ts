// src/lib/llm/llm-handler.ts

import { logMessage } from './conversation-manager';
import { callLLM } from './llm-client';

/**
 * Handles LLM interaction and logs the response
 * @param {string} prompt - The prompt sent to the LLM
 * @param {object} context - Additional context for the LLM
 * @param {string} conversationId - The ID of the current conversation
 * @returns {Promise<object>} - The LLM's response with content type
 */
export async function handleLLMResponse(
  prompt: string,
  context: object,
  conversationId: string
): Promise<{ content: string; contentType: string; metadata?: object }> {
  try {
    const response = await callLLM(prompt, context);

    const contentType = detectContentType(response); // Function to detect if the response is text, image, or file
    const metadata = contentType === 'image' ? extractImageMetadata(response) : null; // Example for image metadata

    // Log the response in the database
    await logMessage({
      conversationId,
      role: 'agent',
      content: response.content,
      contentType,
      metadata,
      timestamp: new Date(),
    });

    return { content: response.content, contentType, metadata };
  } catch (error) {
    console.error('Error in handleLLMResponse:', error.message);
    throw new Error('Failed to handle LLM response');
  }
}

/**
 * Detects the content type of the LLM response
 * @param {object} response - The response from the LLM
 * @returns {string} - The content type (text, image, file)
 */
function detectContentType(response) {
  if (response.startsWith('http') && response.endsWith('.png')) {
    return 'image';
  }
  // Add logic for other file types
  return 'text';
}
