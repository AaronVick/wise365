// components/MilestoneCard.js
import React from 'react';
import { useRouter } from 'next/router';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import MilestoneProgress from './MilestoneProgress';
import { ChevronRight } from 'lucide-react';

const MilestoneCard = ({ milestone }) => {
  const router = useRouter();

  const handleMilestoneClick = () => {
    // Navigate to the project chat using the milestone's projectName
    router.push(`/chat/${milestone.conversationId}`);
  };

  // Status badge color mapping
  const statusColors = {
    ready: 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800'
  };

  return (
    <Card 
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleMilestoneClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-medium text-gray-900">{milestone.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[milestone.status]}`}>
              {milestone.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-gray-500">{milestone.description}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-3">
        {/* Progress bar */}
        <MilestoneProgress progress={milestone.progress} />

        {/* KPIs if available */}
        {milestone.kpis && milestone.kpis.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {milestone.kpis.map((kpi, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
              >
                {kpi}
              </span>
            ))}
          </div>
        )}

        {/* Lead Agent */}
        <div className="text-sm text-gray-500">
          Part of: {milestone.funnelName}
        </div>
      </div>
    </Card>
  );
};

export default MilestoneCard;