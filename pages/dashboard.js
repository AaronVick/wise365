// pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Home, 
  Settings
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInterface from '../components/ChatInterface';
import DashboardContent from '../components/DashboardContent';
import { DashboardProvider } from '../contexts/DashboardContext';

// Keep the agents array at the top level so it can be exported and used by other components
export const agents = [
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

        console.log('User data loaded:', userData);
        setCurrentUser(userData);

        if (userData.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
          if (teamDoc.exists()) {
            setUserTeam(teamDoc.data());
            console.log('User team data loaded');
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        router.replace('/');
      } finally {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

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
          />
        ) : (
          <ChatInterface
            chatId={currentChat?.id}
            chatType={currentChat?.type}
            participants={currentChat?.participants}
            title={currentChat?.title}
            userId={currentUser?.uid}
            agentId={currentChat?.agentId}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;