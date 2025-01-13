// pages/dashboard.js

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/Accordion';
import { 
  Home, 
  Users, 
  Settings,
  LogOut,
  Plus,
  MessageSquare,
  Target
} from 'lucide-react';
import { agents } from '../data/agents';
import { useDashboard } from '../contexts/DashboardContext';
import DashboardContent from '../components/DashboardContent';

const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [currentTool, setCurrentTool] = useState(null);

  // Fetch user data and nested chats
  useEffect(() => {
    const fetchUserDataAndChats = async () => {
      if (user) {
        try {
          // Fetch user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
            
            // Fetch nested chats for each agent
            const chatsRef = collection(db, 'conversations');
            const chatsSnapshot = await getDocs(chatsRef);
            const chatsByAgent = {};

            chatsSnapshot.docs.forEach(doc => {
              const chatData = doc.data();
              if (chatData.agentId && !chatData.isDefault) {
                if (!chatsByAgent[chatData.agentId]) {
                  chatsByAgent[chatData.agentId] = [];
                }
                chatsByAgent[chatData.agentId].push({
                  id: doc.id,
                  ...chatData,
                });
              }
            });

            setNestedChats(chatsByAgent);
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
      fetchUserDataAndChats();
    } else if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);



  //agent and chat functions

  // Handler for starting or resuming chat with an agent
  const handleAgentClick = async (agent) => {
    if (!agent?.id || !user?.uid) {
      console.error('Missing required agent or user data');
      return;
    }
  
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('agentId', '==', agent.id),
        where('participants', 'array-contains', user.uid),
        where('isDefault', '==', true)
      );
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        const existingData = existingDoc.data();
        setCurrentChat({
          id: existingDoc.id,
          agentId: agent.id,
          title: existingData.name || `${agent.name} Conversation`,
          participants: existingData.participants || [user.uid, agent.id],
          isDefault: true,
          conversationName: existingDoc.id
        });
      } else {
        await startNewConversation(agent);
      }
      
      router.push(`/chat/${agent.id}`);
    } catch (error) {
      console.error('Error handling agent click:', error);
    }
  };

  // Start a new conversation with an agent
  const startNewConversation = async (agent) => {
    try {
      // Create the conversation document
      const conversationData = {
        agentId: agent.id,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isDefault: true,
        lastUpdatedAt: serverTimestamp(),
        messages: [],
        name: `${agent.name} Conversation`,
        participants: [user.uid, agent.id]
      };

      const conversationRef = await addDoc(collection(db, 'conversations'), conversationData);
      
      setCurrentChat({
        id: conversationRef.id,
        agentId: agent.id,
        title: `${agent.name} Conversation`,
        participants: [user.uid, agent.id],
        isDefault: true,
        conversationName: conversationRef.id
      });

      return conversationRef;
    } catch (error) {
      console.error('Error starting new conversation:', error);
      throw error;
    }
  };

  // Handle subchat click
  const handleSubChatClick = (agentId, subChat) => {
    setCurrentChat({
      id: subChat.id,
      agentId: agentId,
      title: subChat.name || 'Untitled Chat',
      participants: subChat.participants,
      isDefault: false,
      conversationName: subChat.id
    });
    router.push(`/chat/${subChat.id}`);
  };

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

  // Render agents by category with Shawn at top
  const renderAgentCategories = () => {
    if (!agents || typeof agents !== 'object') {
      console.error('Agents data not properly loaded');
      return null;
    }

    const categories = Object.keys(agents).filter(category => 
      Array.isArray(agents[category]) && agents[category].length > 0
    );
    
    // Find Shawn in Administrative category
    const shawn = agents['Administrative']?.find(agent => agent.id === 'shawn');
    
    return (
      <>
        {/* Shawn section at the top */}
        {shawn && (
          <div className="mb-4 px-4 py-2 bg-gray-800 rounded">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleAgentClick(shawn)}
            >
              <div>
                <h4 className="font-medium text-white">{shawn.name}</h4>
                <p className="text-xs text-gray-400">{shawn.role}</p>
              </div>
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

        {/* Rest of the categories */}
        {categories.map(category => (
          <AccordionItem key={category} value={category}>
            <AccordionTrigger className="text-white hover:text-white">
              {category}
            </AccordionTrigger>
            <AccordionContent>
              {agents[category]
                ?.filter(agent => agent && agent.id !== 'shawn')
                .map(agent => (
                  <div key={agent.id} className="space-y-2">
                    <div
                      className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer"
                      onClick={() => handleAgentClick(agent)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{agent.name}</h4>
                          <p className="text-xs text-gray-400">{agent.role}</p>
                        </div>
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    {/* Sub-chats for this agent */}
                    {nestedChats[agent.id]?.length > 0 && (
                      <div className="ml-4 space-y-1">
                        {nestedChats[agent.id].map(subChat => (
                          <div
                            key={subChat.id}
                            className="px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300"
                            onClick={() => handleSubChatClick(agent.id, subChat)}
                          >
                            {subChat.name || 'Untitled Chat'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </>
    );
  };


  // render and layout

  if (loading || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="flex h-screen bg-gray-100">
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
          <div className="p-4 space-y-4">
            {/* Agents Section */}
            <Accordion type="multiple" className="w-full">
              {renderAgentCategories()}
            </Accordion>
          </div>
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                {userData?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{userData?.name}</p>
              <p className="text-xs text-gray-400">{userData?.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-gray-800"
            onClick={async () => {
              try {
                await auth.signOut();
                router.replace('/');
              } catch (error) {
                console.error('Error signing out:', error);
              }
            }}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={handleSidebarResize}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentChat ? (
          // If we have a current chat, show the ChatInterface
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={user.uid}
            isDefault={currentChat.isDefault}
            title={currentChat.title}
            conversationName={currentChat.conversationName}
          />
        ) : (
          // Otherwise show the dashboard content
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
    </div>
  );
};

export default Dashboard;