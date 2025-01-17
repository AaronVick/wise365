// components/ChatWithShawn.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseService from '../lib/services/firebaseService';
import ChatInterface from './ChatInterface';
import { evaluateUserFunnels } from './milestoneFunnels/funnelEvaluator';
import { useProgressAnalyzer } from './milestoneFunnels/ProgressAnalyzer';

const ChatWithShawn = ({ 
  currentUser,
  chatId: parentChatId,  // Rename to avoid conflict with state
  userId,
  isDefault = true,
  title = 'Chat with Shawn',
  conversationName: parentConversationName,
  isNewUser: parentIsNewUser
}) => {
  // Keep internal state for managing chat initialization
  const [localChatId, setLocalChatId] = useState(parentChatId || null);
  const [isNewUser, setIsNewUser] = useState(parentIsNewUser !== undefined ? parentIsNewUser : true);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    const initializeShawnChat = async () => {
      if (!currentUser?.uid) return;

      try {
        // If we already have a chat ID from props, use that
        if (parentChatId) {
          setLocalChatId(parentChatId);
          // Still get context and update chat if needed
          const context = await analyzeUserContext(currentUser);
          setUserContext(context);
          const funnels = await getFunnels();
          const userFunnelData = await getUserFunnelData(currentUser);
          const funnelEvaluation = evaluateUserFunnels(funnels, currentUser, userFunnelData);
          await updateExistingChat(parentChatId, currentUser, context, funnelEvaluation);
          return;
        }

        // Otherwise, follow the original initialization flow
        const existingChat = await checkForExistingChat(currentUser);
        const context = await analyzeUserContext(currentUser);
        setUserContext(context);

        const funnels = await getFunnels();
        const userFunnelData = await getUserFunnelData(currentUser);
        const funnelEvaluation = evaluateUserFunnels(funnels, currentUser, userFunnelData);

        if (!existingChat) {
          const newChatId = await createInitialShawnChat(currentUser, context, funnelEvaluation);
          setLocalChatId(newChatId);
          setIsNewUser(true);
        } else {
          await updateExistingChat(existingChat.id, currentUser, context, funnelEvaluation);
          setLocalChatId(existingChat.id);
          setIsNewUser(false);
        }
      } catch (error) {
        console.error('Error initializing Shawn chat:', error);
      }
    };

    initializeShawnChat();
  }, [currentUser, parentChatId]);

  // Show loading state if we don't have a chat ID yet
  if (!localChatId && !parentChatId) {
    return <div>Initializing chat with Shawn...</div>;
  }

  const checkForExistingChat = async (user) => {
    const chats = await firebaseService.queryCollection('conversationNames', {
      where: [
        { field: 'agentId', operator: '==', value: 'shawn' },
        { field: 'userId', operator: '==', value: user.authenticationID },
        { field: 'isDefault', operator: '==', value: true }
      ]
    });
    return chats[0] || null;
  };

  const createInitialShawnChat = async (user, context, funnelEvaluation) => {
    // Create conversation name entry
    const chatData = {
      agentId: 'shawn',
      conversationName: 'Chat with Shawn',
      userId: user.authenticationID,
      isDefault: true,
      timestamp: serverTimestamp()
    };

    const newChat = await firebaseService.create('conversationNames', chatData);

    // Generate personalized welcome message
    const welcomeMessage = generateWelcomeMessage(user, context, funnelEvaluation);

    // Create initial message
    await firebaseService.create('conversations', {
      agentId: 'shawn',
      content: welcomeMessage,
      conversationName: newChat.id,
      from: 'shawn',
      isDefault: true,
      timestamp: serverTimestamp(),
      type: 'agent'
    });

    return newChat.id;
  };

  const updateExistingChat = async (chatId, user, context, funnelEvaluation) => {
    // Get last message timestamp
    const lastMessage = await getLastMessage(chatId);
    const timeSinceLastMessage = lastMessage ? Date.now() - lastMessage.timestamp?.toDate() : Infinity;

    // If it's been more than 24 hours or context suggests important updates
    if (timeSinceLastMessage > 24 * 60 * 60 * 1000 || hasSignificantUpdates(context)) {
      const updateMessage = generateUpdateMessage(user, context, funnelEvaluation);
      
      await firebaseService.create('conversations', {
        agentId: 'shawn',
        content: updateMessage,
        conversationName: chatId,
        from: 'shawn',
        isDefault: true,
        timestamp: serverTimestamp(),
        type: 'agent'
      });
    }
  };

  const generateWelcomeMessage = (user, context, funnelEvaluation) => {
    const firstName = user.name?.split(' ')[0] || 'there';
    const isOnboarding = funnelEvaluation.inProgress.some(f => 
      f.name.toLowerCase() === 'onboarding funnel'
    );

    if (isOnboarding) {
      const firstMilestone = funnelEvaluation.inProgress[0]?.milestones[0];
      return `Hi ${firstName}! I'm Shawn, your personal guide to Business Wise365. I see you're just getting started! Let's begin with ${firstMilestone?.name || 'setting up your profile'}. What questions do you have about getting started?`;
    } else {
      const nextActions = context.nextSteps.slice(0, 2);
      return `Hi ${firstName}! I'm Shawn, and I notice you might be interested in ${nextActions.join(' or ')}. Would you like to explore either of these, or is there something else I can help you with?`;
    }
  };

  const generateUpdateMessage = (user, context, funnelEvaluation) => {
    const firstName = user.name?.split(' ')[0] || 'there';
    const { insights, blockers, nextSteps } = context;

    if (blockers.length > 0) {
      return `Hi ${firstName}! I noticed you might be stuck with ${blockers[0]}. Would you like help resolving this so we can move forward?`;
    }

    if (nextSteps.length > 0) {
      return `Welcome back ${firstName}! Based on your progress, I think we should focus on ${nextSteps[0]}. Would you like to explore this together?`;
    }

    return `Hi ${firstName}! How can I help you progress with your business goals today?`;
  };

  const hasSignificantUpdates = (context) => {
    return context.blockers.length > 0 || context.nextSteps.length > 0;
  };

  const getLastMessage = async (chatId) => {
    const messages = await firebaseService.queryCollection('conversations', {
      where: [{ field: 'conversationName', operator: '==', value: chatId }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 1
    });
    return messages[0] || null;
  };

  // Return ChatInterface with enhanced context
  return (
    <ChatInterface
      chatId={parentChatId || localChatId}
      agentId="shawn"
      userId={userId || currentUser?.authenticationID}
      isDefault={isDefault}
      title={title}
      conversationName={parentConversationName || parentChatId || localChatId}
      userContext={userContext}
      isNewUser={isNewUser}
    />
  );
};

export default ChatWithShawn;