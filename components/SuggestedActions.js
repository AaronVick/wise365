// components/SuggestedActions.js
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Tool, 
  Target, 
  Loader2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "./ui/badge";

const SuggestedActions = ({ 
  currentUser, 
  handleAgentClick, 
  userFunnelData, 
  resourcesData,
  setCurrentTool 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState({
    resources: 0,
    funnels: 0,
    agents: 0
  });

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!currentUser?.authenticationID || !currentUser?.teamId) {
        setIsLoading(false);
        setError('User data not available');
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
            teamId: currentUser.teamId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to fetch suggestions');
        }

        const data = await response.json();
        setSuggestions(data.suggestions);
        setCategories(data.metadata.categories);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [currentUser]);

  const handleSuggestionClick = (suggestion) => {
    switch (suggestion.type) {
      case 'agent':
        handleAgentClick(suggestion.agent);
        break;
      case 'tool':
        if (suggestion.action === 'continue_funnel') {
          // Handle funnel continuation
          console.log('Continuing funnel:', suggestion.toolId);
        } else {
          setCurrentTool(suggestion.toolId);
        }
        break;
      default:
        console.warn('Unknown suggestion type:', suggestion.type);
    }
  };

  const renderSuggestionIcon = (type) => {
    switch (type) {
      case 'agent':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'tool':
        return <Tool className="h-4 w-4 mr-2" />;
      default:
        return <Target className="h-4 w-4 mr-2" />;
    }
  };

  const renderCategoryBadge = (type) => {
    const badgeStyles = {
      agent: 'bg-blue-100 text-blue-800',
      tool: 'bg-purple-100 text-purple-800',
      funnel: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badgeStyles[type]}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <div className="text-sm text-red-800">
            Error loading suggestions: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Suggested Actions</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex space-x-2">
                {Object.entries(categories).map(([category, count]) => (
                  <Badge
                    key={category}
                    variant="outline"
                    className="text-xs"
                  >
                    {category}: {count}
                  </Badge>
                ))}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of suggestions by category</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          <span className="text-sm text-gray-600">Loading suggestions...</span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No suggestions available at the moment</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${index}`}
                className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-all duration-200"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start p-4 hover:bg-gray-50/50"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {renderSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.title}
                        </h4>
                        {renderCategoryBadge(suggestion.type)}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {suggestion.description}
                      </p>
                      {suggestion.progress && (
                        <div className="mt-2">
                          <Progress value={suggestion.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <span className="sr-only">Open menu</span>
                      <Tool className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => console.log('Dismiss suggestion')}>
                      Dismiss
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => console.log('Snooze suggestion')}>
                      Snooze
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SuggestedActions;