// pages/dashboard.js

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseService from '../lib/services/firebaseService';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/Accordion.js';
import { 
  Home,
  Settings,
  LogOut,
  Plus,
  MessageSquare,
  Bot,
  Briefcase,
  Target,
  BookOpen,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { agents } from '../data/agents';
import { useDashboard } from '../contexts/DashboardContext';
import DashboardContent from '../components/DashboardContent';
import ChatInterface from '@/components/ChatInterface';
import BuyerPersona from '../components/toolComponents/buyer-persona';
import SuccessWheel from '../components/toolComponents/success-wheel';
import PositioningFactors from '../components/toolComponents/positioning-factors';
import DashboardSidebar from '@/components/DashboardSidebar';

import { 
  fetchNestedChats, 
  handleAgentClick as handleAgentClickUtil, 
  handleProjectClick as handleProjectClickUtil,
  handleContextMenu 
} from '../lib/dashboardTools';


const ChatWithShawn = dynamic(() => import('@/components/ChatWithShawn'), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading chat interface...</p>
      </div>
    </div>
  ),
});


const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [currentTool, setCurrentTool] = useState(null);
  const [projects, setProjects] = useState([]);
  const [hasShawnChat, setHasShawnChat] = useState(false);
 

  // New state variables for collapsible sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const minWidth = 64;
  const maxWidth = 400;



  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Initialize firebase service with user
          firebaseService.setCurrentUser(user);
    
          // Fetch user data
          const userData = await firebaseService.get('users', user.uid);
          if (userData) {
            setUserData(userData);
    
            // Fetch nested chats
            Object.values(agents).flat().forEach(agent => {
              fetchNestedChats(agent.id, user);
            });
    
            // Fetch projects
            const projectsData = await firebaseService.queryCollection('projectNames', {
              where: [
                { field: 'userId', operator: '==', value: user.authenticationID }
              ]
            });
            setProjects(projectsData);
          } else {
            console.error('No user document found. Redirecting to login...');
            router.replace('/');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    };

    if (!loading && user) {
      fetchData();
    } else if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  
  // Agent handlers
  const handleAgentClick = async (agent) => {
    if (!agent?.id || !userData?.authenticationID) {
      console.error('Missing required agent or user data:', { agent, userData });
      return;
    }

    try {
      // Query all conversations for this agent
      const conversationsRef = collection(db, 'conversationNames');
      const q = query(
        conversationsRef,
        where('agentId', '==', agent.id),
        where('userId', '==', userData.authenticationID)
      );

      const querySnapshot = await getDocs(q);
      const allAgentChats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Find default chat and subchats
      const defaultChat = allAgentChats.find((chat) => chat.isDefault);
      const subChats = allAgentChats.filter((chat) => !chat.isDefault);

      let chatId;
      let isNewUser = false;

      if (!defaultChat) {
        // Create new default conversation
        const chatData = {
          agentId: agent.id,
          conversationName: `Chat with ${agent.name}`,
          userId: userData.authenticationID,
          isDefault: true,
          projectName: '',
          timestamp: serverTimestamp()
        };

        const newChat = await firebaseService.create('conversationNames', chatData);
        chatId = newChat.id;
        isNewUser = true;

        // Create initial system message
        await firebaseService.create('conversations', {
          agentId: agent.id,
          content: `Started conversation with ${agent.name}`,
          conversationName: chatId,
          from: userData.authenticationID,
          isDefault: true,
          timestamp: serverTimestamp(),
          type: 'system'
        });
      } else {
        chatId = defaultChat.id;
      }

      // Update nestedChats state with subchats
      setNestedChats(prev => ({
        ...prev,
        [agent.id]: subChats
      }));

      setCurrentChat({
        id: chatId,
        agentId: agent.id,
        title: `Chat with ${agent.name}`,
        participants: [userData.authenticationID, agent.id],
        isDefault: true,
        conversationName: chatId,
        isNewUser: isNewUser
      });

    } catch (error) {
      console.error('Error handling agent click:', error);
    }
  };

  // Helper functions for Shawn agent
  const generateWelcomeMessage = async ({ userData, context, funnelEvaluation, isNewUser }) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'system',
            content: `You are Shawn, the personal guide for Business Wise365. Generate a personalized welcome message based on the following context:
            User: ${userData.name}
            Is New User: ${isNewUser}
            Context: ${JSON.stringify(context)}
            Funnel Evaluation: ${JSON.stringify(funnelEvaluation)}
            
            If new user: Focus on welcoming them and explaining how you can help.
            If returning user: Acknowledge their return and reference their previous work/progress.
            Keep the tone friendly and professional. Mention specific insights from their context.`
          }]
        })
      });

      if (!response.ok) throw new Error('Failed to generate welcome message');
      const result = await response.json();
      return result.reply;
    } catch (error) {
      console.error('Error generating welcome message:', error);
      return "Hi! I'm Shawn, your personal guide to Business Wise365. How can I help you today?";
    }
  };

  const checkContextChange = async (chatId, newContext, newFunnelEvaluation) => {
    try {
      const messagesRef = collection(db, 'conversations');
      const q = query(
        messagesRef,
        where('conversationName', '==', chatId),
        where('type', '==', 'agent'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return true;
      
      const lastMessage = snapshot.docs[0].data();
      const lastContext = lastMessage.context;
      const lastFunnelEvaluation = lastMessage.funnelEvaluation;
      
      return hasSignificantChanges(lastContext, newContext) || 
             hasSignificantChanges(lastFunnelEvaluation, newFunnelEvaluation);
    } catch (error) {
      console.error('Error checking context change:', error);
      return false;
    }
  };

  // Handle subchat clicking
  const handleSubChatClick = (agentId, subChat) => {
    setCurrentChat({
      id: subChat.id,
      agentId: agentId,
      title: subChat.conversationName || 'Untitled Chat',
      participants: subChat.participants || [userData.authenticationID],
      isDefault: false,
      conversationName: subChat.id
    });
    router.push(`/chat/${subChat.id}`);
  };



  // Project handlers
  const handleProjectClick = async (project) => {
    try {
      await handleProjectClickUtil(project, user, db, setCurrentChat);
      router.push(`/project/${project.id}`);
    } catch (error) {
      console.error('Error handling project click:', error);
    }
  };

  const handleProjectDetails = (project) => {
    try {
      router.push(`/project/${project.id}/details`);
    } catch (error) {
      console.error('Error accessing project details:', error);
    }
  };

  // Context menu handler for creating new chats
  const onAgentContextMenu = (e, agent) => {
    handleContextMenu(e, agent, user, db, setCurrentChat);
  };

  // Handle sidebar resize
  const handleSidebarResize = (e) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    
    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 200), window.innerWidth / 3);
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DashboardSidebar 
        agents={agents}
        projects={projects}
        userData={userData}
        isCollapsed={isCollapsed}
        sidebarWidth={sidebarWidth}
        minWidth={minWidth}
        maxWidth={maxWidth}
        nestedChats={nestedChats}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
        onResize={handleSidebarResize}
        onAgentClick={handleAgentClick}
        onProjectClick={handleProjectClick}
        onProjectDetails={handleProjectDetails}
        onAgentContextMenu={onAgentContextMenu}
        onSignOut={handleSignOut}
        onSubChatClick={handleSubChatClick}
        setCurrentTool={setCurrentTool}
      />

      <div className="flex-1 overflow-auto bg-slate-50">
        {currentChat?.agentId === 'shawn' ? (
          <ChatWithShawn
            currentUser={userData}
            chatId={currentChat.id}
            isNewUser={!hasShawnChat}
            userId={userData?.authenticationID}
            isDefault={currentChat.isDefault}
            title={currentChat.title}
            conversationName={currentChat.conversationName}
          />
        ) : currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={userData?.authenticationID}
            isDefault={currentChat.isDefault}
            title={currentChat.title}
            conversationName={currentChat.conversationName}
            projectId={currentChat.projectId}
            projectName={currentChat.projectName}
          />
        ) : currentTool ? (
          <div className="h-full flex flex-col">
            <header className="border-b bg-white shadow-sm">
              <div className="px-6 py-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {currentTool === 'buyer-persona' && "Buyer Persona Tool"}
                  {currentTool === 'success-wheel' && "Marketing Success Wheel"}
                  {currentTool === 'positioning-factors' && "Positioning Factors"}
                </h1>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              {currentTool === 'buyer-persona' && (
                <BuyerPersona 
                  onComplete={() => setCurrentTool(null)} 
                  currentUser={userData}
                />
              )}
              {currentTool === 'success-wheel' && (
                <SuccessWheel 
                  onComplete={() => setCurrentTool(null)} 
                  currentUser={userData}
                />
              )}
              {currentTool === 'positioning-factors' && (
                <PositioningFactors 
                  onComplete={() => setCurrentTool(null)} 
                  currentUser={userData}
                />
              )}
            </main>
          </div>
        ) : (
          <DashboardContent
            currentUser={userData}
            currentTool={currentTool}
            setCurrentTool={setCurrentTool}
            currentChat={currentChat}
            setCurrentChat={setCurrentChat}
            hasShawnChat={hasShawnChat}
            setHasShawnChat={setHasShawnChat}
            projects={projects} 
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;