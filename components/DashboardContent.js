// components/DashboardContent.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDoc,
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
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { cva } from "class-variance-authority";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useDashboard } from '../contexts/DashboardContext';
import { agents } from '../data/agents';
import dynamic from 'next/dynamic';
const MilestonesSection = dynamic(() => import('./MilestonesSection'));
import { evaluateUserFunnels } from '../components/funnelEvaluator';
import { useProgressAnalyzer } from '../components/ProgressAnalyzer';
import { createFunnelProject } from '../components/FunnelActionHandler';




// Badge component definition
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




const DashboardContent = ({ 
  currentUser, 
  currentTool, 
  onToolComplete, 
  setCurrentTool,
  currentChat,
  setCurrentChat
}) => {

  if (!setCurrentChat || typeof setCurrentChat !== 'function') {
    console.error('setCurrentChat is not a function');
    return null;
  }
  
  const router = useRouter();
  const [hasShawnChat, setHasShawnChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const { 
    goals,
    setGoals,
    recentActivity,
    isLoading
  } = useDashboard();

  const loadConversationMessages = async (conversationId) => {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationSnapshot = await getDoc(conversationRef);  // Use getDoc instead
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

      // Update currentChat instead of using setCurrentConversation
      setCurrentChat({
        id: newConversation.id,
        agentId: agent.id,
        title: `${agent.name} Conversation`,
        participants: [currentUser.uid, agent.id],
        isDefault: false,
        conversationName: newConversation.id
      });

      await loadConversationMessages(newConversation.id);
      router.push(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async (messageContent) => {
    if (!currentChat?.id) return;
    
    const conversationRef = doc(db, 'conversations', currentChat.id);
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

      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAgentClick = async (agent) => {
    if (!agent?.id || !currentUser?.uid) {
      console.error('Missing required agent or user data');
      return;
    }
  
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('agentId', '==', agent.id),
        where('participants', 'array-contains', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        setCurrentChat({
          id: existingDoc.id,
          agentId: agent.id,
          title: existingData.name || `${agent.name} Conversation`,
          participants: existingData.participants || [currentUser.uid, agent.id],
          isDefault: existingData.isDefault || false,
          conversationName: existingDoc.id
        });
        router.push(`/chat/${existingDoc.id}`);
      } else {
        await startConversation(agent);
      }
    } catch (error) {
      console.error('Error handling agent click:', error);
    }
  };

  const getOnboardingFunnel = async (user) => {
    try {
      const funnelsRef = collection(db, 'funnels');
      const funnelSnapshot = await getDocs(funnelsRef);
      const allFunnels = funnelSnapshot.docs.map(doc => doc.data());
      
      const userFunnelData = {}; // Initialize with user's funnel data if needed
      const evaluatedFunnels = evaluateUserFunnels(allFunnels, user, userFunnelData);
      
      return evaluatedFunnels.inProgress.find(
        funnel => funnel.name.toLowerCase() === 'onboarding funnel'
      ) || null;
    } catch (error) {
      console.error('Error getting onboarding funnel:', error);
      return null;
    }
  };
  
  const gatherFunnelInsights = async (user, funnel) => {
    try {
      if (!funnel?.milestones?.[0]) {
        return { nextSteps: [], insights: [], blockers: [] };
      }
  
      // Instead of using the hook directly, call the API endpoint
      const response = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.authenticationID,
          funnel: funnel,
          milestone: funnel.milestones[0]
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to analyze progress');
      }
  
      const analysis = await response.json();
      return analysis || { nextSteps: [], insights: [], blockers: [] };
    } catch (error) {
      console.error('Error gathering funnel insights:', error);
      return { nextSteps: [], insights: [], blockers: [] };
    }
  };

  
  
  const analyzeUserContext = async (user) => {
    try {
      // Fetch conversation history
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.authenticationID),
        orderBy('timestamp', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const conversations = querySnapshot.docs.map(doc => doc.data());
  
      // Analyze chat history
      const response = await fetch('/api/analyze-chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.authenticationID, conversations }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to analyze chat history');
      }
  
      const analysis = await response.json();
  
      // Generate recommendations
      const recommendationsResponse = await fetch('/api/analyze-user-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.authenticationID,
          groupedData: analysis.groupedData,
        }),
      });
  
      if (!recommendationsResponse.ok) {
        throw new Error('Failed to analyze user context');
      }
  
      const recommendations = await recommendationsResponse.json();
  
      return {
        insights: analysis.insights || [],
        blockers: recommendations.blockers || [],
        nextSteps: recommendations.nextSteps || [],
      };
    } catch (error) {
      console.error('Error analyzing user context:', error);
      return { insights: [], blockers: [], nextSteps: [] };
    }
  };


  useEffect(() => {
    let mounted = true;
    
    // Initialize messages if we have a currentChat
    if (currentChat?.id) {
      loadConversationMessages(currentChat.id)
        .then(() => {
          if (!mounted) return;
        })
        .catch(error => {
          if (!mounted) return;
          console.error('Error loading messages:', error);
        });
    }
  
    return () => {
      mounted = false;
    };
  }, [currentChat?.id]);

  

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
          onClick={async () => {
            try {
              console.log('Starting Shawn chat initialization...'); 
              
              if (!currentUser?.authenticationID) {
                console.error('No authentication ID available:', currentUser);
                return;
              }
          
              const namesRef = collection(db, 'conversationNames');
              console.log('Checking for existing Shawn chat...'); 
              
              const defaultNameQuery = query(
                namesRef,
                where('agentId', '==', 'shawn'),
                where('userId', '==', currentUser.authenticationID),
                where('isDefault', '==', true)
              );
              
              const querySnapshot = await getDocs(defaultNameQuery);
              let chatId;
              let isNewUser = false;
          
              if (querySnapshot.empty) {
                console.log('No existing chat found, creating new one...'); 
                isNewUser = true;
          
                // Create new conversation name document
                const nameDoc = await addDoc(namesRef, {
                  agentId: 'shawn',
                  conversationName: 'Chat with Shawn',
                  userId: currentUser.authenticationID,
                  isDefault: true,
                  projectName: '',
                  timestamp: serverTimestamp()
                });
          
                chatId = nameDoc.id;
                console.log('Created new chat with ID:', chatId);
          
                // Get onboarding funnel analysis and context
                const onboardingFunnel = await getOnboardingFunnel(currentUser);
                const insights = await gatherFunnelInsights(currentUser, onboardingFunnel);
                const userContext = await analyzeUserContext(currentUser);
          
                // Prepare context for LLM
                const contextPayload = {
                  user: {
                    name: currentUser.name,
                    role: currentUser.role,
                    authenticationID: currentUser.authenticationID
                  },
                  funnel: {
                    name: onboardingFunnel?.name,
                    milestones: onboardingFunnel?.milestones?.map(m => m.name) || [],
                    insights: insights?.nextSteps || [],
                    blockers: insights?.blockers || [],
                  },
                  userContext: {
                    insights: userContext?.insights || [],
                    blockers: userContext?.blockers || [],
                    nextSteps: userContext?.nextSteps || [],
                  },
                  agent: {
                    name: "Shawn",
                    role: "Tool Guidance Assistant",
                  },
                };
          
                // Get LLM-generated opening message
                const llmResponse = await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    messages: [
                      {
                        role: 'system',
                        content: `You are Shawn, the guidance assistant for Business Wise365. Based on the following context, generate a personalized welcome message and initial guidance for the user. Consider their role, any identified needs or blockers, and suggest relevant next steps or tools that would be most beneficial for them.
          
          Context:
          ${JSON.stringify(contextPayload, null, 2)}
          
          Focus on being helpful and specific while maintaining a friendly, conversational tone. If there are clear next steps or tools that would benefit the user, mention them specifically.`
                      },
                      {
                        role: 'user',
                        content: 'Generate an appropriate welcome message and initial guidance based on the provided context.'
                      }
                    ]
                  }),
                });
          
                if (!llmResponse.ok) {
                  throw new Error('Failed to generate welcome message');
                }
          
                const { reply: welcomeContent } = await llmResponse.json();
          
                // Create initial message in conversations collection
                // Matching exact structure from your Firebase
                const messagesRef = collection(db, 'conversations');
                await addDoc(messagesRef, {
                  agentId: 'shawn',
                  content: welcomeContent,
                  conversationName: chatId,
                  from: 'shawn',
                  isDefault: true,
                  timestamp: serverTimestamp(),
                  type: 'agent'
                });
          
                // Add user's first automatic message to maintain conversation flow
                await addDoc(messagesRef, {
                  agentId: 'shawn',
                  content: "Hi, I'd like to learn more about Business Wise365.",
                  conversationName: chatId,
                  from: currentUser.authenticationID,
                  isDefault: true,
                  timestamp: serverTimestamp(),
                  type: 'user'
                });
              } else {
                console.log('Found existing chat');
                chatId = querySnapshot.docs[0].id;
              }
          
              // Set the current chat with minimal required data
              const chatData = {
                id: chatId,
                agentId: 'shawn',
                title: 'Chat with Shawn',
                participants: [currentUser.authenticationID, 'shawn'],
                isDefault: true,
                conversationName: chatId
              };
              
              console.log('Setting current chat with data:', chatData);
              setCurrentChat(chatData);
              setHasShawnChat(true);
          
            } catch (error) {
              console.error('Error in Shawn chat initialization:', error);
              console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
              });
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Chat with Shawn
        </Button>
      </div>
    </div>
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

          {/* Milestones Section */}
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">Milestones</h3>
  <MilestonesSection currentUser={currentUser} />
</Card>


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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGoalModalOpen(true)}  // Using the passed down state
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/seed', { 
                          method: 'POST' 
                        });
                        const data = await response.json();
                        alert('Templates seeded successfully!');
                        console.log('Seed results:', data);
                      } catch (error) {
                        console.error('Error seeding templates:', error);
                        alert('Error seeding templates');
                      }
                    }}
                  >
                    Seed Templates
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                {isLoading ? (
                  <div className="text-center py-4">Loading resources...</div>
                ) : (
                  <div className="space-y-4">
                                      <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentTool('buyer-persona');
                      }}
                      className="w-full justify-between text-left hover:bg-gray-100"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-900">Best Buyer Persona</h4>
                        <p className="text-xs text-gray-600">Create detailed buyer personas</p>
                      </div>
                      <span className="text-blue-600">Fill Out</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentTool('success-wheel');
                      }}
                      className="w-full justify-between text-left hover:bg-gray-100"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-900">Marketing Success Wheel</h4>
                        <p className="text-xs text-gray-600">Evaluate your marketing performance</p>
                      </div>
                      <span className="text-blue-600">Fill Out</span>
                    </Button>

                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentTool('positioning-factors');
                      }}
                      className="w-full justify-between text-left hover:bg-gray-100"
                    >
                      <div className="text-left">
                        <h4 className="text-sm font-medium text-gray-900">Positioning Factors</h4>
                        <p className="text-xs text-gray-600">Define your market positioning</p>
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
