// components/dashboardData.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseService from '../lib/services/firebaseService';

export const useDashboardData = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [currentTool, setCurrentTool] = useState(null);
  const [projects, setProjects] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          firebaseService.setCurrentUser(user);
          const userData = await firebaseService.get('users', user.uid);
          
          if (userData) {
            setUserData(userData);
            fetchUserProjects(user);
            fetchAllNestedChats(user);
          } else {
            console.error('No user document found');
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

  // Fetch user projects
  const fetchUserProjects = async (user) => {
    try {
      const projectsData = await firebaseService.queryCollection('projectNames', {
        where: [
          { field: 'userId', operator: '==', value: user.authenticationID }
        ]
      });
      setProjects(projectsData);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Fetch all nested chats for agents
  const fetchAllNestedChats = async (user) => {
    Object.values(agents).flat().forEach(agent => {
      fetchNestedChats(agent.id, user);
    });
  };

  // Agent handlers
  const handleAgentClick = async (agent) => {
    if (!agent?.id || !userData?.authenticationID) {
      console.error('Missing required agent or user data:', { agent, userData });
      return;
    }

    try {
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

      const defaultChat = allAgentChats.find((chat) => chat.isDefault);
      const subChats = allAgentChats.filter((chat) => !chat.isDefault);

      let chatId;
      let isNewUser = false;

      if (!defaultChat) {
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

        await createInitialSystemMessage(agent, chatId);
      } else {
        chatId = defaultChat.id;
      }

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

  // Create initial system message
  const createInitialSystemMessage = async (agent, chatId) => {
    await firebaseService.create('conversations', {
      agentId: agent.id,
      content: `Started conversation with ${agent.name}`,
      conversationName: chatId,
      from: userData.authenticationID,
      isDefault: true,
      timestamp: serverTimestamp(),
      type: 'system'
    });
  };

  // Project handlers
  const handleProjectClick = async (project) => {
    try {
      setCurrentChat({
        id: project.id,
        title: project.ProjectName,
        projectId: project.id,
        projectName: project.ProjectName
      });
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

  // Context menu handler
  const handleContextMenu = (e, agent) => {
    e.preventDefault();
    // Add your context menu logic here
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    // State
    user,
    loading,
    userData,
    isLoadingUserData,
    currentChat,
    nestedChats,
    currentTool,
    projects,

    // Setters
    setCurrentChat,
    setCurrentTool,

    // Handlers
    handleAgentClick,
    handleProjectClick,
    handleProjectDetails,
    handleSubChatClick,
    handleContextMenu,
    handleSignOut,

    // Router
    router
  };
};

// You can also export any constants or utilities used by the dashboard
export const agents = {
  Administrative: [
    { id: 'shawn', name: 'Shawn', role: 'Personal Guide' },
    // Add other agents
  ],
  // Add other categories
};

export const generateWelcomeMessage = async ({ userData, context, funnelEvaluation, isNewUser }) => {
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