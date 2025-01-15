// components/toolComponents/FormChat.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import FormChatInterface from './FormChatInterface';
import FormChatButton from './FormChatButton';
import { ChatState } from './FormChatTypes';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const FormChat = ({ 
  children, 
  formName, 
  formId, 
  projectId = '',
  projectName = '' 
}) => {
  const [chatState, setChatState] = useState(ChatState.CLOSED);
  const [conversationName, setConversationName] = useState(null);
  const [formContext, setFormContext] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const { currentUser } = useAuth();

  // Fetch all necessary context when chat opens
  useEffect(() => {
    const fetchContextAndAgent = async () => {
      if (chatState !== ChatState.OPEN || !formName || !currentUser?.uid) return;
      
      try {
        setChatState(ChatState.LOADING);
        
        // 1. Get form template from resources
        const formTemplate = await fetchFormTemplate();
        
        // 2. Get funnel context
        const funnelContext = await fetchFunnelContext();
        
        // 3. Find best matching agent
        const agent = await findBestAgent(formTemplate, funnelContext);
        
        // Set all context
        setFormContext({
          template: formTemplate,
          funnel: funnelContext
        });
        
        setSelectedAgent(agent);
        
        // Generate conversation name
        const newConversationName = `${formName}_${formId}_${currentUser.uid}`;
        setConversationName(newConversationName);
        
        setChatState(ChatState.OPEN);
      } catch (error) {
        console.error('Error fetching context:', error);
        setChatState(ChatState.ERROR);
      }
    };

    fetchContextAndAgent();
  }, [chatState, formName, currentUser]);

  // Fetch form template from resources
  const fetchFormTemplate = async () => {
    const resourcesRef = collection(db, 'resources');
    const q = query(resourcesRef, where('templateName', '==', formName));
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.data();
  };

  // Fetch funnel context
  const fetchFunnelContext = async () => {
    const funnelsRef = collection(db, 'funnels');
    const q = query(
      funnelsRef,
      where('forms', 'array-contains', formName)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.data();
  };

  // Find best matching agent using LLM analysis
  const findBestAgent = async (formTemplate, funnelContext) => {
    try {
      // Get all potential agents and their detailed data
      const [agents, agentDetails] = await Promise.all([
        getDocs(collection(db, 'agentsDefined')),
        getDocs(collection(db, 'agentData'))
      ]);

      // Format all context for LLM
      const context = {
        form: {
          name: formTemplate.templateName,
          description: formTemplate.description,
          purpose: formTemplate.purpose,
          sections: formTemplate.sections?.map(s => ({
            question: s.question,
            definition: s.definition,
            evaluationCriteria: s.evaluationCriteria
          }))
        },
        funnel: {
          name: funnelContext?.name,
          stage: funnelContext?.stage,
          responsibleAgents: funnelContext?.responsibleAgents,
          requirements: funnelContext?.requirements,
          process: funnelContext?.process
        },
        agents: agents.docs.map(doc => {
          const agentData = agentDetails.docs
            .find(detail => detail.data().agentId === doc.data().agentId);
          return {
            id: doc.data().agentId,
            prompt: doc.data().prompt,
            expertise: agentData?.data().expertise,
            specialization: agentData?.data().specialization,
            successMetrics: agentData?.data().successMetrics
          };
        })
      };

      // Ask LLM to analyze and select best agent
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Analyze the following context and select the best agent to assist with a form. Consider:
              1. Form purpose and requirements
              2. Funnel context and stage
              3. Agent expertise and specialization
              4. Previous success metrics
              Return only the agentId of the best match.`
            },
            {
              role: 'user',
              content: JSON.stringify(context, null, 2)
            }
          ]
        })
      });

      if (!response.ok) throw new Error('Failed to get agent recommendation');
      
      const result = await response.json();
      const selectedAgentId = result.reply.trim();

      // Get the selected agent's full data
      const selectedAgent = agents.docs
        .find(doc => doc.data().agentId === selectedAgentId);

      if (!selectedAgent) {
        throw new Error('Selected agent not found');
      }

      return {
        id: selectedAgent.id,
        ...selectedAgent.data()
      };

    } catch (error) {
      console.error('Error finding best agent:', error);
      throw error;
    }
  };

  // Classes for animations
  const formContainerClass = `transition-all duration-300 ease-in-out ${
    chatState === ChatState.OPEN ? 'w-1/2' : 'w-full'
  }`;

  const chatContainerClass = `fixed top-0 right-0 h-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
    chatState === ChatState.OPEN ? 'w-1/2 translate-x-0' : 'w-1/2 translate-x-full'
  }`;

  const handleChatToggle = () => {
    setChatState(prevState => 
      prevState === ChatState.OPEN ? ChatState.CLOSED : ChatState.OPEN
    );
  };

  const handleClose = () => {
    setChatState(ChatState.CLOSED);
    setConversationName(null);
    setSelectedAgent(null);
    setFormContext(null);
  };

  // Show loading state
  if (chatState === ChatState.LOADING) {
    return (
      <div className="relative flex w-full min-h-screen">
        <div className={formContainerClass}>
          {children}
        </div>
        <div className={chatContainerClass}>
          <div className="flex items-center justify-center h-full">
            <p>Loading chat assistance...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full min-h-screen">
      {/* Form Container */}
      <div className={formContainerClass}>
        {children}
        <FormChatButton 
          isOpen={chatState === ChatState.OPEN} 
          onClick={handleChatToggle}
        />
      </div>

      {/* Chat Container */}
      {chatState === ChatState.OPEN && conversationName && currentUser && selectedAgent && (
        <div className={chatContainerClass}>
          <FormChatInterface
            chatId={`form_${formId}`}
            agentId={selectedAgent.agentId}
            userId={currentUser.uid}
            title={`Help with ${formName}`}
            conversationName={conversationName}
            projectId={projectId}
            projectName={projectName}
            formName={formName}
            formId={formId}
            formContext={formContext}
            agentPrompt={selectedAgent.prompt?.[selectedAgent.prompt?.version === 'Claude-3_5-Sonet' ? 'Anthropic' : 'openAI']?.description}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
};

export default FormChat;