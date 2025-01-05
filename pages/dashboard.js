import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  doc 
} from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import DashboardContent from '../components/DashboardContent';
import { ChevronRight, Home, Settings } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';  // Ensure this is correctly imported

// Agents data with categories
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
  { id: 'jr', name: 'JR', role: 'Audience Gap Genius', category: 'Sales' },
];

const Dashboard = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [hasShawnChat, setHasShawnChat] = useState(false); // Check if Shawn's chat exists
  const [currentChat, setCurrentChat] = useState(null); // Manage the current chat session

  // Authentication and data loading
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.replace('/');
        return;
      }

      try {
        console.log('Fetching user document...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
          console.log('User document not found in Firestore');
          router.replace('/');
          return;
        }

        const userData = { uid: user.uid, ...userDoc.data() };
        setCurrentUser(userData);

        // Fetch user team data if available
        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) {
            setUserTeam(teamDoc.data());
          }
        }

        await checkShawnChat(user.uid);
      } catch (err) {
        console.error('Error loading user data:', err);
        router.replace('/');
      } finally {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check if the user has a chat with Shawn
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
      <div className="w-64 bg-gray-900 text-white flex flex-col font-medium text-sm">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Business Wise365</h1>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2">
            {/* Home Button */}
            <Button 
              variant="ghost" 
              className="w-full justify-start mb-1"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="mr-2 h-4 w-4" />
            </Button>

            {/* Admin Group First */}
            {categorizedAgents['Administrative'] && (
              <div>
                <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">Admin</div>
                {categorizedAgents['Administrative'].map((agent) => (
                  <Button 
                    key={agent.id} 
                    variant="ghost" 
                    className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                    onClick={() => setCurrentChat({ id: agent.id, title: `Chat with ${agent.name}`, agentId: agent.id, participants: [currentUser.uid] })}
                  >
                    <div className="flex items-center w-full">
                      <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                      <span className="truncate text-sm">{`${agent.name} - ${agent.role}`}</span>
                    </div>
                  </Button>
                ))}
              </div>
            )}

            {/* Other Categories */}
            {Object.keys(categorizedAgents).map((category) => (
              category !== 'Administrative' && category !== 'Projects' && (
                <div key={category}>
                  <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">{category}</div>
                  {categorizedAgents[category].map((agent) => (
                    <Button 
                      key={agent.id} 
                      variant="ghost" 
                      className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
                      onClick={() => setCurrentChat({ id: agent.id, title: `Chat with ${agent.name}`, agentId: agent.id, participants: [currentUser.uid] })}
                    >
                      <div className="flex items-center w-full">
                        <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                        <span className="truncate text-sm">{`${agent.name} - ${agent.role}`}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              )
            ))}

            {/* Projects */}
            <div className="px-2 mb-1 text-sm text-gray-400 font-semibold">Projects</div>
            <Button 
              variant="ghost" 
              className="w-full h-8 justify-start group px-2 py-1 mb-0.5"
              onClick={() => router.push('/projects')}
            >
              <div className="flex items-center w-full">
                <ChevronRight className="h-4 w-4 min-w-4 mr-1" />
                <span className="text-sm">Manage Projects</span>
              </div>
            </Button>
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
        {currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            chatType="agent_chat"
            participants={currentChat.participants}
            title={currentChat.title}
            userId={currentUser.uid}
            agentId={currentChat.agentId}
          />
        ) : (
          <DashboardContent currentUser={currentUser} userTeam={userTeam} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
