import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const SuggestedActions = ({ currentUser, handleAgentClick, userFunnelData, resourcesData }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser?.authenticationID || !currentUser?.teamId) {
        setError('User data not available');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.authenticationID,
            teamId: currentUser.teamId,
            funnelData: userFunnelData,
            resourcesData: resourcesData
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (err) {
        setError('Error fetching suggestions');
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser, userFunnelData, resourcesData]);

  const trackSuggestionClick = async (suggestion) => {
    try {
      await fetch('/api/track-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.authenticationID,
          suggestionType: suggestion.type,
          suggestionTitle: suggestion.title,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error tracking suggestion:', error);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    await trackSuggestionClick(suggestion);
    
    if (suggestion.type === 'agent' && suggestion.agent) {
      handleAgentClick(suggestion.agent);
    }
    // Handle other suggestion types as needed
  };

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
        <div className="text-sm text-red-600">{error}</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between text-left hover:bg-gray-100"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div>
                <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
              <span className="text-blue-600">Start</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          No suggestions available at this time
        </div>
      )}
    </Card>
  );
};

export default SuggestedActions;