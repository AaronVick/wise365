// components/MilestoneCard.js

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import MilestoneProgress from './MilestoneProgress';
import { ChevronRight } from 'lucide-react';

const MilestoneCard = ({ 
  milestone, 
  currentUser, 
  funnelData,
  onClick,
  isSelected,
  setCurrentChat
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState(null);

  const handleMilestoneClick = async () => {
    try {
      // Get the primary agent based on funnel type
      const primaryAgent = milestone.funnelName.toLowerCase() === 'onboarding funnel' 
        ? 'shawn' 
        : milestone.responsibleAgents?.lead || 'shawn';

      const supportingAgents = milestone.responsibleAgents?.supporting || [];

      // Set up chat context with funnel progression data
      const chatContext = {
        id: milestone.conversationId || `milestone-${milestone.name}`,
        agentId: primaryAgent,
        title: `${milestone.name} - ${milestone.funnelName}`,
        participants: [currentUser.uid, primaryAgent, ...supportingAgents],
        isDefault: false,
        conversationName: milestone.conversationId || `milestone-${milestone.name}`,
        milestone: {
          name: milestone.name,
          funnelName: milestone.funnelName,
          currentProgress: milestone.progress || 0,
          description: milestone.description,
          requirements: milestone.formsNeeded || []
        }
      };

      setCurrentChat(chatContext);
      if (onClick) onClick(milestone);

    } catch (error) {
      console.error('Error starting milestone:', error);
      setError('Unable to start. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Early return if invalid data
  if (!milestone?.name) return null;

  const {
    name = 'Untitled Milestone',
    description = '',
    progress = 0,
    funnelName = '',
  } = milestone;

  const isNewUser = !funnelData || Object.keys(funnelData).length === 0;
  const isOnboarding = funnelName.toLowerCase() === 'onboarding funnel';
  const effectiveProgress = isNewUser && isOnboarding ? 0 : progress;

  return (
    <Card 
      className={`p-4 transition-all duration-200 cursor-pointer hover:shadow-md
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isHovered ? 'bg-gray-50' : ''}`}
      onClick={handleMilestoneClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
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
          <h3 className="font-medium text-gray-900 mb-1">
            {name}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>
        <ChevronRight 
          className={`h-5 w-5 transform transition-transform duration-200 
            ${isHovered ? 'translate-x-1' : ''} text-gray-400`}
        />
      </div>

      {/* Progress Meter - Main Interactive Element */}
      <div className="mt-4">
        <MilestoneProgress 
          progress={effectiveProgress}
          isAnimated={true}
          onClick={handleMilestoneClick}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </div>

      {/* Simple Funnel Label */}
      <div className="mt-3 text-sm text-gray-500">
        {funnelName}
      </div>
    </Card>
  );
};

export default MilestoneCard;