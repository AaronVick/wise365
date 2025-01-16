// /components/SuggestedActions.js

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import _ from 'lodash';

const SuggestedActions = ({ 
  currentUser, 
  handleAgentClick,
  userFunnelData,
  resourcesData = []
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSuggestions = async () => {
      try {
        setLoading(true);
        
        // Fetch suggestions from API
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

        const { suggestions: fetchedSuggestions } = await response.json();
        
        // Sort and limit suggestions
        const prioritizedSuggestions = _.orderBy(
          fetchedSuggestions,
          ['priority', 'relevanceScore'],
          ['asc', 'desc']
        ).slice(0, 3); // Show max 3 suggestions
        
        setSuggestions(prioritizedSuggestions);
      } catch (error) {
        console.error('Error generating suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) {
      generateSuggestions();
    }
  }, [currentUser?.uid, userFunnelData]);

  // Track suggestion interactions
  const handleSuggestionClick = async (suggestion) => {
    try {
      // Log the interaction
      await fetch('/api/track-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          suggestionType: suggestion.type,
          suggestionTitle: suggestion.title,
          timestamp: new Date().toISOString()
        })
      });

      // Handle the action
      if (suggestion.type === 'agent') {
        handleAgentClick(suggestion.agent);
      } else if (suggestion.type === 'tool') {
        suggestion.onClick();
      }
    } catch (error) {
      console.error('Error tracking suggestion interaction:', error);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="h-auto p-4 flex items-start text-left"
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div>
              <h4 className="font-semibold mb-1">{suggestion.title}</h4>
              <p className="text-sm text-gray-500">{suggestion.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default SuggestedActions;