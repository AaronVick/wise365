// components/FunnelActionInterface.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, FileText, MessageCircle } from 'lucide-react';
import { useFunnelProgression } from './FunnelProgressionHandler';
import { createFunnelProject } from './FunnelActionHandler';

const FunnelActionInterface = ({ 
  funnel, 
  currentUser, 
  userData,
  setCurrentChat,
  onFormComplete 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  // Get funnel state from our progression handler
  const { currentPhase, nextActions, requiredForms } = useFunnelProgression(
    funnel, 
    currentUser, 
    userData
  );

  // Handle starting a form
  const handleFormStart = async (formId) => {
    try {
      // First create a project to track this form completion
      const { projectId, conversationId } = await createFunnelProject(
        {
          type: 'form',
          description: `Complete ${formId}`,
          agents: ['shawn'], // Shawn handles form guidance
          phase: currentPhase.name,
          formId
        },
        currentUser,
        funnel
      );

      // Set the current chat for form guidance
      setCurrentChat({
        id: conversationId,
        agentId: 'shawn',
        title: `Complete ${formId}`,
        participants: [currentUser.uid, 'shawn'],
        isDefault: false,
        conversationName: conversationId,
        projectId,
        formId // Pass the form ID to the chat interface
      });

    } catch (error) {
      console.error('Error starting form:', error);
      setError('Failed to start form. Please try again.');
    }
  };

  // Handle starting a chat action
  const handleChatStart = async (action) => {
    try {
      setActiveAction(action);
      const { projectId, conversationId } = await createFunnelProject(
        action,
        currentUser,
        funnel
      );

      // Redirect to the new chat
      setCurrentChat({
        id: conversationId,
        agentId: action.agents[0],
        title: action.description,
        participants: [currentUser.uid, ...action.agents],
        isDefault: false,
        conversationName: conversationId,
        projectId
      });

    } catch (error) {
      console.error('Error starting chat:', error);
      setError('Failed to start chat. Please try again.');
      setActiveAction(null);
    }
  };

  // Render actions based on current phase
  const renderActions = () => {
    if (!nextActions?.length && !requiredForms?.length) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No immediate actions needed. Funnel progress is being analyzed.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Required Forms Section */}
        {requiredForms.map((formId) => (
          <Card 
            key={formId}
            className="p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="font-medium">Complete {formId}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Required for funnel progression
                </p>
              </div>
              <Button
                onClick={() => handleFormStart(formId)}
                className="ml-4"
              >
                Start Form
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {/* Next Actions Section */}
        {nextActions.map((action) => (
          <Card 
            key={action.description}
            className="p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <h3 className="font-medium">{action.description}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Working with: {action.agents.join(', ')}
                </p>
              </div>
              <Button
                onClick={() => handleChatStart(action)}
                disabled={activeAction === action}
                className="ml-4"
              >
                {activeAction === action ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Chat
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error}</p>
        <Button 
          variant="outline" 
          onClick={() => setError(null)}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 bg-white">
        <h2 className="text-lg font-semibold">
          {funnel.name} - Phase {currentPhase?.name || 'Loading...'}
        </h2>
        {currentPhase && (
          <p className="text-sm text-gray-600 mt-1">
            {currentPhase.description}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          renderActions()
        )}
      </ScrollArea>
    </div>
  );
};

export default FunnelActionInterface;