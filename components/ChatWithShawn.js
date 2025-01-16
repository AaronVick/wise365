// components/ChatWithShawn.js
// This component initializes or continues a chat with the default agent "Shawn",
// evaluates user context, and dynamically incorporates funnel insights.

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseService from '../../lib/services/firebaseService';


import ChatInterface from './ChatInterface';
import { evaluateUserFunnels } from './funnelEvaluator';
import { useProgressAnalyzer } from './ProgressAnalyzer';
import { createFunnelProject } from './FunnelActionHandler';

const ChatWithShawn = ({ currentUser }) => {
  // State management
  const [chatId, setChatId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [userContext, setUserContext] = useState(null);

  // Initialize or continue Shawn chat when the component loads
  useEffect(() => {
    const initializeShawnChat = async () => {
      if (!currentUser?.uid) return;

      try {
        // Step 1: Check for existing conversation
        const checkForExistingChat = async (user) => {
          const chats = await firebaseService.queryCollection('conversationNames', {
            where: [
              { field: 'agentId', operator: '==', value: 'shawn' },
              { field: 'userId', operator: '==', value: user.authenticationID },
              { field: 'isDefault', operator: '==', value: true }
            ]
          });
          return chats.empty ? null : chats[0].id;
        };

        // Step 3: Analyze user context for insights
        const context = await analyzeUserContext(currentUser);
        setUserContext(context);
      } catch (error) {
        console.error('Error initializing Shawn chat:', error);
      }
    };

    initializeShawnChat();
  }, [currentUser]);

  // Render ChatInterface once chatId is available, or show a loading message
  return (
    chatId ? (
      <ChatInterface
        chatId={chatId}
        agentId="shawn"
        userId={currentUser.uid}
        isDefault
        title="Chat with Shawn"
        conversationName={chatId}
        userContext={userContext}
        isNewUser={isNewUser}
      />
    ) : (
      <div>Initializing chat with Shawn...</div>
    )
  );
};


/**
 * Checks if a default chat with Shawn already exists for the user.
 * @param {Object} user - Current user object.
 * @returns {string|null} Chat ID if exists, otherwise null.
 */
const checkForExistingChat = async (user) => {
  const conversationsRef = collection(db, 'conversationNames');
  const q = query(
    conversationsRef,
    where('agentId', '==', 'shawn'),
    where('userId', '==', user.authenticationID),
    where('isDefault', '==', true)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty ? null : querySnapshot.docs[0].id;
};


/**
 * Retrieves the onboarding funnel for the user by evaluating available funnels.
 * @param {Object} user - Current user object.
 * @returns {Object|null} Onboarding funnel object if available, otherwise null.
 */
const getOnboardingFunnel = async (user) => {
  const funnelsRef = collection(db, 'funnels');
  const funnelSnapshot = await getDocs(funnelsRef);
  const allFunnels = funnelSnapshot.docs.map(doc => doc.data());

  const userFunnelData = {}; // Placeholder for user funnel data
  const evaluatedFunnels = evaluateUserFunnels(allFunnels, user, userFunnelData);

  return evaluatedFunnels.inProgress.find(
    funnel => funnel.name.toLowerCase() === 'onboarding funnel'
  ) || null;
};



/**
 * Creates a new chat with Shawn, incorporating funnel insights and LLM-generated context.
 * @param {Object} user - Current user object.
 * @param {Object} funnel - Onboarding funnel data.
 * @returns {string} Chat ID of the newly created conversation.
 */
const createInitialChatWithInsights = async (user, funnel) => {
  const namesRef = collection(db, 'conversationNames');
  const nameDoc = await addDoc(namesRef, {
    agentId: 'shawn',
    conversationName: 'Chat with Shawn',
    userId: user.uid,
    isDefault: true,
    projectName: funnel.name,
    timestamp: serverTimestamp(),
  });

  const chatId = nameDoc.id;

  // Gather funnel insights and pass them to the LLM
  const insights = await gatherFunnelInsights(user, funnel);
  const llmPayload = {
    user: {
      name: user.name,
      role: user.role || "team member",
    },
    funnel: {
      name: funnel.name,
      milestones: funnel.milestones.map(m => m.name),
      insights: insights.nextSteps,
      blockers: insights.blockers,
    },
    agent: {
      name: "Shawn",
      role: "Tool Guidance Assistant",
    },
  };

  // Fetch LLM-generated opening message
  const llmResponse = await fetch('/api/generate-chat-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(llmPayload),
  });

  let openingMessage = "Hi! I'm Shawn. How can I assist you today?"; // Fallback message
  if (llmResponse.ok) {
    const llmData = await llmResponse.json();
    openingMessage = llmData.message || openingMessage;
  }

  // Save the LLM-generated message to Firebase
  const messagesRef = collection(db, 'conversations');
  await addDoc(messagesRef, {
    agentId: 'shawn',
    content: openingMessage,
    conversationName: chatId,
    from: 'shawn',
    isDefault: true,
    timestamp: serverTimestamp(),
    type: 'agent',
  });

  return chatId;
};




/**
 * Gathers insights for the user's funnel using progress analysis and milestone data.
 * @param {Object} user - Current user object.
 * @param {Object} funnel - Onboarding funnel data.
 * @returns {Object} Insights containing next steps, blockers, and other analysis.
 */
const gatherFunnelInsights = async (user, funnel) => {
  try {
    // Analyze progress for the first milestone in the funnel
    const { analysis } = useProgressAnalyzer(user, funnel, funnel.milestones[0]);

    return analysis || { nextSteps: [], insights: [], blockers: [] };
  } catch (error) {
    console.error('Error gathering funnel insights:', error);
    return { nextSteps: [], insights: [], blockers: [] };
  }
};




/**
 * Analyzes the user's context by examining past conversation history and generating insights.
 * @param {Object} user - Current user object.
 * @returns {Object} Analyzed context with insights, blockers, and recommendations.
 */
const analyzeUserContext = async (user) => {
  try {
    // Step 1: Fetch conversation history from Firebase
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const conversations = querySnapshot.docs.map(doc => doc.data());

    // Step 2: Send conversation data to LLM for analysis
    const response = await fetch('/api/analyze-chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid, conversations }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze chat history.');
    }

    const analysis = await response.json();

    // Step 3: Generate recommendations based on analyzed data
    const recommendationsResponse = await fetch('/api/analyze-user-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        groupedData: analysis.groupedData,
      }),
    });

    if (!recommendationsResponse.ok) {
      throw new Error('Failed to analyze user context.');
    }

    const recommendations = await recommendationsResponse.json();

    return {
      insights: analysis.insights || [],
      blockers: recommendations.blockers || [],
      nextSteps: recommendations.nextSteps || [],
    };
  } catch (error) {
    console.error('Error analyzing user context:', error);
    return { insights: [], blockers: [], nextSteps: [] };
  }
};




// Export the main ChatWithShawn component
export default ChatWithShawn;
