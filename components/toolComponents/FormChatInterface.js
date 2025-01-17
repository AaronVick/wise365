// components/toolComponents/FormChatInterface.js

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
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mapFunnelDataToFunnels, evaluateMilestoneProgress } from '../../pages/api/funnelAnalyzer';
import { useProgressAnalyzer } from '../milestoneFunnels/ProgressAnalyzer';
import { validateMilestoneReadiness } from '../milestoneFunnels/MilestoneValidation';

const FormChatInterface = ({
  chatId,
  agentId,
  userId,
  title,
  conversationName,
  projectId,
  formName,
  formId,
  onClose
}) => {
  // State management
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formTemplate, setFormTemplate] = useState(null);
  const [formHistory, setFormHistory] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const scrollRef = useRef(null);

  // Get progress analysis
  const { analysis } = useProgressAnalyzer(
    { uid: userId },
    { name: formName, id: formId },
    null
  );

  // Fetch form template and history
  useEffect(() => {
    const fetchFormData = async () => {
      try {
        // Get form template
        const templateQuery = query(
          collection(db, 'resources'),
          where('templateName', '==', formName)
        );
        const templateSnapshot = await getDocs(templateQuery);
        if (!templateSnapshot.empty) {
          setFormTemplate(templateSnapshot.docs[0].data());
        }

        // Get form submission history
        const historyQuery = query(
          collection(db, 'resourcesData'),
          where('userId', '==', userId),
          where('templateName', '==', formName),
          orderBy('timestamp', 'desc')
        );
        const historySnapshot = await getDocs(historyQuery);
        setFormHistory(historySnapshot.docs.map(doc => doc.data()));

        // Get agent data
        const agentQuery = query(
          collection(db, 'agentsDefined'),
          where('formTypes', 'array-contains', formName)
        );
        const agentSnapshot = await getDocs(agentQuery);
        if (!agentSnapshot.empty) {
          setAgentData(agentSnapshot.docs[0].data());
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    if (userId && formName) {
      fetchFormData();
    }
  }, [userId, formName]);

  // Fetch Messages
  useEffect(() => {
    if (!conversationName) {
      console.error('No conversationName provided');
      return;
    }

    const messagesRef = collection(db, 'conversations');
    const q = query(
      messagesRef,
      where('conversationName', '==', conversationName),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);

      // Scroll to bottom
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => unsubscribe();
  }, [conversationName]);

  // Build form-specific context for agent
  const buildFormContext = () => {
    return `
Form Assistant Context:
${agentData?.prompt || 'You are a form assistance specialist.'}

Current Form: ${formName}
${formTemplate ? `
Purpose: ${formTemplate.description}
Sections: ${formTemplate.sections?.length || 0}
` : 'Form template not available'}

User History:
${formHistory ? `
- Previous submissions: ${formHistory.length}
- Last submission: ${formHistory[0]?.timestamp ? new Date(formHistory[0].timestamp.toDate()).toLocaleDateString() : 'None'}
` : 'No previous submissions'}

Analysis:
${analysis ? `
- Current status: ${analysis.status}
- Blockers: ${analysis.blockers?.join(', ') || 'None'}
- Next steps: ${analysis.nextSteps?.join(', ') || 'None'}
` : 'No analysis available'}

Please help the user complete the form by:
1. Answering questions about form fields
2. Providing guidance on best practices
3. Explaining the purpose of each section
4. Offering examples when needed
`.trim();
  };

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationName) {
      return;
    }

    setLoading(true);

    try {
      const messagesRef = collection(db, 'conversations');
      
      // Save user message
      const userMessage = {
        content: newMessage,
        conversationName,
        from: userId,
        timestamp: serverTimestamp(),
        type: 'user',
        projectId,
        agentId,
        formContext: {
          formName,
          formId
        }
      };

      await addDoc(messagesRef, userMessage);
      setNewMessage('');

      // Get agent response
      const formContext = buildFormContext();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: formContext },
            { role: 'user', content: newMessage }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get agent response');
      }

      const result = await response.json();

      // Save agent response
      if (result.reply) {
        const agentMessage = {
          content: result.reply,
          conversationName,
          from: agentId,
          timestamp: serverTimestamp(),
          type: 'agent',
          projectId,
          agentId,
          formContext: {
            formName,
            formId
          }
        };

        await addDoc(messagesRef, agentMessage);
      }

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // Save error message
      try {
        await addDoc(collection(db, 'conversations'), {
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          conversationName,
          from: agentId,
          timestamp: serverTimestamp(),
          type: 'agent',
          error: true,
          projectId,
          agentId,
          formContext: {
            formName,
            formId
          }
        });
      } catch (e) {
        console.error('Error saving error message:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        {formTemplate && (
          <p className="text-sm text-gray-600 mt-1">
            {formTemplate.description}
          </p>
        )}
      </div>

      {/* Messages Area */}
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

      {/* Input Area */}
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

export default FormChatInterface;