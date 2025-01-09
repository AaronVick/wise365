// components/ui/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const ChatInterface = ({ chatId, agentId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fetch messages for the selected conversation
  useEffect(() => {
    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('agentId', '==', agentId),
      where('conversationId', '==', chatId),
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
      const messageDoc = await addDoc(messagesRef, {
        agentId,
        conversationId: chatId,
        content: newMessage,
        from: userId,
        timestamp: serverTimestamp(),
        type: 'user'
      });

      // Get the agent's prompt and role
      let agentPrompt = '';
      const agentRef = collection(db, 'agents');
      const agentSnapshot = await getDocs(query(agentRef, where('id', '==', agentId)));
      
      if (!agentSnapshot.empty) {
        const agentData = agentSnapshot.docs[0].data();
        agentPrompt = agentData.prompt || `You are ${agentData.name}, ${agentData.role}. Respond accordingly.`;
      }

      setNewMessage('');

      // Communicate with the agent (default ChatGPT for now)
      const agentDoc = await getDoc(doc(db, 'agentsDefined', agentId));
      if (!agentDoc.exists()) throw new Error('Agent not found');

      const agentData = agentDoc.data();
      const prompt = agentData.prompt?.openAI?.description;
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