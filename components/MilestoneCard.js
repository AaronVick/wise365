// components/MilestoneCard.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MilestoneProgress from './MilestoneProgress';
import { ChevronRight, CheckCircle2, Circle, Timer } from 'lucide-react';

const MilestoneCard = ({ 
  milestone, 
  currentUser, 
  funnelData,
  onClick,
  isSelected 
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState(null);

  // Status badge color mapping with fallbacks
  const statusColors = {
    ready: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    not_ready: 'bg-gray-100 text-gray-800',
    default: 'bg-gray-100 text-gray-800'
  };

  // Status icons
  const statusIcons = {
    ready: <Circle className="h-4 w-4" />,
    in_progress: <Timer className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    not_ready: <Circle className="h-4 w-4" />
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
    status = 'not_ready',
    progress = 0,
    funnelName = 'Unknown Funnel',
    kpis = []
  } = milestone;

  return (
    <Card 
      className={`p-4 transition-all duration-200 ${
        isHovered ? 'shadow-md' : 'shadow-sm'
      } ${error ? 'border-red-200' : 'border-gray-200'} ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
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
          <div className="flex items-center space-x-2 mb-1">
            {statusIcons[status]}
            <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
              {name}
            </h3>
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium capitalize
                ${statusColors[status] || statusColors.default}`}
            >
              {status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">
            {description}
          </p>
        </div>
        <ChevronRight 
          className={`h-5 w-5 transform transition-transform duration-200 ${
            isHovered ? 'translate-x-1' : ''
          } text-gray-400`}
          aria-hidden="true"
        />
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <MilestoneProgress 
          progress={progress}
          isAnimated={true}
        />

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

      {/* Next Steps or Action Required Indicator */}
      {status === 'ready' && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-blue-600">
            Click to start this milestone
          </p>
        </div>
      )}
    </Card>
  );
};

export default MilestoneCard;