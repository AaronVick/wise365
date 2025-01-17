import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import firebaseService from '../lib/services/firebaseService';

const SuggestedActions = ({ currentUser, handleAgentClick }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser?.authenticationID) {
        setError('User authentication not available');
        setLoading(false);
        return;
      }

      try {
        // Fetch all required data using FirebaseService
        const userData = await firebaseService.getUserData(currentUser.authenticationID);
        const teamData = currentUser.teamId ? await firebaseService.getTeamData(currentUser.teamId) : null;
        const funnelData = await firebaseService.getFunnelData(currentUser.authenticationID);
        const resourcesData = await firebaseService.getResourcesData(currentUser.authenticationID);

        // Prepare the payload
        const payload = {
          userId: currentUser.authenticationID,
          teamId: currentUser.teamId || null,
          userData: userData || {},
          teamData: teamData || {},
          funnelData: funnelData || [],
          resourcesData: resourcesData || []
        };

        const response = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }

        const data = await response.json();
        
        // Filter out any invalid suggestions
        const validSuggestions = data.suggestions.filter(suggestion => 
          suggestion && suggestion.title && suggestion.type
        );

        setSuggestions(validSuggestions);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError('Unable to load suggestions at this time');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  const trackSuggestionClick = async (suggestion) => {
    if (!currentUser?.authenticationID) return;

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
  };

  // Default suggestions for new users or when API fails
  const getDefaultSuggestions = () => [
    {
      title: "Complete Your Profile",
      description: "Add your business details to get personalized recommendations",
      type: "profile",
    },
    {
      title: "Chat with Shawn",
      description: "Get started with a guided introduction to Business Wise365",
      type: "agent",
      agent: { id: 'shawn', name: 'Shawn' }
    }
  ];

  if (error) {
    // Show default suggestions instead of error message for better UX
    setSuggestions(getDefaultSuggestions());
    setError(null);
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
          {getDefaultSuggestions().map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-between text-left hover:bg-gray-100 mb-2"
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
      )}
    </Card>
  );
};

export default SuggestedActions;