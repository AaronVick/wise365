import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { auth, db } from '../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';

// UI Components
import { Button } from '../components/ui/button';
import { Badge } from "../components/ui/badge";
import { ScrollArea } from '../components/ui/scroll-area';
import Accordion, {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/Accordion';
import DashboardContent from '../components/DashboardContent';
import SidebarContent from '../components/SidebarContent';
import ChatInterface from '../components/ChatInterface';
import ErrorBoundary from '../components/ErrorBoundary';

// Contexts and Data
import { useDashboard } from '../contexts/DashboardContext';
import { agents } from '../data/agents';
import {
  fetchNestedChats,
  renderNestedChats,
  analyzeUserContext,
  fetchSuggestedGoals,
  fetchGoals,
  handleAgentClick,
  handleProjectClick,
  handleContextMenu
} from '../lib/dashboardTools';

// Dynamic Imports
const DynamicGoalCreationModal = dynamic(() => import('../components/GoalCreationModal'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const DynamicMilestonesSection = dynamic(() => import('../components/MilestonesSection'), {
  ssr: false
});

const Dashboard = () => {
  // State declarations
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [projects, setProjects] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [currentGoals, setCurrentGoals] = useState([]);
  const [currentTool, setCurrentTool] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goals, setGoals] = useState([]);

  const {
    resources = []
  } = useDashboard() || {};

  // Main authentication listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthChecked(true);
      if (user) {
        setCurrentUser(user);
        try {
          await initializeUserData(user.uid);
        } catch (error) {
          console.error('Error initializing user data:', error);
          setError('Failed to initialize user data');
        }
      } else {
        router.replace('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Initialize user data
  const initializeUserData = async (userId) => {
    try {
      // Set up listeners for real-time updates
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId)
      );
      
      // Real-time goals listener
      const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
        const goalsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGoals(goalsData);
      });

      // Fetch initial projects
      const projectsQuery = query(
        collection(db, 'projectNames'),
        where('userId', '==', userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);

      // Clean up listeners on component unmount
      return () => {
        unsubscribeGoals();
      };
    } catch (error) {
      console.error('Error initializing user data:', error);
      throw error; // Propagate error to be handled by the caller
    }
  };

  // Fetch goals when user changes
  useEffect(() => {
    if (currentUser?.uid) {
      fetchGoals(currentUser.uid)
        .then((goals) => setGoals(goals))
        .catch((error) => console.error('Error fetching goals:', error));
    }
  }, [currentUser?.uid]);

  // Early return conditions
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentUser && authChecked) {
    router.replace('/login');
    return null;
  }


  // event handlers and utility functions

  // Handle accepting a suggested goal
  const handleAcceptSuggestion = async (suggestion) => {
    try {
      const conversationNameRef = await addDoc(collection(db, 'conversationNames'), {
        agentId: suggestion.agentAssigned,
        conversationName: suggestion.goalDescription,
        projectName: "",
        userId: currentUser.uid,
        isDefault: false
      });

      await updateDoc(doc(db, 'suggestedGoals', suggestion.id), {
        isCurrent: true
      });

      await addDoc(collection(db, 'goals'), {
        agentId: suggestion.agentAssigned,
        autoCreated: true,
        description: suggestion.goalDescription,
        status: 'not_started',
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        teamId: currentUser.teamId || '',
        title: suggestion.goalDescription,
        type: 'suggested_goal',
        sourceConversationId: conversationNameRef.id
      });

      setCurrentChat({
        id: conversationNameRef.id,
        title: suggestion.goalDescription,
        agentId: suggestion.agentAssigned,
        participants: [currentUser.uid],
        isDefault: false,
        conversationName: conversationNameRef.id
      });

      fetchSuggestedGoals();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
    }
  };

  // Handle ignoring a suggested goal
  const handleIgnoreSuggestion = async (suggestion) => {
    try {
      await updateDoc(doc(db, 'suggestedGoals', suggestion.id), {
        isIgnored: true
      });
      fetchSuggestedGoals();
    } catch (error) {
      console.error('Error ignoring suggestion:', error);
    }
  };

  // Handle project context menu (right-click)
  const handleProjectContextMenu = async (e) => {
    e.preventDefault();
    const name = prompt('Enter a name for the new project:');
    if (name) {
      try {
        const projectDoc = await addDoc(collection(db, 'projectNames'), {
          ProjectName: name,
          userId: currentUser.uid,
          teamId: "",
          participants: {
            userId: currentUser.uid
          }
        });

        const newProject = {
          id: projectDoc.id,
          ProjectName: name,
          userId: currentUser.uid,
          teamId: "",
          participants: {
            userId: currentUser.uid
          }
        };

        setProjects(prev => [...prev, newProject]);
      } catch (error) {
        console.error('Error creating project:', error);
      }
    }
  };

  // Toggle project expanded state
  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Toggle agent expanded state
  const toggleAgentExpanded = (agentId) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));
  };

  // Handle sidebar resize
  const handleSidebarResizeStart = (e) => {
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


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className="bg-gray-900 text-white flex flex-col"
        style={{
          width: `${sidebarWidth}px`,
          resize: 'horizontal',
          overflow: 'hidden',
          minWidth: '200px',
        }}
      >
        <SidebarContent
          currentUser={currentUser || {}}
          setCurrentChat={setCurrentChat}
          nestedChats={nestedChats || {}}
          projects={projects || []}
          goals={goals || []}
          isGoalModalOpen={isGoalModalOpen}
          setIsGoalModalOpen={setIsGoalModalOpen}
          resources={resources || []}
          GoalCreationModal={DynamicGoalCreationModal}
          sidebarWidth={sidebarWidth}
          agents={agents || {}}
        />
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={handleSidebarResizeStart}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize Sidebar"
      />

       {/* Main Content */}
      <div className="flex-1">
        {currentChat?.id ? (  // Change this line to check for currentChat.id
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={currentUser?.uid || ''}
            isDefault={currentChat.isDefault || false}
            title={currentChat.title || ''}
            conversationName={currentChat.conversationName}
            projectId={currentChat.projectId}
            projectName={currentChat.projectName}
          />
        ) : (
          <DashboardContent
            currentUser={currentUser || {}}
            currentTool={currentTool}
            onToolComplete={() => setCurrentTool(null)}
            setCurrentTool={setCurrentTool}
            currentChat={currentChat}          
            setCurrentChat={setCurrentChat} 
          />
        )}
      </div>
    </div> 
  );  
};  

export default Dashboard;