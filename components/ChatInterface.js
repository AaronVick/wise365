// components/ChatInterface.js
import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const ChatInterface = ({ chatId, chatType, participants, title, userId, agentId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let unsubscribe;

    if (chatId) {
      // Subscribe to messages
      const messagesRef = collection(db, 'conversations', chatId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        setMessages(newMessages);

        // Scroll to bottom after messages update
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Add message to Firestore
      const messagesRef = collection(db, 'conversations', chatId, 'messages');
      await addDoc(messagesRef, {
        content: newMessage,
        sender: userId,
        timestamp: serverTimestamp(),
        role: 'user'
      });

      setNewMessage('');

      // Scroll to bottom after sending
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b p-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {chatType === 'project' && (
          <div className="text-sm text-gray-500 mt-1">
            Project with {participants.join(', ')}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[70%] ${
                  message.sender === userId ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  {message.sender === userId ? '👤' : agentId[0].toUpperCase()}
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p>{message.content}</p>
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === userId ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp?.toDate().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t bg-white p-4">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;