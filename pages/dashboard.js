import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">
                THE TEAM
              </div>
              <div>
                {agents.map((agent) => (
                  <div key={agent.id}>
                    <Button
                      variant="ghost"
                      className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                      onClick={() => setCurrentView('chat')}
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
