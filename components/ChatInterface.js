// components/ui/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const ChatInterface = ({ chatId, agentId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('agentId', '==', agentId),
      where('conversationName', '==', chatId || null),
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
      // Log the user's message in Firebase
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId,
        conversationName: chatId || null,
        content: newMessage,
        from: userId,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');

      // Communicate with the agent (default ChatGPT for now)
      const agentDoc = await getDoc(doc(db, 'agentsDefined', agentId));
      if (!agentDoc.exists()) throw new Error('Agent not found');

      const agentData = agentDoc.data();
      const prompt = agentData.prompt.openAI?.description;
      if (!prompt) throw new Error('No prompt found for the selected agent');

      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          message: newMessage,
          prompt,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send message');

      // Log the agent's response
      await addDoc(messagesRef, {
        agentId,
        conversationName: chatId || null,
        content: result.reply,
        from: agentId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.from === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`p-3 rounded-lg ${message.from === userId ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <p>{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};
