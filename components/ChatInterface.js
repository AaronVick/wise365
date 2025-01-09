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

const ChatInterface = ({ chatId, agentId, userId, isDefault, title, conversationName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const scrollRef = useRef(null);

  // Use the conversationName from props
  const conversationNameRef = conversationName;

  // Fetch Agent Prompt
  useEffect(() => {
    const fetchAgentPrompt = async () => {
      try {
        if (!agentId) {
          console.error('Agent ID is missing');
          return;
        }
        
        // Query agentsDefined collection by agentId field
        const agentsDefinedRef = collection(db, 'agentsDefined');
        const q = query(agentsDefinedRef, where('agentId', '==', agentId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const agentDoc = querySnapshot.docs[0];
          const agentData = agentDoc.data();
          const openAIPrompt = agentData.prompt?.openAI?.description;
          if (openAIPrompt) {
            setAgentPrompt(openAIPrompt);
          }
        }
      } catch (error) {
        console.error('Error fetching agent prompt:', error);
      }
    };

    fetchAgentPrompt();
  }, [agentId]);

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
        // Save user message to Firebase
        const userMessage = {
            agentId,
            content: newMessage,
            conversationName: conversationNameRef,
            from: userId,
            isDefault,
            timestamp: serverTimestamp(),
            type: 'user',
        };

        const messagesRef = collection(db, 'conversations');
        await addDoc(messagesRef, userMessage);

        // Clear input field
        setNewMessage('');

        // Call LLM API for response
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: agentPrompt },
                    { role: 'user', content: newMessage },
                ],
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const agentMessage = {
                agentId,
                content: result.reply,
                conversationName: conversationNameRef,
                from: agentId,
                isDefault,
                timestamp: serverTimestamp(),
                type: 'agent',
            };

            // Save agent response to Firebase
            await addDoc(messagesRef, agentMessage);
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
            {loading ? 'Sending...' : <Send className="h-4 w-4 mr-2" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;