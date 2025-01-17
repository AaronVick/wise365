// components/milestoneFunnels/MilestoneProgress.js

import React, { useEffect, useState } from 'react';

const MilestoneProgress = ({ 
  progress = 0, 
  isAnimated = true,
  onClick,
  className = ''
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const normalizedProgress = Math.min(Math.max(Number(progress) || 0, 0), 100);

  useEffect(() => {
    if (!isAnimated) {
      setAnimatedProgress(normalizedProgress);
      return;
    }

    const animationDuration = 1000;
    const steps = 60;
    const increment = normalizedProgress / steps;
    let currentProgress = 0;

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

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-blue-400';
  };

  return (
    <div 
      className={`space-y-2 ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* Progress Label */}
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-900">
          {Math.round(normalizedProgress)}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full transition-all duration-300 rounded-full ${
            getProgressColor(normalizedProgress)
          }`}
          style={{ 
            width: `${animatedProgress}%`,
            transition: isAnimated ? 'all 0.3s ease-in-out' : 'none'
          }}
        />
        
        {/* Progress Markers */}
        {[25, 50, 75].map((marker) => (
          <div
            key={marker}
            className={`absolute top-0 bottom-0 w-px ${
              normalizedProgress >= marker ? 'bg-white/30' : 'bg-gray-200'
            }`}
            style={{ left: `${marker}%` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Screen Reader Text */}
      <span className="sr-only">
        Click to continue with this milestone - {Math.round(normalizedProgress)}% complete
      </span>
    </div>
  );
};

export default MilestoneProgress;