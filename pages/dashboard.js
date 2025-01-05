// pages/dashboard.js
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
  limit
} from 'firebase/firestore';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Home, 
  Users, 
  MessageSquare, 
  Settings,
  Clock
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from '../components/ChatInterface';

// All agents list
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

            console.log('User data loaded');
            setCurrentUser(userData);

            if (userData.teamId) {
              const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
              if (teamDoc.exists()) {
                setUserTeam(teamDoc.data());
              }
            }

            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (!hasSeenWelcome) {
              setShowWelcome(true);
              localStorage.setItem('hasSeenWelcome', 'true');
            }

            await fetchRecentActivity(user.uid);
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

  if (!currentUser) {
    return null;
  }

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
              <div className="px-2 mb-2 text-sm text-gray-400 font-semibold">
                THE TEAM
              </div>
              <div className="space-y-1">
                {agents.map((agent) => (
                  <div key={agent.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start group"
                      onClick={() => handleAgentClick(agent)}
                    >
                      <ChevronRight className="h-4 w-4 mr-1" />
                      <span className="truncate">{agent.name}</span>
                      <Plus className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div className="mt-4">
              <div className="px-2 mb-2 text-sm text-gray-400 font-semibold">
                PROJECTS
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
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

// Separate component for dashboard content
const DashboardContent = ({ showWelcome, recentActivity, currentUser }) => (
  <>
    <div className="bg-white border-b h-16 flex items-center px-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
    </div>
    <ScrollArea className="flex-1 p-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        {showWelcome && (
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">S</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Welcome to Business Wise365!</h3>
                <p className="text-gray-600">
                  Hi, I'm Shawn, your personal guide to our AI team. I'll help you navigate our
                  platform and connect you with the right experts for your business needs.
                  Let me know what you'd like to achieve, and I'll point you in the right direction.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-500" />
              <h3 className="text-lg font-semibold">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
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
            ))}
          </div>
        </Card>
      </div>
    </ScrollArea>
  </>
);

export default Dashboard;