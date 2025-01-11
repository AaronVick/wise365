// components/ChatWithShawn.js
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ChatInterface from './ChatInterface';

const ChatWithShawn = ({ currentUser }) => {
  const [chatId, setChatId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);
  const [userContext, setUserContext] = useState(null);

  useEffect(() => {
    const initializeShawnChat = async () => {
      if (!currentUser?.uid) return;

      try {
        // Check for existing Shawn conversation
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('agentId', '==', 'shawn'),
          where('participants', 'array-contains', currentUser.uid),
          where('isDefault', '==', true)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Create new conversation with Shawn
          const newChat = await createInitialChat(currentUser);
          setChatId(newChat.id);
          setIsNewUser(true);
        } else {
          setChatId(querySnapshot.docs[0].id);
          setIsNewUser(false);
        }

        // Analyze user context
        await analyzeUserContext(currentUser.uid);
      } catch (error) {
        console.error('Error initializing Shawn chat:', error);
      }
    };

    initializeShawnChat();
  }, [currentUser?.uid]);

  const createInitialChat = async (user) => {
    // Create conversation name first
    const namesRef = collection(db, 'conversationNames');
    const nameDoc = await addDoc(namesRef, {
      agentId: 'shawn',
      conversationName: 'Chat with Shawn',
      userId: user.uid,
      isDefault: true,
      projectName: '',
      timestamp: serverTimestamp()
    });

    // Create initial welcome message
    const welcomeMessage = {
      agentId: 'shawn',
      content: "Hi! I'm Shawn, your personal guide to Business Wise365. I'll help you navigate our platform and connect you with the right experts for your business needs. What would you like to focus on today?",
      conversationName: nameDoc.id,
      from: 'shawn',
      isDefault: true,
      timestamp: serverTimestamp(),
      type: 'agent'
    };

    const messagesRef = collection(db, 'conversations');
    await addDoc(messagesRef, welcomeMessage);

    return nameDoc;
  };

  const analyzeUserContext = async (userId) => {
    try {
      // Get chat history
      const response = await fetch('/api/analyze-chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const analysis = await response.json();
        setUserContext(analysis);

        // If there's meaningful context, have Shawn provide personalized suggestions
        if (analysis.groupedData && Object.keys(analysis.groupedData).length > 0) {
          const suggestionsResponse = await fetch('/api/analyze-user-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              conversations: analysis.groupedData,
              currentUser
            }),
          });

          if (suggestionsResponse.ok) {
            const suggestions = await suggestionsResponse.json();
            // Store suggestions for Shawn to reference
            setUserContext(prev => ({
              ...prev,
              suggestions
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing user context:', error);
    }
  };

  if (!chatId) {
    return <div>Initializing chat with Shawn...</div>;
  }

  return (
    <ChatInterface
      chatId={chatId}
      agentId="shawn"
      userId={currentUser.uid}
      isDefault={true}
      title="Chat with Shawn"
      conversationName={chatId}
      userContext={userContext}
      isNewUser={isNewUser}
    />
  );
};

export default ChatWithShawn;