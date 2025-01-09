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
    if (!newMessage.trim() || !conversationNameRef) {
        console.log('Missing required data for sending a message');
        return;
    }

    setLoading(true);

    try {
        const messageData = {
            agentId,
            content: newMessage,
            conversationName: conversationNameRef,
            from: userId,
            isDefault,
            timestamp: serverTimestamp(),
            type: 'user',
        };

        // Add user message to Firebase
        const messagesRef = collection(db, 'conversations');
        await addDoc(messagesRef, messageData);

        // Clear input field
        setNewMessage('');

        // Invoke LLM API to get agent response
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: agentPrompt },
                    { role: 'user', content: newMessage }
                ],
                agentId,
                conversationName: conversationNameRef,
                isDefault,
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

            // Add agent response to Firebase
            await addDoc(messagesRef, agentMessage);
        } else {
            console.error('LLM API error:', await response.text());
        }
    } catch (error) {
        console.error('Error sending message or retrieving response:', error);
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