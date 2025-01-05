import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
import DashboardContent from '../components/DashboardContent';

const agents = [
  // Administrative agents
  { id: 'aaron', name: 'Aaron', role: 'T.I.N.B. Builder', category: 'Administrative' },
  { id: 'rom', name: 'Rom', role: 'PitchPerfect AI', category: 'Administrative' },
  { id: 'daniela', name: 'Daniela', role: 'Reputation Builder AI', category: 'Administrative' },
  { id: 'mason', name: 'Mason', role: 'StoryAlign AI', category: 'Administrative' },

  // Marketing agents
  { id: 'mike', name: 'Mike', role: 'Trusted Marketing Strategist', category: 'Marketing' },
  { id: 'shawn', name: 'Shawn', role: 'Tool Guidance Assistant', category: 'Marketing' },
  { id: 'alex', name: 'Alex', role: 'Persona Pilot Pro', category: 'Marketing' },
  { id: 'sylvester', name: 'Sylvester', role: 'Marketing Success Wheel Optimizer', category: 'Marketing' },
  { id: 'ally', name: 'Ally', role: 'Positioning Factors Accelerator', category: 'Marketing' },
  { id: 'deborah', name: "De'Borah", role: 'Facebook Marketing Maestro', category: 'Marketing' },
  { id: 'claire', name: 'Claire', role: 'LinkedIn Messaging Maestro', category: 'Marketing' },
  { id: 'ej', name: 'EJ', role: 'TikTok Marketing Maestro', category: 'Marketing' },
  { id: 'lisa', name: 'Lisa', role: 'Instagram Marketing Maestro', category: 'Marketing' },
  { id: 'sadie', name: 'Sadie', role: 'Ad Copy Maestro', category: 'Marketing' },
  { id: 'jesse', name: 'Jesse', role: 'Email Marketing Maestro', category: 'Marketing' },

  // Sales agents
  { id: 'troy', name: 'Troy', role: 'CrossSell Catalyst', category: 'Sales' },
  { id: 'larry', name: 'Larry', role: 'Market Edge AI', category: 'Sales' },
  { id: 'jen', name: 'Jen', role: 'CloseMaster AI', category: 'Sales' },
  { id: 'antonio', name: 'Antonio', role: 'Video Story Architect', category: 'Sales' },
  { id: 'gabriel', name: 'Gabriel', role: 'Blog Blueprint', category: 'Sales' },
  { id: 'orion', name: 'Orion', role: 'PersonaLead Magnet Maker', category: 'Sales' },
  { id: 'caner', name: 'Caner', role: 'InsightPulse AI', category: 'Sales' },
  { id: 'jr', name: 'JR', role: 'Audience Gap Genius', category: 'Sales' }
];

const Dashboard = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentChat, setCurrentChat] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Authentication and data loading
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          console.log('No user found, redirecting to login');
          router.replace('/');
          return;
        }

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

        // Get team data if user has a team
        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) {
            setUserTeam(teamDoc.data());
          }
        }

        // Load recent activity
        await fetchRecentActivity(user.uid);
      } catch (error) {
        console.error('Error loading user data:', error);
        router.replace('/');
      } finally {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch recent activity
  const fetchRecentActivity = async (userId) => {
    try {
      const activityQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId)
      );
      const snapshot = await getDocs(activityQuery);
      const activity = snapshot.docs.map(doc => doc.data());
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  // Show loading state while checking auth
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

  // If auth is checked and no user, the useEffect will handle redirect
  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Business Wise365</h1>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-1" 
              onClick={() => setCurrentView('dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            {/* Team Section */}
            <div className="mt-4">
              {/* Administrative agents */}
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">Administrative</div>
              {agents.filter(agent => agent.category === 'Administrative').map((agent) => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                  onClick={() => setCurrentView('chat')}
                >
                  <div className="flex items-center w-full">
                    <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                    <span className="truncate text-sm">{agent.name} - <span className="italic">{agent.role}</span></span>
                  </div>
                </Button>
              ))}
              
              {/* Marketing agents */}
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">Marketing</div>
              {agents.filter(agent => agent.category === 'Marketing').map((agent) => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                  onClick={() => setCurrentView('chat')}
                >
                  <div className="flex items-center w-full">
                    <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                    <span className="truncate text-sm">{agent.name} - <span className="italic">{agent.role}</span></span>
                  </div>
                </Button>
              ))}

              {/* Sales agents */}
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">Sales</div>
              {agents.filter(agent => agent.category === 'Sales').map((agent) => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                  onClick={() => setCurrentView('chat')}
                >
                  <div className="flex items-center w-full">
                    <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                    <span className="truncate text-sm">{agent.name} - <span className="italic">{agent.role}</span></span>
                  </div>
                </Button>
              ))}
            </div>
          </nav>
        </ScrollArea>

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
            currentUser={currentUser}
            userTeam={userTeam}
            recentActivity={recentActivity}
          />
        ) : (
          <ChatInterface 
            chatId={currentChat?.id || ''}
            chatType={currentChat?.type || 'default'}
            participants={currentChat?.participants || []}
            title={currentChat?.title || 'New Chat'}
            userId={currentUser?.uid || ''}
            agentId={currentChat?.agentId || ''}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
