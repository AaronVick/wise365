// components/milestoneFunnels/MilestoneProgressComponent.js

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const MilestoneProgressComponent = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMilestones = async () => {
      try {
        setLoading(true);
        
        // For new users, initialize with onboarding
        if (!currentUser?.funnelData) {
          setMilestones([{
            name: 'Onboarding',
            description: 'Complete your initial business setup',
            progress: 0,
            status: 'active',
            steps: [
              'Basic Information',
              'Business Goals',
              'Team Structure'
            ]
          }]);
          setLoading(false);
          return;
        }

        // If user has data, load all applicable funnels
        // This would be expanded with actual funnel loading logic
        setMilestones([]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading milestones:', error);
        setError('Failed to load milestones');
        setLoading(false);
      }
    };

    loadMilestones();
  }, [currentUser]);

  const renderMilestone = (milestone) => (
    <div key={milestone.name} className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-lg">{milestone.name}</h3>
          <p className="text-sm text-gray-600">{milestone.description}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          milestone.status === 'active' ? 'bg-blue-100 text-blue-800' : 
          milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {milestone.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${milestone.progress}%` }}
        />
      </div>

      {/* Progress details */}
      <div className="mt-3 text-sm text-gray-600">
        {milestone.progress}% Complete
      </div>

      {/* Steps preview */}
      {milestone.steps && (
        <div className="mt-3 space-y-1">
          {milestone.steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                milestone.progress >= ((index + 1) / milestone.steps.length) * 100
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`} />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : milestones.length > 0 ? (
          milestones.map(milestone => renderMilestone(milestone))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No milestones available
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default MilestoneProgressComponent;