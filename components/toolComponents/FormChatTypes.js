// components/toolComponents/FormChatTypes.js

/**
 * Message types for chat interactions
 */
export const MessageType = {
  USER: 'user',
  AGENT: 'agent',
  SYSTEM: 'system',
  ERROR: 'error'
};

/**
 * Types of assistance an agent can provide
 */
export const AssistanceType = {
  FIELD_HELP: 'field_help',      // Help with specific field
  GENERAL_HELP: 'general_help',  // General form guidance
  EXAMPLES: 'examples',          // Provide examples
  CLARIFICATION: 'clarification' // Clarify requirements
};

/**
 * Chat interface states
 */
export const ChatState = {
  CLOSED: 'closed',
  OPEN: 'open',
  LOADING: 'loading'
};

/**
 * Helper function to format timestamps in chat
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

export default {
  MessageType,
  AssistanceType,
  ChatState,
  formatTimestamp
};