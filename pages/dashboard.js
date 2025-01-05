import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  updateDoc
} from 'firebase/firestore';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Home, 
  Users, 
  MessageSquare, 
  Settings,
  Clock,
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
import ChatInterface from '../components/ChatInterface';
import GoalCreationModal from '../components/GoalCreationModal';

const agents = [
  { id: 'mike', name: 'Mike', role: 'Trusted Marketing Strategist' },
  { id: 'shawn', name: 'Shawn', role: 'Tool Guidance Assistant' },
  { id: 'alex', name: 'Alex', role: 'Persona Pilot Pro' },
  { id: 'sylvester', name: 'Sylvester', role: 'Marketing Success Wheel Optimizer' },
  { id: 'ally', name: 'Ally', role: 'Positioning Factors Accelerator' },
  { id: 'aaron', name: 'Aaron', role: 'T.I.N.B. Builder' },
  { id: 'deborah', name: "De'Borah", role: 'Facebook Marketing Maestro' },
  { id: 'claire', name: 'Claire', role: 'LinkedIn Messaging Maestro' },
  { id: 'ej', name: 'EJ', role: 'TikTok Marketing Maestro' },
  { id: 'lisa', name: 'Lisa', role: 'Instagram Marketing Maestro' },
  { id: 'troy', name: 'Troy', role: 'CrossSell Catalyst' },
  { id: 'rom', name: 'Rom', role: 'PitchPerfect AI' },
  { id: 'larry', name: 'Larry', role: 'Market Edge AI' },
  { id: 'jen', name: 'Jen', role: 'CloseMaster AI' },
  { id: 'daniela', name: 'Daniela', role: 'Reputation Builder AI' },
  { id: 'antonio', name: 'Antonio', role: 'Video Story Architect' },
  { id: 'mason', name: 'Mason', role: 'StoryAlign AI' },
  { id: 'gabriel', name: 'Gabriel', role: 'Blog Blueprint' },
  { id: 'orion', name: 'Orion', role: 'PersonaLead Magnet Maker' },
  { id: 'sadie', name: 'Sadie', role: 'Ad Copy Maestro' },
  { id: 'jesse', name: 'Jesse', role: 'Email Marketing Maestro' },
  { id: 'caner', name: 'Caner', role: 'InsightPulse AI' },
  { id: 'jr', name: 'JR', role: 'Audience Gap Genius' }
];

const Dashboard = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [selectedItem, setSelectedItem] = useState('dashboard');
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentChat, setCurrentChat] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Logging function to help debug
  const logState = () => {
    console.log('currentUser:', currentUser);
    console.log('recentActivity:', recentActivity);
    console.log('goals:', goals);
    console.log('showGoalModal:', showGoalModal);
  };

  // Fetch recent activity
  const fetchRecentActivity = async (userId) => {
    try {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastUpdatedAt', 'desc'),
        limit(10)
      );
      const conversationsSnapshot = await getDocs(conversationsQuery);

      const activity = [];
      conversationsSnapshot.forEach(doc => {
        activity.push({
          id: doc.id,
          type: 'conversation',
          ...doc.data()
        });
      });

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // Fetch goals for the user
  const fetchGoals = async () => {
    if (!currentUser || !currentUser.uid) {
      console.error('User is not authenticated or currentUser uid is null');
      return;  // Ensure that we don't proceed if currentUser is not set
    }

    try {
      const goalsRef = collection(db, 'goals');
      const q = query(
        goalsRef,
        where('userId', '==', currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  // Handle goal creation
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
        autoCreated: false
      });
      setShowGoalModal(false);
      fetchGoals(); // Refresh goals after creating
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  // Handle goal status update
  const handleStatusUpdate = async (goalId, newStatus) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      fetchGoals(); // Refresh goals after updating status
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  // Check auth state on load and update user data
useEffect(() => {
  let unsubscribe;

  const checkAuth = async () => {
    try {
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          console.log('No user found, redirecting to login');
          router.replace('/');
          return;
        }

        try {
          console.log('Fetching user document...');
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (!userDoc.exists()) {
            console.log('No user document found');
            router.replace('/');
            return;
          }

          const userData = {
            uid: user.uid,
            ...userDoc.data()
          };

          console.log('User data loaded:', userData);
          setCurrentUser(userData); // Make sure to update the state

          // Check if user has teamId and set user team data
          if (userData.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
            if (teamDoc.exists()) {
              setUserTeam(teamDoc.data());
              console.log('User team data loaded');
            }
          }

          // Handle welcome screen
          const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
          if (!hasSeenWelcome) {
            setShowWelcome(true);
            localStorage.setItem('hasSeenWelcome', 'true');
          }

          // Fetch recent activity and goals after user is loaded
          await fetchRecentActivity(user.uid);
          await fetchGoals();
        } catch (error) {
          console.error('Error loading user data:', error);
          router.replace('/');
        }
      });
    } catch (error) {
      console.error('Auth check error:', error);
      router.replace('/');
    } finally {
      setAuthChecked(true);
    }
  };

  checkAuth();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, []);



  // Handle navigation between views
  const handleNavigation = (view, chatData = null) => {
    setCurrentView(view);
    setCurrentChat(chatData);
    setSelectedItem(view);
  };

  const handleAgentClick = async (agent) => {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('agentId', '==', agent.id),
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      let chatId;
      
      if (querySnapshot.empty) {
        const newChatRef = await addDoc(conversationsRef, {
          agentId: agent.id,
          participants: [currentUser.uid],
          name: `Chat with ${agent.name}`,
          createdAt: serverTimestamp(),
          lastUpdatedAt: serverTimestamp(),
          messages: []
        });
        chatId = newChatRef.id;
      } else {
        chatId = querySnapshot.docs[0].id;
      }

      handleNavigation('chat', {
        id: chatId,
        type: 'conversation',
        title: `Chat with ${agent.name}`,
        participants: [agent.name],
        agentId: agent.id
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Show loading state if authentication is not checked
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no currentUser, return null
  if (!currentUser) {
    return null;
  }

  // Log state on each render
  logState();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        {/* Company Header */}
        <div 
          className="p-4 border-b border-gray-700 cursor-pointer"
          onClick={() => handleNavigation('dashboard')}
        >
          <h1 className="text-xl font-bold">Business Wise365</h1>
        </div>

        {/* Main Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2">
            <Button 
              variant={selectedItem === 'dashboard' ? "secondary" : "ghost"}
              className="w-full justify-start mb-1"
              onClick={() => handleNavigation('dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            {/* The Team Section */}
            <div className="mt-4">
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">
                THE TEAM
              </div>
              <div>
                {agents.map((agent) => (
                  <div key={agent.id}>
                    <Button
                      variant="ghost"
                      className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                      onClick={() => handleAgentClick(agent)}
                    >
                      <div className="flex items-center w-full">
                        <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                        <span className="truncate text-sm">{agent.name}</span>
                        <Plus className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" />
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div className="mt-4">
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">
                PROJECTS
              </div>
              <Button
                variant="ghost"
                className="w-full h-8 justify-start text-gray-400 px-2 py-1"
              >
                <div className="flex items-center w-full">
                  <Plus className="h-4 w-4 min-w-4 mr-1" />
                  <span className="text-sm">New Project</span>
                </div>
              </Button>
            </div>
          </nav>
        </ScrollArea>

        {/* User Settings */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'dashboard' ? (
          <DashboardContent
            showWelcome={showWelcome}
            recentActivity={recentActivity}
            currentUser={currentUser}
            goals={goals} // pass goals as a prop
            setGoals={setGoals} // pass setGoals as a prop
            setShowGoalModal={setShowGoalModal} // pass modal handler as a prop
          />
        ) : (
          <ChatInterface
            chatId={currentChat.id}
            chatType={currentChat.type}
            participants={currentChat.participants}
            title={currentChat.title}
            userId={currentUser.uid}
            agentId={currentChat.agentId}
          />
        )}
      </div>
    </div>
  );
};

const DashboardContent = ({ showWelcome, recentActivity, currentUser, goals, setGoals, setShowGoalModal }) => {
  const [hasShawnChat, setHasShawnChat] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
      }
    };

    checkShawnChat();
  }, [currentUser]);

  return (
    <>
      <div className="bg-white border-b h-16 flex items-center px-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Shawn's Welcome Message */}
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
                    onClick={() => handleAgentClick({ id: 'shawn', name: 'Shawn' })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Chat with Shawn
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Active Conversations</h4>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{recentActivity.length}</span>
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
                onClick={() => setShowGoalModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Goal</span>
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

          {/* Goal Creation Modal */}
          <GoalCreationModal
            isOpen={showGoalModal}
            onClose={() => setShowGoalModal(false)}
            onSubmit={handleGoalCreate}
            agents={agents}
          />

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>
            </div>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {activity.type === 'conversation' ? (
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                      ) : (
                        <Users className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.name || activity.title}</h4>
                        <span className="text-sm text-gray-500">
                          {activity.lastUpdatedAt?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {activity.type === 'conversation' 
                          ? `Conversation with ${activity.agentId}`
                          : `Project with ${activity.participants?.join(', ')}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No recent activity to show
                </div>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </>
  );
};

export default Dashboard;
