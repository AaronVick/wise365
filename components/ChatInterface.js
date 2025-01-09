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
      if (!chatId) return;

      try {
        const chatDoc = await getDoc(doc(db, 'conversations', chatId));
        if (!chatDoc.exists()) {
          console.error('Chat document not found:', chatId);
          return;
        }

        const chatData = chatDoc.data();
        console.log('Found chat data:', chatData);
        setConversationNameRef(chatData.conversationName);
      } catch (error) {
        console.error('Error getting conversation reference:', error);
      }
    };

    getConversationRef();
  }, [chatId]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!conversationNameRef) return;

    console.log('Fetching messages for conversationName:', conversationNameRef);
    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('conversationName', '==', conversationNameRef),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Found messages:', chatMessages);
      setMessages(chatMessages);

      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => unsubscribe();
  }, [conversationNameRef]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('Starting handleSendMessage...');
    console.log('Current message:', newMessage);
    console.log('ConversationNameRef:', conversationNameRef);
  
    if (!newMessage.trim() || !conversationNameRef) {
      console.log('Missing required data:', {
        newMessage: !!newMessage.trim(),
        conversationNameRef: !!conversationNameRef
      });
      return;
    }
  
    setLoading(true);
  
    try {
      console.log('Getting agent prompt for:', agentId);
      // Get the agent's prompt from agentsDefined
      const agentDoc = await getDoc(doc(db, 'agentsDefined', agentId));
      if (!agentDoc.exists()) {
        throw new Error('Agent prompt not found');
      }
  
      const agentData = agentDoc.data();
      console.log('Agent data:', agentData);
  
      const prompt = agentData.prompt?.Anthropic?.description || 
                    agentData.prompt?.openAI?.description;
  
      if (!prompt) {
        throw new Error('No prompt found for agent');
      }
  
      console.log('Saving user message...');
      // Log the user's message
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId,
        content: newMessage,
        conversationName: conversationNameRef,
        from: userId,
        isDefault,
        timestamp: serverTimestamp(),
        type: 'user'
      });
  
      console.log('User message saved, clearing input...');
      setNewMessage('');
  
      console.log('Sending to LLM API...');
      // Send to LLM API with agent's prompt
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
  
      if (!response.ok) {
        console.error('LLM API error:', response.status, response.statusText);
        throw new Error('Failed to get LLM response');
      }
  
      const result = await response.json();
      console.log('Got LLM response:', result);
  
      console.log('Saving agent response...');
      // Log the agent's response
      await addDoc(messagesRef, {
        agentId,
        content: result.reply,
        conversationName: conversationNameRef,
        from: agentId,
        isDefault,
        timestamp: serverTimestamp(),
        type: 'agent'
      });
  
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setLoading(false);
      console.log('Message handling complete');
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