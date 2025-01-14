// components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        const userQuery = query(usersRef, where('uid', '==', userId));
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
  useEffect(() => {
    if (!conversationNameRef) {
      console.error('No conversationNameRef provided. Skipping message fetch.');
      return;
    }

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
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

    if (!newMessage.trim() || !conversationName) {
      console.error('Missing required message or conversation name');
      return;
    }

    setLoading(true);

    try {
      // Initialize Firestore refs
      const messagesRef = collection(db, 'conversations');
      
      // Create user message
      const userMessage = {
        content: newMessage,
        conversationName: conversationName,
        from: userId,
        isDefault: isDefault,
        timestamp: serverTimestamp(),
        type: 'user',
        ...(projectId && { projectId }),
        ...(agentId && { agentId })
      };

      // Add user message to Firestore
      await addDoc(messagesRef, userMessage);

      // Clear input field immediately after sending
      setNewMessage('');

      // Only proceed with agent response if we have an agentId
      if (agentId) {
        // Get current conversation context
        const currentContext = await getConversationContext();
        
        // Get agent response using the full context
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { 
                role: 'system', 
                content: `${agentContext}\n\n${currentContext}`.trim()
              },
              { 
                role: 'user', 
                content: newMessage 
              },
            ],
          }),
        });

        if (response.ok) {
          const result = await response.json();
          
          // Create agent message
          const agentMessage = {
            content: result.reply,
            conversationName: conversationName,
            from: agentId,
            isDefault: isDefault,
            timestamp: serverTimestamp(),
            type: 'agent',
            ...(projectId && { projectId }),
            ...(agentId && { agentId })
          };

          // Add agent message to Firestore
          await addDoc(messagesRef, agentMessage);

          // If we're at a milestone or significant point, update the chat summary
          if (result.reply.toLowerCase().includes('complete') || 
              result.reply.toLowerCase().includes('finished') ||
              result.reply.toLowerCase().includes('next step')) {
            try {
              await fetch('/api/analyze-chat-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, agentId })
              });

              // Update conversation context
              const newContext = await getConversationContext();
              setCurrentConversationContext(newContext);
            } catch (error) {
              console.error('Error updating chat summary:', error);
              // Non-blocking error - don't throw
            }
          }
        } else {
          console.error('Error getting agent response:', await response.text());
          // Add error message to chat
          const errorMessage = {
            content: "I apologize, but I encountered an error processing your request. Please try again.",
            conversationName: conversationName,
            from: agentId,
            isDefault: isDefault,
            timestamp: serverTimestamp(),
            type: 'agent',
            error: true,
            ...(projectId && { projectId }),
            ...(agentId && { agentId })
          };
          await addDoc(messagesRef, errorMessage);
        }
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      // Add error message to chat if there was a failure
      try {
        const messagesRef = collection(db, 'conversations');
        const errorMessage = {
          content: "I apologize, but something went wrong. Please try your message again.",
          conversationName: conversationName,
          from: agentId || 'system',
          isDefault: isDefault,
          timestamp: serverTimestamp(),
          type: 'agent',
          error: true,
          ...(projectId && { projectId }),
          ...(agentId && { agentId })
        };
        await addDoc(messagesRef, errorMessage);
      } catch (errorHandlingError) {
        console.error('Error handling error message:', errorHandlingError);
      }
    } finally {
      setLoading(false);
    }
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