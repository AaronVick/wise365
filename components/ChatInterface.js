// components/ChatInterface.js

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Import agents data
import { agents } from '../pages/dashboard';

const ChatInterface = ({ chatId, agentId, userId, isDefault, title }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationNameData, setConversationNameData] = useState(null);
  const scrollRef = useRef(null);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('agentId', '==', agentId),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(chatMessages);

      // Auto-scroll to the bottom
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => unsubscribe();
  }, [chatId, agentId]);

  // Send a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);

    try {
      // Get the parent chat document
      const chatDoc = await getDoc(doc(db, 'conversations', chatId));
      if (!chatDoc.exists()) throw new Error('Chat not found');

      const chatData = chatDoc.data();
      const conversationNameId = chatData.conversationName;

      // Get the conversation name details if it exists
      let conversationDisplayName = isDefault ? 'Default' : title;
      if (conversationNameId) {
        const nameDoc = await getDoc(doc(db, 'conversationNames', conversationNameId));
        if (nameDoc.exists()) {
          conversationDisplayName = nameDoc.data().conversationName;
        }
      }

      // Add user message
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId,
        chatId,
        content: newMessage,
        from: userId,
        timestamp: serverTimestamp(),
        type: 'user',
        conversationName: conversationNameId,
        isDefault
      });

      setNewMessage('');

      // Get agent information
      const agent = agents.find(a => a.id === agentId);
      if (!agent) throw new Error('Agent not found');

      // Construct prompt
      const systemPrompt = `You are ${agent.name}, ${agent.role}. ${
        isDefault ? 'This is your default chat.' : `This is a conversation about "${conversationDisplayName}".`
      } Respond accordingly, maintaining a professional and helpful tone.`;

      // Get LLM response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: newMessage }
          ]
        }),
      });

      if (!response.ok) throw new Error('Failed to get agent response');
      const result = await response.json();

      // Add agent response
      await addDoc(messagesRef, {
        agentId,
        chatId,
        content: result.reply,
        from: agentId,
        timestamp: serverTimestamp(),
        type: 'agent',
        conversationName: conversationNameId,
        isDefault
      });

    } catch (error) {
      console.error('Error in chat:', error);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
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