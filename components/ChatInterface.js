import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ChatInterface = ({ chatId, agentId, userId, isDefault, title }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationNameRef, setConversationNameRef] = useState(null);
  const scrollRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface mounted with props:', {
      chatId,
      agentId,
      userId,
      isDefault,
      title
    });
  }, [chatId, agentId, userId, isDefault, title]);

  // First get the conversationName reference
useEffect(() => {
  const getConversationRef = async () => {
    console.log('Starting getConversationRef with chatId:', chatId);
    if (!chatId) {
      console.log('No chatId provided');
      return;
    }

    try {
      const chatDoc = await getDoc(doc(db, 'conversations', chatId));
      console.log('ChatDoc exists?', chatDoc.exists());
      if (!chatDoc.exists()) {
        console.error('Chat document not found:', chatId);
        return;
      }

      const chatData = chatDoc.data();
      console.log('Found chat data:', {
        chatData,
        conversationName: chatData.conversationName
      });
      setConversationNameRef(chatData.conversationName);
    } catch (error) {
      console.error('Error getting conversation reference:', error);
    }
  };

  getConversationRef();
}, [chatId]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    console.log('Fetch messages useEffect triggered with conversationNameRef:', conversationNameRef);
    if (!conversationNameRef) {
      console.log('No conversationNameRef, skipping message fetch');
      return;
    }
  
    console.log('Fetching messages for conversationName:', conversationNameRef);
    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('conversationName', '==', conversationNameRef),
      orderBy('timestamp', 'asc')
    );
  
    console.log('Setting up message listener');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Message snapshot received, docs count:', snapshot.docs.length);
      const chatMessages = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Message data:', data);
        return {
          id: doc.id,
          ...data,
        };
      });
      console.log('Processed messages:', chatMessages);
      setMessages(chatMessages);
  
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  
    return () => {
      console.log('Cleaning up message listener');
      unsubscribe();
    };
  }, [conversationNameRef]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('=== Starting handleSendMessage ===');
    console.log('Current message:', newMessage);
    console.log('ConversationNameRef:', conversationNameRef);
    console.log('Props:', { chatId, agentId, userId, isDefault, title });
  
    if (!newMessage.trim() || !conversationNameRef) {
      console.log('Missing required data:', {
        hasMessage: !!newMessage.trim(),
        hasConversationNameRef: !!conversationNameRef
      });
      return;
    }
  
    setLoading(true);
  
    try {
      // Get agent prompt
      console.log('Fetching agent prompt from agentsDefined:', agentId);
      const agentDoc = await getDoc(doc(db, 'agentsDefined', agentId));
      console.log('Agent doc exists?', agentDoc.exists());
      
      if (!agentDoc.exists()) {
        throw new Error('Agent prompt not found');
      }
  
      const agentData = agentDoc.data();
      console.log('Agent data:', agentData);
      console.log('Agent prompts:', {
        anthropic: agentData.prompt?.Anthropic?.description,
        openai: agentData.prompt?.openAI?.description
      });
  
      const prompt = agentData.prompt?.Anthropic?.description || 
                    agentData.prompt?.openAI?.description;
  
      if (!prompt) {
        throw new Error('No prompt found for agent');
      }
  
      // Save user message
      console.log('Saving user message to Firebase...');
      const messageData = {
        agentId,
        content: newMessage,
        conversationName: conversationNameRef,
        from: userId,
        isDefault,
        timestamp: serverTimestamp(),
        type: 'user'
      };
      console.log('Message data to save:', messageData);
  
      const messagesRef = collection(db, 'conversations');
      const userMessageDoc = await addDoc(messagesRef, messageData);
      console.log('User message saved with ID:', userMessageDoc.id);
  
      setNewMessage('');
  
      // Call LLM API
      console.log('Calling LLM API with payload:', {
        system: prompt,
        user: newMessage
      });
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: newMessage }
          ]
        }),
      });
  
      console.log('LLM API response status:', response.status);
      if (!response.ok) {
        console.error('LLM API error details:', {
          status: response.status,
          statusText: response.statusText,
          text: await response.text()
        });
        throw new Error('Failed to get LLM response');
      }
  
      const result = await response.json();
      console.log('LLM API result:', result);
  
      // Save agent response
      console.log('Saving agent response to Firebase...');
      const agentMessageData = {
        agentId,
        content: result.reply,
        conversationName: conversationNameRef,
        from: agentId,
        isDefault,
        timestamp: serverTimestamp(),
        type: 'agent'
      };
      console.log('Agent message data to save:', agentMessageData);
  
      const agentMessageDoc = await addDoc(messagesRef, agentMessageData);
      console.log('Agent response saved with ID:', agentMessageDoc.id);
  
    } catch (error) {
      console.error('Error in chat:', error);
      console.error('Error stack:', error.stack);
    } finally {
      setLoading(false);
      console.log('=== Message handling complete ===');
    }
  };
  

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">{title}</h2>
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
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;