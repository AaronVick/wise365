// components/MilestoneProgress.js

import React, { useEffect, useState } from 'react';

const MilestoneProgress = ({ progress = 0, isAnimated = true }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Validate and normalize progress value
  const normalizedProgress = Math.min(Math.max(Number(progress) || 0, 0), 100);

  useEffect(() => {
    if (!isAnimated) {
      setAnimatedProgress(normalizedProgress);
      return;
    }

    // Reset animation if progress goes down
    if (normalizedProgress < animatedProgress) {
      setAnimatedProgress(0);
    }

    // Animate progress
    const animationDuration = 1000; // 1 second
    const steps = 60; // 60fps
    const increment = normalizedProgress / steps;
    let currentProgress = animatedProgress;

    const intervalId = setInterval(() => {
      if (currentProgress < normalizedProgress) {
        currentProgress = Math.min(currentProgress + increment, normalizedProgress);
        setAnimatedProgress(currentProgress);
      } else {
        clearInterval(intervalId);
      }
    }, animationDuration / steps);

    return () => clearInterval(intervalId);
  }, [normalizedProgress, isAnimated]);

  // Function to determine progress bar color based on progress value
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // Get ARIA label based on progress
  const getAriaLabel = (progress) => {
    if (progress === 100) return 'Task completed';
    if (progress === 0) return 'Task not started';
    return `Task ${progress}% complete`;
  };

  // Function to get milestone description
  const getMilestoneDescription = (progress) => {
    if (progress === 100) return 'Completed';
    if (progress >= 70) return 'Almost there';
    if (progress >= 30) return 'In progress';
    if (progress > 0) return 'Just started';
    return 'Not started';
  };

  return (
    <div className="space-y-1">
      {/* Progress labels */}
      <div className="flex justify-between items-center text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <span>Progress</span>
          <span className="font-medium">{`${Math.round(normalizedProgress)}%`}</span>
          <span className="text-gray-400">•</span>
          <span className="italic">
            {getMilestoneDescription(normalizedProgress)}
          </span>
        </div>
      </div>

      {/* Progress bar container */}
      <div
        role="progressbar"
        aria-valuenow={normalizedProgress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={getAriaLabel(normalizedProgress)}
        className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        {/* Progress bar fill */}
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-300 rounded-full ${
            getProgressColor(normalizedProgress)
          }`}
          style={{ 
            width: `${animatedProgress}%`,
            transition: isAnimated ? 'width 0.3s ease-in-out' : 'none'
          }}
        />
        
        {/* Progress markers */}
        {[25, 50, 75].map((marker) => (
          <div
            key={marker}
            className={`absolute top-0 bottom-0 w-px ${
              normalizedProgress >= marker ? 'bg-white/30' : 'bg-gray-300/50'
            }`}
            style={{ left: `${marker}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Additional information for screen readers */}
      <div className="sr-only">
        {`Current progress is ${normalizedProgress} percent. ${getMilestoneDescription(
          normalizedProgress
        )}`}
      </div>
    </div>
  );
};

export default MilestoneProgress;