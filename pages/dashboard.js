// /pages/dashboard.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
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


const DynamicComponent = dynamic(() => import('../components/ComponentName'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

// Dynamic Components
const DynamicGoalCreationModal = dynamic(() => import('../components/GoalCreationModal'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

const DynamicMilestonesSection = dynamic(() => import('../components/MilestonesSection'), {
  ssr: false
});

// Initial States and Hooks
const Dashboard = () => {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [nestedChats, setNestedChats] = useState({});
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [expandedAgents, setExpandedAgents] = useState({});
  const [projects, setProjects] = useState([]);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [suggestedGoals, setSuggestedGoals] = useState([]);
  const [currentGoals, setCurrentGoals] = useState([]);
  const [currentTool, setCurrentTool] = useState(null);

  const {
    goals = [],
    resources = [],
    isLoading = false
  } = useDashboard() || {};





const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);


 
useEffect(() => {
  if (currentUser?.uid) {
    fetchGoals(currentUser.uid)
      .then((goals) => setGoals(goals))
      .catch((error) => console.error('Error fetching goals:', error));
  }
}, [currentUser?.uid]);


fetchNestedChats(agentId, currentUser?.uid)
  .then((chats) => setNestedChats((prev) => ({
    ...prev,
    [agentId]: chats,
  })))
  .catch((error) => {
    console.error(`[Error] Failed to fetch nested chats for agent ${agentId}:`, error);
    setNestedChats((prev) => ({
      ...prev,
      [agentId]: [],
    }));
  });



  analyzeUserContext(currentUser)
  .then(() => fetchSuggestedGoals(currentUser.uid))
  .catch((error) => console.error('Error analyzing user context:', error));




// goal handler
const handleAcceptSuggestion = async (suggestion) => {
  try {
    // Create a new subchat for this goal
    const conversationNameRef = await addDoc(collection(db, 'conversationNames'), {
      agentId: suggestion.agentAssigned,
      conversationName: suggestion.goalDescription,
      projectName: "",
      userId: currentUser.uid,
      isDefault: false
    });

    // Update the suggestion status
    await updateDoc(doc(db, 'suggestedGoals', suggestion.id), {
      isCurrent: true
    });

    // Create goal in goals collection
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

    // Set current chat to the new conversation
    setCurrentChat({
      id: conversationNameRef.id,
      title: suggestion.goalDescription,
      agentId: suggestion.agentAssigned,
      participants: [currentUser.uid],
      isDefault: false,
      conversationName: conversationNameRef.id
    });

    // Refresh goals
    fetchSuggestedGoals();
  } catch (error) {
    console.error('Error accepting suggestion:', error);
  }
};

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

  const toggleProjectExpanded = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const toggleAgentExpanded = (agentId) => {
    setExpandedAgents((prev) => ({
      ...prev,
      [agentId]: !prev[agentId],
    }));

  

  

<Button
  onClick={() => handleAgentClick(agent, currentUser, db, setCurrentChat)}
>
  Chat with Agent
</Button>;

<Button
  onClick={() => handleProjectClick(project, currentUser, db, setCurrentChat)}
>
  Open Project Chat
</Button>;

<div
  onContextMenu={(e) => handleContextMenu(e, agent, currentUser, db, setCurrentChat, fetchNestedChats)}
>
  Right-click to create chat
</div>



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
        className="bg-gray-900 text-white flex flex-col"
        style={{
          width: `${sidebarWidth}px`,
          resize: 'horizontal',
          overflow: 'hidden',
          minWidth: '200px', // Prevent sidebar from collapsing too much
        }}
      >
        <SidebarContent
          currentUser={currentUser || {}} // Ensure fallback if currentUser is null
          setCurrentChat={setCurrentChat}
          nestedChats={nestedChats || {}} // Ensure nestedChats is always defined
          projects={projects || []} // Ensure projects is always an array
          goals={goals || []} // Ensure goals is always an array
          isGoalModalOpen={isGoalModalOpen}
          setIsGoalModalOpen={setIsGoalModalOpen}
          resources={resources || []} // Ensure resources is always an array
          GoalCreationModal={DynamicGoalCreationModal}
          sidebarWidth={sidebarWidth}
          agents={agents || {}} // Ensure agents is always defined
        />
      </div>
  
      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={handleSidebarResizeStart}
        role="separator" // Added for accessibility
        aria-orientation="horizontal"
        aria-label="Resize Sidebar"
      />
  
      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface
            {...currentChat}
            userId={currentUser?.uid || ''} // Ensure userId is safely handled
          />
        ) : (
          <DashboardContent
            currentUser={currentUser || {}} // Ensure currentUser is safely passed
            currentTool={currentTool}
            onToolComplete={() => setCurrentTool(null)}
            setCurrentTool={setCurrentTool}
          />
        )}
      </div>
    </div>
  );
  

} 

export default Dashboard;
