// components/MilestoneProgress.js

import React from 'react';

const MilestoneProgress = ({ progress }) => {
  // Function to determine progress bar color
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-1">
      {/* Progress labels */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default MilestoneProgress;
