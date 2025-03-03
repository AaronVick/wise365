// components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import firebaseService from '../lib/services/firebaseService';

import { analyzeMessage } from '../pages/api/funnelAnalyzer';


import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const ChatInterface = ({ 
  chatId, 
  agentId, 
  userId, 
  isDefault, 
  title, 
  conversationName,
  projectId,
  projectName 
}) => {
  if (!chatId || !userId) {
    console.error('Missing required props:', { chatId, userId });
    return <div className="p-4">Missing required chat information</div>;
  }

  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentContext, setAgentContext] = useState('');
  const [userName, setUserName] = useState('');
  const [currentConversationContext, setCurrentConversationContext] = useState('');
  const scrollRef = useRef(null);

  const conversationNameRef = conversationName;


  // chat summary and context fetching

  // Function to get specific conversation context
  const getConversationContext = async () => {
    if (!conversationName || isDefault) return '';

    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('conversationName', '==', conversationName),
        orderBy('timestamp', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const conversationMessages = snapshot.docs.map(doc => doc.data());
      
      if (conversationMessages.length > 0) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Analyze these messages and provide a brief context of what is being specifically discussed or worked on in this conversation. Focus on the main topic, goals, and any specific projects or tasks being addressed.'
              },
              {
                role: 'user',
                content: conversationMessages
                  .map(msg => `${msg.type === 'user' ? 'User' : 'Agent'}: ${msg.content}`)
                  .join('\n')
              }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          return `Current Conversation Focus: ${result.reply}`;
        }
      }
      return '';
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return '';
    }
  };

  // Function to get chat summary
  const getChatSummary = async (previousMessages) => {
    if (previousMessages.length === 0) return '';

    try {
      const chatHistory = previousMessages
        .map(msg => `${msg.type === 'user' ? 'User' : 'Agent'}: ${msg.content}`)
        .join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Please provide a brief, relevant summary of the following conversation history. Focus on key points, decisions, and important context. Keep it concise and actionable.'
            },
            { role: 'user', content: chatHistory }
          ],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.reply;
      }
      return '';
    } catch (error) {
      console.error('Error getting chat summary:', error);
      return '';
    }
  };


  // Fetch Agent Prompt, User Info, and Context
  useEffect(() => {
    const fetchAgentPromptAndUser = async () => {
      try {
        if (!userId || !agentId) {
          console.error('Missing required IDs');
          return;
        }
        
        // Fetch user info
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('authenticationID', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.docs.length > 0) {
          const userData = userSnapshot.docs[0].data();
          const firstName = userData.name?.split(' ')[0] || 'User';
          setUserName(firstName);
        }

        // Fetch agent prompt from agentsDefined
        const agentsDefinedRef = collection(db, 'agentsDefined');
        const agentQuery = query(agentsDefinedRef, where('agentId', '==', agentId));
        const agentSnapshot = await getDocs(agentQuery);

        let agentDefinition = '';
        if (agentSnapshot.docs.length > 0) {
          const agentData = agentSnapshot.docs[0].data();
          // Use the appropriate model's prompt
          agentDefinition = agentData.prompt?.Anthropic?.description || 
                           agentData.prompt?.openAI?.description || 
                           '';
        }

        // Get chat history analysis
        const historyResponse = await fetch('/api/analyze-chat-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        let chatHistory = '';
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const agentHistory = historyData.groupedData[agentId];
          
          if (agentHistory) {
            chatHistory = `
Previous Interactions Summary:
- Resolved Items: ${agentHistory.summary.resolved}
- In Progress: ${agentHistory.summary.inProgress}
- Open Items: ${agentHistory.summary.unresolved}
`;
          }
        }

        // Get specific conversation context if this is a subchat
        const conversationContext = await getConversationContext();

        // Combine all context
        const fullContext = `${agentDefinition}\n\n${chatHistory}\n\n${conversationContext}`.trim();
        setAgentContext(fullContext);
        setAgentPrompt(fullContext);
      } catch (error) {
        console.error('Error fetching agent context:', error);
      }
    };

    fetchAgentPromptAndUser();
  }, [userId, agentId, conversationName, isDefault]);

  // Fetch Messages
  // Fetch Messages
useEffect(() => {
  if (!conversationNameRef) {
    console.error('No conversationNameRef provided');
    return;
  }

  const q = query(
    collection(db, 'conversations'),
    where('conversationName', '==', conversationNameRef),
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const fetchedMessages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(fetchedMessages);

    // Automatically scroll to the bottom of the chat
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return () => unsubscribe();
}, [conversationNameRef]);

// Handle Sending Messages
const handleSendMessage = async (e) => {
  e.preventDefault();
  console.log('Starting message send with:', {
    agentId,
    userId,
    conversationName,
    projectId
  });

  if (!newMessage.trim() || !conversationName) {
    console.error('Missing required message or conversation name');
    return;
  }

  setLoading(true);

  try {
    const messagesRef = collection(db, 'conversations');
    
    // 1. Save user message
    const userMessage = {
      content: newMessage,
      conversationName: conversationName,
      from: userId,
      isDefault: isDefault,
      timestamp: serverTimestamp(),
      type: 'user',
      ...(projectId && { projectId }),
      ...(agentId && { agentId }),
    };

    const userMessageDoc = await addDoc(messagesRef, userMessage);
    console.log('User message saved with ID:', userMessageDoc.id);
    
    setNewMessage('');

    // 2. Get agent response if we have an agentId
    if (!agentId) {
      console.log('No agentId provided - skipping agent response');
      setLoading(false);
      return;
    }

    // 3. Get conversation context and funnel insights
    const funnelInsights = await fetchFunnelInsights(projectId);
    console.log('Fetched funnel insights:', !!funnelInsights);

    const currentContext = await getConversationContext();
    console.log('Fetched conversation context:', !!currentContext);

    // 4. Build full context for agent
    const fullContext = `
      Agent Role: ${agentContext || 'No specific role defined'}
      
      Project Context: ${projectName || 'No project specified'}
      
      Conversation Focus: ${currentContext || 'New conversation'}
      
      Funnel Insights: ${funnelInsights || 'No insights available'}
      
      User Name: ${userName || 'User'}
    `.trim();

    console.log('Sending request to chat API with context length:', fullContext.length);

    // 5. Get agent response
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: fullContext },
          { role: 'user', content: newMessage },
        ],
      }),
    });

    if (!response.ok) {a
      const errorText = await response.text();
      console.error('Chat API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Chat API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // 6. Save agent response
    if (result.reply) {
      const agentMessage = {
        content: result.reply,
        conversationName: conversationName,
        from: agentId,
        isDefault: isDefault,
        timestamp: serverTimestamp(),
        type: 'agent',
        ...(projectId && { projectId }),
        agentId, // Always include agentId for agent messages
      };

      const agentMessageDoc = await addDoc(messagesRef, agentMessage);
      console.log('Agent response saved with ID:', agentMessageDoc.id);
    }

  } catch (error) {
    console.error('Error in handleSendMessage:', error);
    // Optionally save error message to chat
    try {
      await addDoc(collection(db, 'conversations'), {
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        conversationName: conversationName,
        from: agentId,
        isDefault: isDefault,
        timestamp: serverTimestamp(),
        type: 'agent',
        error: true,
        ...(projectId && { projectId }),
        agentId,
      });
    } catch (e) {
      console.error('Error saving error message:', e);
    }
  } finally {
    setLoading(false);
  }
};



// Function to Fetch Funnel Insights
const fetchFunnelInsights = async (teamId) => {
  try {
    const response = await fetch('/api/funnelInsights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    if (response.ok) {
      const { insights } = await response.json();
      return insights || 'No relevant insights found.';
    }
  } catch (error) {
    console.error('Error fetching funnel insights:', error);
  }
  return 'No insights available.';
};



  // Render component
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">
          {projectName ? `${projectName} - ${title}` : title}
        </h2>
        {!isDefault && currentConversationContext && (
          <p className="text-sm text-gray-600 mt-1">
            {currentConversationContext}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.from === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[70%] ${
                  message.from === userId
                    ? 'bg-blue-500 text-white'
                    : message.error 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : <Send className="h-4 w-4 mr-2" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;