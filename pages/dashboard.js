// pages/dashboard.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
import GoalCreationModal from '@/components/GoalCreationModal';
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
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goals, setGoals] = useState([]);

  // Data fetching
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            
            // Fetch nested chats for each agent
            const conversationNamesRef = collection(db, 'conversationNames');
            Object.values(agents).flat().forEach(async (agent) => {
              const q = query(
                conversationNamesRef,
                where('agentId', '==', agent.id),
                where('userId', '==', user.uid)
              );
              
              try {
                const querySnapshot = await getDocs(q);
                const chats = querySnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }));
                
                setNestedChats(prev => ({
                  ...prev,
                  [agent.id]: chats
                }));
              } catch (error) {
                console.error(`Error fetching chats for agent ${agent.id}:`, error);
              }
            });
  
            // Rest of your existing code...
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    };
  
    if (!loading && user) {
      fetchData();
    }
  }, [user, loading]);
  

  // fetch goals
  useEffect(() => {
    if (!loading && user) {
      fetchGoals();
    }
  }, [user, loading]);

  const fetchGoals = async () => {
    if (!user?.uid) return;
    
    try {
      const goalsRef = collection(db, 'goals');
      const q = query(goalsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const goalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };
  
  const handleGoalSubmit = async (formData) => {
    try {
      await addDoc(collection(db, 'goals'), {
        ...formData,
        userId: user.uid,
        status: 'not_started',
        createdAt: serverTimestamp()
      });
      await fetchGoals(); // Refresh goals
      setIsGoalModalOpen(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };
  
  const handleGoalStatusUpdate = async (goalId, newStatus) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await updateDoc(goalRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      await fetchGoals(); // Refresh goals
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };
  
  const handleGoalEdit = async (goalId) => {
    // Implement goal editing logic
    console.log('Edit goal:', goalId);
  };
  
  const handleGoalDelete = async (goalId) => {
    try {
      const goalRef = doc(db, 'goals', goalId);
      await deleteDoc(goalRef);
      await fetchGoals(); // Refresh goals
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };



  

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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  onClick={() => setIsGoalModalOpen(true)}  // Using the shared state
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            <div
              className="space-y-1"
              onContextMenu={(e) => {
                e.preventDefault();
                setIsGoalModalOpen(true);
              }}
            >
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{goal.title}</p>
                      <p className="text-xs text-gray-400">{goal.status}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleGoalStatusUpdate(goal.id, 'completed')}>
                          Mark Complete
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGoalEdit(goal.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleGoalDelete(goal.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
              <div className="flex-1 overflow-y-auto">
                {currentTool === 'buyer-persona' && (
                  <BuyerPersona onComplete={() => setCurrentTool(null)} />
                )}
                {currentTool === 'success-wheel' && (
                  <SuccessWheel onComplete={() => setCurrentTool(null)} />
                )}
                {currentTool === 'positioning-factors' && (
                  <PositioningFactors onComplete={() => setCurrentTool(null)} />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="bg-white border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Dashboard</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                  <DashboardContent
                    currentUser={userData}
                    currentTool={currentTool}
                    setCurrentTool={setCurrentTool}
                    onToolComplete={() => setCurrentTool(null)}
                    currentChat={currentChat}
                    setCurrentChat={setCurrentChat}
                    isGoalModalOpen={isGoalModalOpen}           
                    setIsGoalModalOpen={setIsGoalModalOpen}     
                  />
                </div>
              </div>
            </div>
          )}

          <GoalCreationModal
            isOpen={isGoalModalOpen}
            onClose={() => setIsGoalModalOpen(false)}
            onSubmit={handleGoalSubmit}
            agents={Object.values(agents).flat()}
          />
        </div>
      </div>
    );
  };

  export default Dashboard;