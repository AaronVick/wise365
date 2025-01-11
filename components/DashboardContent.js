// components/DashboardContent.js

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
  getDocs, 
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, 
  Target, 
  MoreVertical, 
  MessageCircle, 
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useDashboard } from '../contexts/DashboardContext';
import { agents } from '../pages/dashboard'; // Assume agents data is already available

// Add Badge component definition
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = ({
  className,
  variant,
  ...props
}) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};

export const DashboardContent = ({ currentUser, userTeam }) => {
  const router = useRouter();
  const [hasShawnChat, setHasShawnChat] = useState(false); // Initialize the state for chat with Shawn
  const [currentConversation, setCurrentConversation] = useState(null); // Track current conversation
  const [messages, setMessages] = useState([]); // Track messages in the conversation
  const { 
    goals = [],
    setGoals,
    recentActivity = [],
    showGoalModal = false,
    setShowGoalModal,
    isLoading = false
  } = useDashboard() || {};

  // Safety check for currentUser
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



  const loadConversationMessages = async (conversationId) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnapshot = await getDocs(conversationRef);
      if (conversationSnapshot.exists()) {
        setMessages(conversationSnapshot.data().messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const startConversation = async (agent) => {
    try {
      const conversationsRef = collection(db, 'conversations');
      const newConversation = await addDoc(conversationsRef, {
        agentId: agent.id,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        isShared: true,
        lastUpdatedAt: serverTimestamp(),
        messages: [],
        name: `${agent.name} Conversation`,
        participants: [currentUser.uid, agent.id],
        teamID: currentUser.teamId,
      });

      setCurrentConversation(newConversation.id);
      loadConversationMessages(newConversation.id); // Load the new conversation
      router.push(`/chat/${newConversation.id}`); // Navigate to the chat window
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async (messageContent) => {
    if (!currentConversation) return;
    
    const conversationRef = doc(db, 'conversations', currentConversation);
    const newMessage = {
      role: currentUser.uid,
      content: messageContent,
      timestamp: serverTimestamp(),
    };

    try {
      await updateDoc(conversationRef, {
        messages: arrayUnion(newMessage),
        lastUpdatedAt: serverTimestamp(),
      });

      // Add the new message to the local state to render it immediately
      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAgentClick = async (agent) => {
    // First check if there's an existing conversation with the agent
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('agentId', '==', agent.id),
      where('participants', 'array-contains', currentUser.uid)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // If a conversation exists, load it
      const existingConversation = querySnapshot.docs[0].data();
      setCurrentConversation(existingConversation.id);
      loadConversationMessages(existingConversation.id); // Load messages
      router.push(`/chat/${existingConversation.id}`);
    } else {
      // If no conversation exists, create a new one
      startConversation(agent);
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
          {/* Welcome Card */}
          {!hasShawnChat && (
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
                  onClick={() => router.push('/chat/shawn')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Chat with Shawn
                </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Existing Conversation (if any) */}
          {messages.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500">{msg.role === currentUser.uid ? 'You' : 'Agent'}:</div>
                      <p className="text-gray-700 ml-2">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="link"
                onClick={() => sendMessage("I'm ready to take the next step!")}
              >
                Send New Message
              </Button>
            </Card>
          )}

          {/* Quick Stats - with null checks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Active Conversations</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{recentActivity?.length || 0}</span>
                <span className="text-sm text-gray-500 ml-2">conversations</span>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Team Members</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  {currentUser?.teamMembers?.length || 0}
                </span>
                <span className="text-sm text-gray-500 ml-2">members</span>
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Active Projects</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">0</span>
                <span className="text-sm text-gray-500 ml-2">projects</span>
              </div>
            </Card>
          </div>

          {/* Suggested Actions */}
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

          {/* Projects Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Projects</h3>
            <Button
              variant="ghost"
              onClick={() => console.log('Creating new project')}
              className="w-full justify-start text-gray-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Card>

          {/* Goals Progress Section */}
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
                    </div>

                    <h4 className="font-medium mb-1">{goal.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
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

           {/* Resources Section */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <div className="text-sm text-gray-500">
                {isLoading ? (
                  <div className="text-center py-4">Loading resources...</div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/buyer-persona')}
                      className="w-full justify-between text-left"
                    >
                      <div>
                        <h4 className="text-sm font-medium">Best Buyer Persona</h4>
                        <p className="text-xs text-gray-500">Create detailed buyer personas</p>
                      </div>
                      <span className="text-blue-600">Fill Out</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/success-wheel')}
                      className="w-full justify-between text-left"
                    >
                      <div>
                        <h4 className="text-sm font-medium">Marketing Success Wheel</h4>
                        <p className="text-xs text-gray-500">Evaluate your marketing performance</p>
                      </div>
                      <span className="text-blue-600">Fill Out</span>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/positioning-factors')}
                      className="w-full justify-between text-left"
                    >
                      <div>
                        <h4 className="text-sm font-medium">Positioning Factors</h4>
                        <p className="text-xs text-gray-500">Define your market positioning</p>
                      </div>
                      <span className="text-blue-600">Fill Out</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>


        </div>
      </ScrollArea>
    </>
  );
};

export default DashboardContent;
