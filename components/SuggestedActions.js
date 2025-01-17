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
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseService from '../lib/services/firebaseService';
import { agents } from '../data/agents';

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
    const generateSuggestions = async () => {
      if (!currentUser?.uid) {
        setIsLoading(false);
        setError('Please log in to see suggestions');
        return;
      }

      try {
        const allSuggestions = [];
        const categoryCounts = {
          resources: 0,
          funnels: 0,
          agents: 0
        };

        // 1. Check incomplete resources
        const resourcesRef = collection(db, 'resources');
        const resourceQuery = query(
          resourcesRef,
          where('teamId', '==', currentUser.teamId),
          where('status', '==', 'incomplete')
        );
        const resourceSnapshot = await getDocs(resourceQuery);
        
        resourceSnapshot.docs.forEach(doc => {
          const resource = doc.data();
          allSuggestions.push({
            id: doc.id,
            type: 'tool',
            title: `Complete ${resource.name}`,
            description: resource.description || `Continue working on your ${resource.name.toLowerCase()}`,
            toolId: doc.id,
            action: resource.type,
            priority: resource.priority || 2,
            progress: resource.progress || 0
          });
          categoryCounts.resources++;
        });

        // 2. Check funnel status
        if (userFunnelData) {
          const incompleteFunnels = Object.entries(userFunnelData)
            .filter(([_, data]) => data.status === 'incomplete')
            .map(([name, data]) => ({
              name,
              ...data
            }));

          incompleteFunnels.forEach(funnel => {
            allSuggestions.push({
              type: 'funnel',
              title: `Continue ${funnel.name}`,
              description: `Resume work on your ${funnel.name.toLowerCase()}`,
              toolId: funnel.id,
              action: 'continue_funnel',
              priority: 1,
              progress: funnel.progress || 0
            });
            categoryCounts.funnels++;
          });
        }

        // 3. Get recent agent interactions
        const conversationsRef = collection(db, 'conversations');
        const conversationQuery = query(
          conversationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('lastUpdatedAt', 'desc'),
          limit(5)
        );
        const conversationSnapshot = await getDocs(conversationQuery);
        
        const interactedAgentIds = new Set(
          conversationSnapshot.docs.map(doc => doc.data().agentId)
        );

        // Suggest agents that haven't been interacted with
        Object.values(agents).flat().forEach(agent => {
          if (!interactedAgentIds.has(agent.id)) {
            allSuggestions.push({
              type: 'agent',
              title: `Connect with ${agent.name}`,
              description: agent.description || `Start a conversation with ${agent.name} to get expert advice`,
              agent: {
                id: agent.id,
                name: agent.name,
                role: agent.role
              },
              priority: 3
            });
            categoryCounts.agents++;
          }
        });

        // Sort by priority (lower number = higher priority)
        const sortedSuggestions = allSuggestions.sort((a, b) => {
          if (a.priority === b.priority) {
            return (b.progress || 0) - (a.progress || 0);
          }
          return a.priority - b.priority;
        });

        setSuggestions(sortedSuggestions);
        setCategories(categoryCounts);
      } catch (err) {
        console.error('Error generating suggestions:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    generateSuggestions();
  }, [currentUser, userFunnelData]);

  const handleSuggestionClick = async (suggestion) => {
    switch (suggestion.type) {
      case 'agent':
        handleAgentClick(suggestion.agent);
        break;
      case 'tool':
      case 'funnel':
        await firebaseService.update('resources', suggestion.toolId, {
          lastAccessed: new Date()
        });
        setCurrentTool(suggestion.toolId);
        break;
      default:
        console.warn('Unknown suggestion type:', suggestion.type);
    }
  };

  const handleDismiss = async (suggestionId) => {
    try {
      await firebaseService.update('suggestions', suggestionId, {
        status: 'dismissed',
        dismissedAt: new Date()
      });
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };

  const renderSuggestionIcon = (type) => {
    switch (type) {
      case 'agent':
        return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'tool':
        return <Tool className="h-4 w-4 mr-2" />;
      case 'funnel':
        return <Target className="h-4 w-4 mr-2" />;
      default:
        return <Target className="h-4 w-4 mr-2" />;
    }
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
          <p className="text-sm text-gray-600">All caught up! No new suggestions at the moment.</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id || `${suggestion.type}-${suggestion.title}`}
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
                        <Badge 
                          variant={
                            suggestion.type === 'agent' ? 'default' :
                            suggestion.type === 'tool' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {suggestion.type}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {suggestion.description}
                      </p>
                      {suggestion.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{suggestion.progress}%</span>
                          </div>
                          <Progress value={suggestion.progress} className="h-1" />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Button>

                {suggestion.id && (
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
                      <DropdownMenuItem onClick={() => handleDismiss(suggestion.id)}>
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SuggestedActions;