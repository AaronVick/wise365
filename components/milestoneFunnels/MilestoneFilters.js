// components/MilestoneFilters.js

import React from 'react';
import { Button } from '@/components/ui/button';

const MilestoneFilters = ({ 
  activeFilter = 'all', 
  onFilterChange,
  className = '',
  disabled = false
}) => {
  // Define filter options with labels and descriptions for accessibility
  const filters = [
    { 
      id: 'all', 
      label: 'All', 
      description: 'Show all milestones',
      ariaLabel: 'Show all milestones'
    },
    { 
      id: 'ready', 
      label: 'Ready', 
      description: 'Show milestones ready to start',
      ariaLabel: 'Show ready to start milestones'
    },
    { 
      id: 'in_progress', 
      label: 'In Progress', 
      description: 'Show milestones currently in progress',
      ariaLabel: 'Show in progress milestones'
    },
    { 
      id: 'completed', 
      label: 'Completed', 
      description: 'Show completed milestones',
      ariaLabel: 'Show completed milestones'
    }
  ];

  const handleFilterClick = (filterId) => {
    if (disabled || !onFilterChange) return;
    if (activeFilter !== filterId) {
      onFilterChange(filterId);
    }
  };

  return (
    <div 
      className={`flex space-x-2 ${className}`}
      role="radiogroup"
      aria-label="Milestone filter options"
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        
        return (
          <Button
            key={filter.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterClick(filter.id)}
            disabled={disabled}
            aria-pressed={isActive}
            aria-label={filter.ariaLabel}
            title={filter.description}
            className={`
              relative transition-all duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
              ${isActive ? 'font-medium' : 'font-normal'}
            `}
          >
            {/* Badge indicator for active state */}
            {isActive && (
              <span 
                className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
                aria-hidden="true"
              />
            )}
            
            {/* Filter label */}
            <span className={isActive ? 'text-white' : 'text-gray-700'}>
              {filter.label}
            </span>

            {/* Screen reader text */}
            <span className="sr-only">
              {filter.description}
              {isActive ? ' (currently selected)' : ''}
            </span>
          </Button>
        );
      })}
    </div>
  );
};

export default MilestoneFilters;