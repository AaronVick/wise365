import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Home, 
  Settings,
  ChevronLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardContent from '../components/DashboardContent'; 
import ChatInterface from '../components/ChatInterface';

const agents = [
  { id: 'mike', name: 'Mike', role: 'Trusted Marketing Strategist', category: 'Marketing' },
  { id: 'shawn', name: 'Shawn', role: 'Tool Guidance Assistant', category: 'Administrative' },
  { id: 'alex', name: 'Alex', role: 'Persona Pilot Pro', category: 'Sales' },
  { id: 'sylvester', name: 'Sylvester', role: 'Marketing Success Wheel Optimizer', category: 'Marketing' },
  { id: 'ally', name: 'Ally', role: 'Positioning Factors Accelerator', category: 'Marketing' },
  { id: 'aaron', name: 'Aaron', role: 'T.I.N.B. Builder', category: 'Sales' },
  { id: 'deborah', name: "De'Borah", role: 'Facebook Marketing Maestro', category: 'Social Media' },
  { id: 'claire', name: 'Claire', role: 'LinkedIn Messaging Maestro', category: 'Social Media' },
  { id: 'ej', name: 'EJ', role: 'TikTok Marketing Maestro', category: 'Social Media' },
  { id: 'lisa', name: 'Lisa', role: 'Instagram Marketing Maestro', category: 'Social Media' },
  { id: 'troy', name: 'Troy', role: 'CrossSell Catalyst', category: 'Sales' },
  { id: 'rom', name: 'Rom', role: 'PitchPerfect AI', category: 'Administrative' },
  { id: 'larry', name: 'Larry', role: 'Market Edge AI', category: 'Administrative' },
  { id: 'jen', name: 'Jen', role: 'CloseMaster AI', category: 'Administrative' },
  { id: 'daniela', name: 'Daniela', role: 'Reputation Builder AI', category: 'Administrative' },
  { id: 'antonio', name: 'Antonio', role: 'Video Story Architect', category: 'Copy Editing' },
  { id: 'mason', name: 'Mason', role: 'StoryAlign AI', category: 'Copy Editing' },
  { id: 'gabriel', name: 'Gabriel', role: 'Blog Blueprint', category: 'Copy Editing' },
  { id: 'orion', name: 'Orion', role: 'PersonaLead Magnet Maker', category: 'Marketing' },
  { id: 'sadie', name: 'Sadie', role: 'Ad Copy Maestro', category: 'Copy Editing' },
  { id: 'jesse', name: 'Jesse', role: 'Email Marketing Maestro', category: 'Marketing' },
  { id: 'caner', name: 'Caner', role: 'InsightPulse AI', category: 'Administrative' },
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
  const [hasShawnChat, setHasShawnChat] = useState(false); 
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Authentication and data loading
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.replace('/');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          console.log('No user document found');
          router.replace('/');
          return;
        }

        const userData = { uid: user.uid, ...userDoc.data() };
        setCurrentUser(userData);

        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) {
            setUserTeam(teamDoc.data());
          }
        }

        await fetchRecentActivity(user.uid);
        checkShawnChat(user.uid);
      } catch (error) {
        console.error('Error loading user data:', error);
        router.replace('/');
      } finally {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkShawnChat = async (userId) => {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(conversationsRef, where('agentId', '==', 'shawn'), where('participants', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      setHasShawnChat(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking Shawn chat:', error);
      setHasShawnChat(false);
    }
  };

  const fetchRecentActivity = async (userId) => {
    try {
      const activityQuery = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
      const snapshot = await getDocs(activityQuery);
      const activity = snapshot.docs.map((doc) => doc.data());
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
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

  // Categorize agents by category
  const categorizedAgents = agents.reduce((categories, agent) => {
    const category = agent.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(agent);
    return categories;
  }, {});

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`w-${sidebarExpanded ? '72' : '20'} bg-gray-900 text-white flex flex-col overflow-auto`}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-semibold text-sm">Business Wise365</h1>
          <Button variant="ghost" onClick={() => setSidebarExpanded(!sidebarExpanded)} className="text-gray-400">
            {sidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2">
            <Button variant="ghost" className="w-full justify-start mb-1" onClick={() => setCurrentView('dashboard')}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>

            {/* Categorized Agents */}
            {Object.keys(categorizedAgents).map((category) => (
              <div key={category}>
                <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">{category}</div>
                {categorizedAgents[category].map((agent) => (
                  <Button
                    key={agent.id}
                    variant="ghost"
                    className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                    onClick={() => setCurrentView('chat')}
                  >
                    <div className="flex items-center w-full">
                      <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                      <span className="truncate text-xs">{`${agent.name} - ${agent.role}`}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ))}

            {/* Projects Section */}
            <div className="mt-4">
              <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">PROJECTS</div>
              <Button variant="ghost" className="w-full h-8 justify-start text-gray-400 px-2 py-1">
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
          <DashboardContent currentUser={currentUser} userTeam={userTeam} recentActivity={recentActivity} />
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

        {/* Chat with Shawn in Dashboard */}
        {!hasShawnChat && currentView === 'dashboard' && (
          <Button 
            variant="ghost" 
            className="w-full justify-start mb-1" 
            onClick={() => setCurrentView('chat')}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Chat with Shawn
          </Button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
