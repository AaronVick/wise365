// pages/dashboard.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/Accordion';
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
  LayoutDashboard
} from 'lucide-react';
import { agents } from '../data/agents';
import { useDashboard } from '../contexts/DashboardContext';
import DashboardContent from '../components/DashboardContent';
import ChatInterface from '@/components/ChatInterface';
import ChatWithShawn from '@/components/ChatWithShawn';
import { 
  fetchNestedChats, 
  handleAgentClick as handleAgentClickUtil, 
  handleProjectClick as handleProjectClickUtil,
  handleContextMenu 
} from '../lib/dashboardTools';

const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [currentTool, setCurrentTool] = useState(null);
  const [projects, setProjects] = useState([]);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
            
            // Fetch nested chats for each agent
            Object.values(agents).flat().forEach(agent => {
              fetchNestedChats(agent.id, user, setNestedChats, db);
            });

            // Fetch projects
            const projectsRef = collection(db, 'projectNames');
            const projectsQuery = query(projectsRef, where('userId', '==', user.uid));
            const projectsSnapshot = await getDocs(projectsQuery);
            const projectsData = projectsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
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
    if (!agent?.id || !user?.uid) {
      console.error('Missing required agent or user data');
      return;
    }

    // Special handling for Shawn
    if (agent.id === 'shawn') {
      try {
        const conversationsRef = collection(db, 'conversations');
        const q = query(
          conversationsRef,
          where('agentId', '==', 'shawn'),
          where('participants', 'array-contains', user.uid),
          where('isDefault', '==', true)
        );
        const querySnapshot = await getDocs(q);

        let chatId;
        let isNewUser = false;

        if (querySnapshot.empty) {
          // Create new conversation with Shawn
          const namesRef = collection(db, 'conversationNames');
          const nameDoc = await addDoc(namesRef, {
            agentId: 'shawn',
            conversationName: 'Chat with Shawn',
            userId: user.uid,
            isDefault: true,
            projectName: '',
            timestamp: serverTimestamp()
          });

          // Create initial welcome message
          const welcomeMessage = {
            agentId: 'shawn',
            content: "Hi! I'm Shawn, your personal guide to Business Wise365. I'll help you navigate our platform and connect you with the right experts for your business needs. Are you ready to get started?",
            conversationName: nameDoc.id,
            from: 'shawn',
            isDefault: true,
            timestamp: serverTimestamp(),
            type: 'agent'
          };

          const messagesRef = collection(db, 'conversations');
          await addDoc(messagesRef, welcomeMessage);

          chatId = nameDoc.id;
          isNewUser = true;
        } else {
          chatId = querySnapshot.docs[0].id;
        }

        setCurrentChat({
          id: chatId,
          agentId: 'shawn',
          title: 'Chat with Shawn',
          participants: [user.uid, 'shawn'],
          isDefault: true,
          conversationName: chatId,
          isNewUser: isNewUser
        });

        return;
      } catch (error) {
        console.error('Error initializing Shawn chat:', error);
        return;
      }
    }

    // Regular agent handling using utility
    try {
      await handleAgentClickUtil(agent, user, db, setCurrentChat);
    } catch (error) {
      console.error('Error handling agent click:', error);
    }
  };

  // Handle subchat clicking
  const handleSubChatClick = (agentId, subChat) => {
    setCurrentChat({
      id: subChat.id,
      agentId: agentId,
      title: subChat.conversationName || 'Untitled Chat',
      participants: subChat.participants || [user.uid],
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



  // main return & UI

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className="bg-gray-900 text-white flex flex-col"
        style={{ width: `${sidebarWidth}px`, minWidth: '200px', maxWidth: '400px' }}
      >
        {/* Logo and Home */}
        <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="text-white hover:text-white"
            onClick={() => {
              setCurrentChat(null);
              router.push('/dashboard');
            }}
          >
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Business Wise365</h1>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Agents Categories */}
            <div className="space-y-4">
              {/* Administrative Category (Always First) */}
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="Administrative">
                  <AccordionTrigger className="text-white hover:text-white px-3">
                    Administrative
                  </AccordionTrigger>
                  <AccordionContent>
                    {/* Shawn - Always First */}
                    {agents['Administrative']?.map(agent => {
                      if (agent.id === 'shawn') {
                        return (
                          <div 
                            key={agent.id}
                            className="px-4 py-2 mb-2 hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => handleAgentClick(agent)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white">{agent.name}</h4>
                                <p className="text-xs text-gray-400">{agent.role}</p>
                              </div>
                              <Bot className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Other Administrative Agents */}
                    {agents['Administrative']?.filter(agent => agent.id !== 'shawn').map(agent => (
                      <div key={agent.id} className="mb-2">
                        <div
                          className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer"
                          onClick={() => handleAgentClick(agent)}
                          onContextMenu={(e) => onAgentContextMenu(e, agent)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-white">{agent.name}</h4>
                              <p className="text-xs text-gray-400">{agent.role}</p>
                            </div>
                            <Bot className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        {/* Subchats */}
                        {nestedChats[agent.id]?.length > 0 && (
                          <div className="ml-4 mt-1 space-y-1">
                            {nestedChats[agent.id]
                              .filter(chat => !chat.isDefault)
                              .map(subChat => (
                                <div
                                  key={subChat.id}
                                  className="px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300"
                                  onClick={() => handleSubChatClick(agent.id, subChat)}
                                >
                                  {subChat.conversationName}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>

                {/* Other Categories */}
                {Object.entries(agents)
                  .filter(([category]) => category !== 'Administrative')
                  .map(([category, categoryAgents]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className="text-white hover:text-white px-3">
                        {category}
                      </AccordionTrigger>
                      <AccordionContent>
                        {categoryAgents.map(agent => (
                          <div key={agent.id} className="mb-2">
                            <div
                              className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer"
                              onClick={() => handleAgentClick(agent)}
                              onContextMenu={(e) => onAgentContextMenu(e, agent)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-white">{agent.name}</h4>
                                  <p className="text-xs text-gray-400">{agent.role}</p>
                                </div>
                                <Bot className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            {/* Subchats */}
                            {nestedChats[agent.id]?.length > 0 && (
                              <div className="ml-4 mt-1 space-y-1">
                                {nestedChats[agent.id]
                                  .filter(chat => !chat.isDefault)
                                  .map(subChat => (
                                    <div
                                      key={subChat.id}
                                      className="px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300"
                                      onClick={() => handleSubChatClick(agent.id, subChat)}
                                    >
                                      {subChat.conversationName}
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </div>

      {/* Projects Section */}
      <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Projects</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer group"
                    onClick={() => handleProjectClick(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{project.ProjectName}</p>
                        <p className="text-xs text-gray-400">
                          {project.participants?.agent ? `With ${project.participants.agent}` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectDetails(project);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm px-4">No projects available</p>
              )}
            </div>

            {/* Goals Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Goals</h2>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => setCurrentTool('goals')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Goal
              </Button>
            </div>

            {/* Resources Section */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Resources</h2>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-gray-800 px-4"
                onClick={() => router.push('/resources')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View Resources
              </Button>
            </div>
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-700">
                {userData?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{userData?.name}</p>
              <p className="text-xs text-gray-400">{userData?.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700 hover:bg-blue-600 transition-colors"
        onMouseDown={handleSidebarResize}
      />

      {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-slate-50">
          {currentChat ? (
            currentChat.agentId === 'shawn' ? (
              <ChatWithShawn 
                currentUser={userData} 
                isNewUser={currentChat.isNewUser}
              />
            ) : (
              <ChatInterface
                chatId={currentChat.id}
                agentId={currentChat.agentId}
                userId={user.uid}
                isDefault={currentChat.isDefault}
                title={currentChat.title}
                conversationName={currentChat.conversationName}
                projectId={currentChat.projectId}
                projectName={currentChat.projectName}
              />
            )
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
                  <BuyerPersona onComplete={() => setCurrentTool(null)} />
                )}
                {currentTool === 'success-wheel' && (
                  <SuccessWheel onComplete={() => setCurrentTool(null)} />
                )}
                {currentTool === 'positioning-factors' && (
                  <PositioningFactors onComplete={() => setCurrentTool(null)} />
                )}
              </main>
            </div>
          ) : (
            // Dashboard Welcome View
            <DashboardContent
              currentUser={userData}
              currentTool={currentTool}
              setCurrentTool={setCurrentTool}
              onToolComplete={() => setCurrentTool(null)}
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
            />
          )}
        </div>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
              {/* Welcome Card */}
              <Card className="mb-6 bg-white shadow-sm">
                <CardContent className="flex items-center gap-4 py-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Welcome to Business Wise365!</h2>
                    <p className="text-gray-500">
                      Connect with our AI team to help grow your business.
                    </p>
                  </div>
                </CardContent>
              </Card>

             {/* Main Dashboard Content */}
              <DashboardContent
                currentUser={userData}
                currentTool={currentTool}
                setCurrentTool={setCurrentTool}
                onToolComplete={() => setCurrentTool(null)}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
              />
            </div> {/* Close the "flex-1 overflow-hidden bg-slate-50" div */}
        </div> {/* Close the main wrapping "flex h-screen bg-slate-50" div */}
    </div> {/* Ensure all outer wrapping divs are properly closed */}
);
};

export default Dashboard;     