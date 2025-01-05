// services/goalDetection.js
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Goal detection patterns
const goalPatterns = {
  content_creation: {
    triggers: [
      "let's create content",
      "create a month",
      "content calendar",
      "post schedule"
    ],
    metadata: {
      type: "content_creation",
      defaultDuration: 30, // days
      priority: "high"
    }
  },
  strategy: {
    triggers: [
      "develop a strategy",
      "marketing plan",
      "campaign strategy"
    ],
    metadata: {
      type: "strategy",
      defaultDuration: 14, // days
      priority: "high"
    }
  }
  // Add more patterns as needed
};

export const detectAndCreateGoal = async (message, conversationId, userId, teamId, agentId) => {
  try {
    const messageText = message.content.toLowerCase();
    let detectedGoal = null;

    // Check message against patterns
    for (const [key, pattern] of Object.entries(goalPatterns)) {
      if (pattern.triggers.some(trigger => messageText.includes(trigger))) {
        detectedGoal = {
          type: pattern.metadata.type,
          title: extractGoalTitle(messageText),
          description: messageText,
          priority: pattern.metadata.priority
        };
        break;
      }
    }

    if (detectedGoal) {
      // Create new goal in Firestore
      const goalsRef = collection(db, 'goals');
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + pattern.metadata.defaultDuration);

      await addDoc(goalsRef, {
        ...detectedGoal,
        userId,
        teamId,
        agentId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dueDate,
        autoCreated: true,
        sourceConversationId: conversationId,
        notes: []
      });

      return true;
    }

    return false;
  } catch (error) {
    console.error('Error in goal detection:', error);
    return false;
  }
};

// Helper function to extract a meaningful title from the message
const extractGoalTitle = (message) => {
  // Basic extraction - could be enhanced with AI/NLP
  const sentences = message.split(/[.!?]+/);
  return sentences[0].slice(0, 100) + (sentences[0].length > 100 ? '...' : '');
};