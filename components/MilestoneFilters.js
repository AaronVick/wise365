// components/MilestoneFilters.js

import React from 'react';
import { Button } from '../ui/button';

const MilestoneFilters = ({ activeFilter, onFilterChange }) => {
  // Define filter options
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'ready', label: 'Ready' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' }
  ];

  return (
    <div className="flex space-x-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange(filter.id)} // Update filter on click
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default MilestoneFilters;
