
// pages/dashboard.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  doc, 
  addDoc,
  serverTimestamp,
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
  const [currentChat, setCurrentChat] = useState(null);

  // Check authentication and load user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          router.replace('/');
          return;
        }
        const userData = { uid: user.uid, ...userDoc.data() };
        setCurrentUser(userData);

        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) setUserTeam(teamDoc.data());
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        router.replace('/');
      } finally {
        setAuthChecked(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Open the default conversation for an agent
  const handleAgentClick = async (agent) => {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('agentId', '==', agent.id),
        where('conversationName', '==', null)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setCurrentChat({
          id: null,
          title: `Chat with ${agent.name}`,
          agentId: agent.id,
          participants: [currentUser.uid],
        });
      } else {
        await addDoc(collection(db, 'conversations'), {
          agentId: agent.id,
          conversationName: null,
          from: currentUser.uid,
          timestamp: serverTimestamp(),
        });
        setCurrentChat({
          id: null,
          title: `Chat with ${agent.name}`,
          agentId: agent.id,
          participants: [currentUser.uid],
        });
      }
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  // Create and open a new conversation
  const handleNewConversation = async (agent, name) => {
    try {
      await addDoc(collection(db, 'conversations'), {
        agentId: agent.id,
        conversationName: name,
        from: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setCurrentChat({
        id: name,
        title: name,
        agentId: agent.id,
        participants: [currentUser.uid],
      });
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  // Loading state
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

  if (!currentUser) return null;

  // Categorize agents
  const categorizedAgents = agents.reduce((categories, agent) => {
    if (!categories[agent.category]) categories[agent.category] = [];
    categories[agent.category].push(agent);
    return categories;
  }, {});

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Business Wise365</h1>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="w-full mb-2">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            {Object.keys(categorizedAgents).map((category) => (
              <div key={category}>
                <div className="px-2 text-gray-400">{category}</div>
                {categorizedAgents[category].map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => handleAgentClick(agent)} className="flex-1">
                      {agent.name}
                    </Button>
                    <Button size="sm" onClick={() => handleNewConversation(agent, 'New Chat')}>
                      New Chat
                    </Button>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4">
          <Button variant="ghost">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={currentUser.uid}
          />
        ) : (
          <DashboardContent currentUser={currentUser} userTeam={userTeam} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
