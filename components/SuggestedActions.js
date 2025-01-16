// components/SuggestedActions.js

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const SuggestedActions = ({ 
  currentUser, 
  handleAgentClick,
  userFunnelData,
  resourcesData,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser?.uid || !currentUser?.teamId) {
        setError('User data not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.uid,
            teamId: currentUser.teamId,
            userFunnelData,
            resourcesData
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setError('Failed to load suggestions');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser?.uid, currentUser?.teamId]);

  if (error) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={className}>
        <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex items-start text-left"
            onClick={() => {
              if (suggestion.type === 'agent') {
                handleAgentClick(suggestion.agent);
              } else if (suggestion.type === 'tool') {
                suggestion.action?.();
              }
            }}
          >
            <div>
              <h4 className="font-semibold mb-1">{suggestion.title}</h4>
              <p className="text-sm text-gray-500">{suggestion.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedActions;