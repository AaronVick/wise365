// components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs
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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [userName, setUserName] = useState('');
  const scrollRef = useRef(null);

  const conversationNameRef = conversationName;

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

  // Fetch Agent Prompt and User Info
  useEffect(() => {
    const fetchAgentPromptAndUser = async () => {
      try {
        if (!userId) {
          console.error('User ID is missing');
          return;
        }
        
        // Get user info first
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('uid', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.docs.length > 0) {
          const userData = userSnapshot.docs[0].data();
          const firstName = userData.name?.split(' ')[0] || 'User';
          setUserName(firstName);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
  
    fetchAgentPromptAndUser();
  }, [userId]);

  
  
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

    if (!newMessage.trim() || !conversationNameRef) return;

    setLoading(true);

    try {
      // Base message structure
      const baseMessage = {
        content: newMessage,
        conversationName: conversationNameRef,
        from: userId,
        isDefault,
        timestamp: serverTimestamp(),
      };

      // Add project or agent specific fields
      const userMessage = {
        ...baseMessage,
        type: 'user',
        ...(projectId && { projectId }), // Add project ID if it exists
        ...(agentId && { agentId }), // Add agent ID if it exists
      };

      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, userMessage);

      // Clear input field
      setNewMessage('');

      // Get summary of previous messages
      const chatSummary = await getChatSummary(messages);
      const contextPrefix = chatSummary ? `Previous conversation summary: ${chatSummary}\n\nCurrent conversation:` : '';

      // Only call LLM if there's an agent to respond
      if (agentId) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: agentPrompt },
              { role: 'user', content: `${contextPrefix}\n\n${newMessage}` },
            ],
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const agentMessage = {
            ...baseMessage,
            content: result.reply,
            from: agentId,
            type: 'agent',
            ...(projectId && { projectId }), // Add project ID if it exists
            ...(agentId && { agentId }), // Add agent ID if it exists
          };

          await addDoc(messagesRef, agentMessage);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">
          {projectName ? `${projectName} - ${title}` : title}
        </h2>
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