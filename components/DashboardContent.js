import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, 
  Target, 
  MoreVertical 
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import GoalCreationModal from './GoalCreationModal';
import { useDashboard } from '../contexts/DashboardContext';
import { agents } from '../pages/dashboard';

export const DashboardContent = ({ currentUser, userTeam }) => {
  const router = useRouter();
  const [hasShawnChat, setHasShawnChat] = useState(false); // Initialize the state
  const { 
    goals = [],
    setGoals,
    recentActivity = [],
    showGoalModal = false,
    setShowGoalModal,
    isLoading = false
  } = useDashboard() || {};

   // Add safety check for currentUser
   if (!currentUser?.uid) {
    console.warn('No user data available');
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading user data...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!currentUser?.uid) return;

    const checkShawnChat = async () => {
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('agentId', '==', 'shawn'),
          where('participants', 'array-contains', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        setHasShawnChat(!querySnapshot.empty);
      } catch (error) {
        console.error('Error checking Shawn chat:', error);
        setHasShawnChat(false);
      }
    };

    checkShawnChat();
  }, [currentUser?.uid]);

  const handleGoalCreate = async (goalData) => {
    try {
      const goalsRef = collection(db, 'goals');
      await addDoc(goalsRef, {
        ...goalData,
        userId: currentUser.uid,
        teamId: currentUser.teamId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        autoCreated: false,
        progress: 0
      });
      setShowGoalModal(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleAgentClick = async (agent) => {
    try {
      const conversationsRef = collection(db, 'conversations');
      const newConversation = await addDoc(conversationsRef, {
        agentId: agent.id,
        participants: [currentUser.uid],
        title: `Chat with ${agent.name}`,
        type: 'agent_chat',
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp()
      });
      router.push(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error starting chat with agent:', error);
    }
  };

  const handleStatusUpdate = async (goalId, newStatus) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        progress: newStatus === 'completed' ? 100 : 
                 newStatus === 'in_progress' ? 50 : 0
      });
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  if (!currentUser) {
    return <div>Loading user data...</div>;
  }

  return (
    <>
      <div className="bg-white border-b h-16 flex items-center px-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Chat with Shawn */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">S</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Welcome to Business Wise365!</h3>
                <p className="text-gray-600 mb-4">
                  Hi, I'm Shawn, your personal guide to our AI team. I'll help you navigate our
                  platform and connect you with the right experts for your business needs.
                </p>
                <Button 
                  onClick={() => handleAgentClick({ id: 'shawn', name: 'Shawn' })}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Chat with Shawn
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggested Next Steps */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex items-start text-left"
                onClick={() => handleAgentClick({ id: 'mike', name: 'Mike' })}
              >
                <div>
                  <h4 className="font-semibold mb-1">Develop Marketing Strategy</h4>
                  <p className="text-sm text-gray-500">Chat with Mike to create a comprehensive marketing plan</p>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto p-4 flex items-start text-left"
                onClick={() => handleAgentClick({ id: 'alex', name: 'Alex' })}
              >
                <div>
                  <h4 className="font-semibold mb-1">Define Target Audience</h4>
                  <p className="text-sm text-gray-500">Work with Alex to create detailed buyer personas</p>
                </div>
              </Button>
            </div>
          </Card>

          {/* Projects */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Projects</h3>
            <div className="text-gray-600">Here you can manage your active projects.</div>
          </Card>

          {/* Current Goals */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Current Goals</h3>
              </div>
            </div>

            <div className="space-y-4">
              {goals.length === 0 ? (
                <div className="text-center text-gray-500 py-4">No goals found</div>
              ) : (
                goals.slice(0, 3).map((goal) => (
                  <div 
                    key={goal.id} 
                    className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            goal.status === 'completed' ? 'success' :
                            goal.status === 'in_progress' ? 'default' :
                            'secondary'
                          }
                        >
                          {goal.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Due {format(new Date(goal.dueDate.seconds * 1000), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(goal.id, 'in_progress')}>
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(goal.id, 'completed')}>
                            Mark Complete
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push('/goals')}>
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h4 className="font-medium mb-1">{goal.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`/agents/${goal.agentId}.avatar.png`} />
                          <AvatarFallback>{goal.agentId[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>with {goal.agentId}</span>
                      </div>
                      
                      {goal.progress !== undefined && (
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{goal.progress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {goals.length > 3 && (
                <Button 
                  variant="link" 
                  className="w-full mt-2"
                  onClick={() => router.push('/goals')}
                >
                  View All Goals
                </Button>
              )}
            </div>
          </Card>

          {/* Resources */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <div className="text-gray-600">Here are some helpful resources for your business journey.</div>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
};

export default DashboardContent;
