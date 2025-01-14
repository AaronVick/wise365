// components/MilestoneCard.js

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MilestoneProgress from './MilestoneProgress';
import { ChevronRight, CheckCircle2, Circle, Timer, AlertCircle } from 'lucide-react';
import { useFunnelProgression } from './FunnelProgressionHandler';

const MilestoneCard = ({ 
  milestone, 
  currentUser, 
  funnelData,
  onClick,
  isSelected,
  setCurrentChat
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState(null);
  const [progressDetails, setProgressDetails] = useState(null);

  // Use funnel progression hook to get detailed progress
  const { currentPhase, nextActions, requiredForms, progressDetails: funnelProgress } = 
    useFunnelProgression(
      { name: milestone.funnelName, milestones: [milestone] },
      currentUser,
      funnelData
    );

  useEffect(() => {
    if (funnelProgress?.milestones?.[milestone.name]) {
      setProgressDetails(funnelProgress.milestones[milestone.name]);
    }
  }, [funnelProgress, milestone.name]);

  // Status badge color mapping with fallbacks
  const statusColors = {
    ready: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    not_ready: 'bg-gray-100 text-gray-800',
    blocked: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  };

  // Status icons with tooltips
  const statusIcons = {
    ready: <Circle className="h-4 w-4" title="Ready to start" />,
    in_progress: <Timer className="h-4 w-4" title="In progress" />,
    completed: <CheckCircle2 className="h-4 w-4" title="Completed" />,
    not_ready: <Circle className="h-4 w-4" title="Not ready" />,
    blocked: <AlertCircle className="h-4 w-4" title="Blocked by requirements" />
  };

  // Handle milestone click with proper routing
  const handleMilestoneClick = async () => {
    try {
      // Default to Shawn for onboarding or if no specific agent
      const primaryAgent = milestone.funnelName === 'Onboarding Funnel' ? 
        'shawn' : milestone.responsibleAgents?.lead || 'shawn';

      // Get supporting agents if any
      const supportingAgents = milestone.responsibleAgents?.supporting || [];

      // Set up the chat context
      const chatContext = {
        id: milestone.conversationId || `milestone-${milestone.name}`,
        agentId: primaryAgent,
        title: `${milestone.name} - ${milestone.funnelName}`,
        participants: [currentUser.uid, primaryAgent, ...supportingAgents],
        isDefault: false,
        conversationName: milestone.conversationId || `milestone-${milestone.name}`,
        milestone: milestone.name,
        funnelName: milestone.funnelName,
        progress: progressDetails
      };

      // Update current chat context
      setCurrentChat(chatContext);

      // If we have form requirements, handle them
      if (requiredForms?.length > 0) {
        // Add form context to the chat
        chatContext.requiredForms = requiredForms;
      }

      // Call the parent onClick if provided
      if (onClick) {
        onClick(milestone);
      }

    } catch (error) {
      console.error('Error handling milestone click:', error);
      setError('Unable to start milestone. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Data validation
  if (!milestone || typeof milestone !== 'object') {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-600">Invalid milestone data</p>
      </Card>
    );
  }

  const {
    name = 'Untitled Milestone',
    description = 'No description available',
    status = progressDetails?.status || 'not_ready',
    progress = progressDetails?.progress || 0,
    funnelName = 'Unknown Funnel',
    kpis = []
  } = milestone;

  // For new users without any funnel data, show onboarding as ready
  const isNewUser = !funnelData || Object.keys(funnelData).length === 0;
  const isOnboarding = funnelName.toLowerCase() === 'onboarding funnel';
  const effectiveStatus = isNewUser && isOnboarding ? 'ready' : status;
  const effectiveProgress = isNewUser && isOnboarding ? 0 : progress;

  // Determine if milestone is actionable
  const isActionable = effectiveStatus === 'ready' || effectiveStatus === 'in_progress';

  return (
    <Card 
      className={`p-4 transition-all duration-200 ${
        isHovered ? 'shadow-md' : 'shadow-sm'
      } ${error ? 'border-red-200' : 'border-gray-200'} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isActionable ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={isActionable ? handleMilestoneClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isActionable ? "button" : "article"}
      tabIndex={isActionable ? 0 : -1}
      aria-label={`${name} milestone from ${funnelName}`}
    >
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow">
          <div className="flex items-center space-x-2 mb-1">
            {statusIcons[effectiveStatus]}
            <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
              {name}
            </h3>
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                ${statusColors[effectiveStatus] || statusColors.default}`}
            >
              {effectiveStatus.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>
        {isActionable && (
          <ChevronRight 
            className={`h-5 w-5 transform transition-transform duration-200 ${
              isHovered ? 'translate-x-1' : ''
            } text-gray-400`}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <MilestoneProgress 
          progress={effectiveProgress}
          isAnimated={true}
          status={effectiveStatus}
        />

        {/* Progress Details */}
        {progressDetails && (
          <div className="space-y-2 text-sm">
            {progressDetails.forms < 100 && requiredForms?.length > 0 && (
              <p className="text-blue-600">
                Required forms: {requiredForms.join(', ')}
              </p>
            )}
            {progressDetails.conversations && (
              <p className="text-gray-600">
                Conversation progress: {Math.round(progressDetails.conversations)}%
              </p>
            )}
          </div>
        )}

        {/* KPIs Section */}
        {kpis.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {kpis.map((kpi, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
              >
                {kpi}
              </span>
            ))}
          </div>
        )}

        {/* Funnel Information */}
        <div className="text-sm text-gray-500 flex items-center justify-between">
          <span>Part of: {funnelName}</span>
          {milestone.priority && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              Priority: {milestone.priority}
            </span>
          )}
        </div>
      </div>

      {/* Action Prompts */}
      {isActionable && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-blue-600">
            {effectiveStatus === 'ready' 
              ? 'Click to start this milestone'
              : 'Click to continue this milestone'}
          </p>
        </div>
      )}
    </Card>
  );
};

export default MilestoneCard;