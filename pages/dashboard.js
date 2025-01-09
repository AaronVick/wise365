

// /pages/dashboard.js
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardContent from '../components/DashboardContent';
import ChatInterface from '../components/ChatInterface'; // Ensure correct import
import { ChevronRight, Home, Settings } from 'lucide-react'; // Added `Settings`


// Agents data
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
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [sidebarWidth, setSidebarWidth] = useState(250); // Default sidebar width

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.replace('/');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ uid: user.uid, ...userDoc.data() });
        } else {
          router.replace('/');
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

  const fetchNestedChats = async (agentId) => {
    const q = query(collection(db, 'conversations'), where('agentId', '==', agentId));
    const snapshot = await getDocs(q);
    const chats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const organized = chats.reduce((acc, chat) => {
      const name = chat.conversationName || 'Default';
      if (!acc[name]) acc[name] = [];
      acc[name].push(chat);
      return acc;
    }, {});
    setNestedChats((prev) => ({ ...prev, [agentId]: organized }));
  };

  const handleAgentClick = async (agent) => {
    await fetchNestedChats(agent.id);
    setCurrentChat({
      id: null,
      title: `Chat with ${agent.name}`,
      agentId: agent.id,
      participants: [currentUser.uid],
    });
  };

  const handleNewConversation = async (agent) => {
    const name = prompt('Enter a name for the new chat:');
    if (!name) return;

    try {
      const docRef = await addDoc(collection(db, 'conversations'), {
        agentId: agent.id,
        conversationName: name,
        from: currentUser.uid,
        timestamp: serverTimestamp(),
      });

      setCurrentChat({
        id: docRef.id,
        title: name,
        agentId: agent.id,
        participants: [currentUser.uid],
      });

      await fetchNestedChats(agent.id);
    } catch (error) {
      console.error('Error creating new conversation:', error);
    }
  };

  const renderNestedChats = (agentId) => {
    const chats = nestedChats[agentId] || {};
    return Object.keys(chats).map((name) => (
      <div key={name} className="ml-2">
        <h4 className="text-xs font-semibold mb-1">{name}</h4>
        {chats[name].map((chat) => (
          <Button
            key={chat.id}
            variant="ghost"
            className="text-left text-xs w-full truncate"
            onClick={() =>
              setCurrentChat({
                id: chat.id,
                title: chat.conversationName || 'Default Chat',
                agentId: chat.agentId,
                participants: [currentUser.uid],
              })
            }
          >
            {chat.conversationName || 'Default Chat'}
          </Button>
        ))}
      </div>
    ));
  };

  const handleSidebarResize = (e) => {
    const newWidth = Math.min(Math.max(e.clientX, 200), window.innerWidth / 3);
    setSidebarWidth(newWidth);
  };

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className="bg-gray-900 text-white"
        style={{ width: `${sidebarWidth}px`, resize: 'horizontal', overflow: 'hidden' }}
      >
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-lg font-bold">Agents</h1>
        </div>
        <ScrollArea className="flex-1">
          {agents.map((agent) => (
            <div key={agent.id} className="mb-2">
              <div
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700"
                onClick={() => handleAgentClick(agent)}
              >
                <span className="text-sm">{agent.name}</span>
                <span className="text-xs text-gray-400">{agent.role}</span>
              </div>
              {nestedChats[agent.id] && renderNestedChats(agent.id)}
            </div>
          ))}
        </ScrollArea>
        <div className="p-4">
          <Button variant="ghost">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
        </div>
      </div>
      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={(e) => {
          e.preventDefault();
          document.addEventListener('mousemove', handleSidebarResize);
          document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleSidebarResize);
          });
        }}
      />
      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={currentUser.uid}
          />
        ) : (
          <DashboardContent currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
