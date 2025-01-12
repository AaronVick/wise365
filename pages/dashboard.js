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



//review goals by the user
const analyzeUserContext = async () => {
  try {
    // Fetch agents
    const agentsSnapshot = await getDocs(collection(db, 'agents'));
    const agents = agentsSnapshot.docs.map(doc => doc.data());

    // Fetch recent conversations
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('from', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversations = conversationsSnapshot.docs.map(doc => doc.data());

    // Fetch current goals
    const currentGoalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['not_started', 'in_progress'])
    );
    const currentGoalsSnapshot = await getDocs(currentGoalsQuery);
    const currentGoals = currentGoalsSnapshot.docs.map(doc => doc.data());

    // Get suggestions from LLM
    const response = await fetch('/api/analyze-user-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.uid,
        conversations,
        agents,
        currentGoals
      }),
    });

    if (response.ok) {
      const suggestions = await response.json();
      // Save suggestions to Firebase
      for (const suggestion of suggestions) {
        await addDoc(collection(db, 'suggestedGoals'), {
          ...suggestion,
          userId: currentUser.uid,
          isCurrent: false,
          isIgnored: false,
          teamId: currentUser.teamId || '',
          createdAt: serverTimestamp()
        });
      }
      await fetchSuggestedGoals();
    }
  } catch (error) {
    console.error('Error analyzing user context:', error);
  }
};


const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);





  // Handler Functions
  // Consolidated Fetch Nested Chats Function
const fetchNestedChats = async (agentId) => {
  try {
    console.log(`[Debug] Fetching nested chats for agent: ${agentId}`);

    // Query for nested chats for the given agentId
    const nestedChatsQuery = query(
      collection(db, 'conversationNames'), // Adjust collection as needed
      where('agentId', '==', agentId),
      where('userId', '==', currentUser?.uid || ''), // Ensure currentUser.uid is handled safely
      where('isDefault', '==', false) // Fetch only non-default chats
    );

    const snapshot = await getDocs(nestedChatsQuery);

    console.log(`[Debug] Fetched nested chats for agent ${agentId}:`, snapshot.docs);

    // Map results to extract chat data
    const chats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`[Debug] Processed nested chats for agent ${agentId}:`, chats);

    // Update the state with the fetched nested chats
    setNestedChats((prev) => ({
      ...prev,
      [agentId]: chats.length > 0 ? chats : [], // Ensure it's at least an empty array
    }));
  } catch (error) {
    console.error(`[Error] Failed to fetch nested chats for agent ${agentId}:`, error);

    // Set an empty array for the agentId on error
    setNestedChats((prev) => ({
      ...prev,
      [agentId]: [],
    }));
  }
};



  const renderNestedChats = (agentId) => {
    const chats = nestedChats[agentId] || []; // Get nested chats for the agent
    console.log(`Rendering nested chats for agent ${agentId}:`, chats);
  
    if (chats.length === 0) {
      return <div className="ml-4 text-xs text-gray-400">No sub-chats found.</div>;
    }
  
    return (
      <div className="ml-4 space-y-1">
        {chats.map((chat) => (
          <Button
            key={chat.id}
            variant="ghost"
            className="text-left text-xs w-full truncate py-1 h-auto"
            onClick={() => {
              setCurrentChat({
                id: chat.id,
                title: chat.conversationName,
                agentId: chat.agentId,
                participants: [currentUser.uid],
                isDefault: false,
                conversationName: chat.id,
              });
            }}
          >
            {chat.conversationName}
          </Button>
        ))}
      </div>
    );
  };
  


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

const fetchSuggestedGoals = async () => {
  try {
    const suggestedGoalsQuery = query(
      collection(db, 'suggestedGoals'),
      where('userId', '==', currentUser.uid),
      where('isCurrent', '==', false),
      where('isIgnored', '==', false)
    );
    const snapshot = await getDocs(suggestedGoalsQuery);
    setSuggestedGoals(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  } catch (error) {
    console.error('Error fetching suggested goals:', error);
  }
};


useEffect(() => {
  const fetchGoals = async () => {
    try {
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', currentUser?.uid) // Filter by current user's ID
      );
      const snapshot = await getDocs(goalsQuery);
      setGoals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching goals:', error);
      setGoals([]);
    }
  };

  if (currentUser?.uid) {
    fetchGoals();
  }
}, [currentUser?.uid]);





  const handleProjectClick = async (project) => {
    try {
      // Step 1: Get or create the conversationName for this project
      const namesRef = collection(db, 'conversationNames');
      const projectChatQuery = query(
        namesRef,
        where('projectId', '==', project.id),
        where('userId', '==', currentUser.uid),
        where('isDefault', '==', true)
      );

      let conversationNameId;
      const namesSnapshot = await getDocs(projectChatQuery);

      if (namesSnapshot.empty) {
        // Create new conversation name for project
        const nameDoc = await addDoc(namesRef, {
          projectId: project.id,
          conversationName: 'Project Chat',
          userId: currentUser.uid,
          isDefault: true,
        });
        conversationNameId = nameDoc.id;
      } else {
        conversationNameId = namesSnapshot.docs[0].id;
      }

      const newChat = {
        id: conversationNameId,
        title: "Project Chat",
        projectId: project.id,
        projectName: project.ProjectName,
        participants: project.participants || {},
        isDefault: true,
        conversationName: conversationNameId
      };

      console.log('Setting project chat:', newChat);
      setCurrentChat(newChat);
    } catch (error) {
      console.error('Error in handleProjectClick:', error);
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

  

  const handleContextMenu = async (e, agent) => {
    e.preventDefault();
    const name = prompt('Enter a name for the new chat:');
    if (name) {
      try {
        const conversationNameRef = await addDoc(collection(db, 'conversationNames'), {
          agentId: agent.id,
          conversationName: name,
          projectName: "",
          userId: currentUser.uid
        });
  
        const docRef = await addDoc(collection(db, 'conversations'), {
          agentId: agent.id,
          conversationName: conversationNameRef.id,
          from: currentUser.uid,
          timestamp: serverTimestamp(),
          isDefault: false,
          type: 'parent'
        });
  
        const newChat = {
          id: docRef.id,
          title: name,
          agentId: agent.id,
          participants: [currentUser.uid],
          isDefault: false,
          conversationName: conversationNameRef.id
        };
        
        console.log('Setting new named chat:', newChat);
        setCurrentChat(newChat);
        
        await fetchNestedChats(agent.id);
      } catch (error) {
        console.error('Error creating named chat:', error);
      }
    }
  };

  
  const handleAgentClick = async (agent) => {
    try {
        console.log('Starting handleAgentClick for:', agent.name);
        
        // Clear current chat immediately
        setCurrentChat(null);

        // 1. Get or create default conversation name
        const namesRef = collection(db, 'conversationNames');
        const defaultNameQuery = query(
            namesRef,
            where('agentId', '==', agent.id),
            where('userId', '==', currentUser.uid),
            where('isDefault', '==', true)
        );

        const namesSnapshot = await getDocs(defaultNameQuery);
        let conversationNameId;
        let isNewConversation = false;

        // Create or get the default conversation name
        if (namesSnapshot.empty) {
            console.log('Creating new default conversation');
            isNewConversation = true;
            const defaultName = `Chat with ${agent.name}`;
            const nameDoc = await addDoc(namesRef, {
                agentId: agent.id,
                conversationName: defaultName,
                userId: currentUser.uid,
                isDefault: true,
                projectName: '',
                timestamp: serverTimestamp()
            });
            conversationNameId = nameDoc.id;
        } else {
            conversationNameId = namesSnapshot.docs[0].id;
        }

        // 2. Get or create default conversation message
        if (isNewConversation) {
            console.log('Creating initial message');
            const messagesRef = collection(db, 'conversations');
            await addDoc(messagesRef, {
                agentId: agent.id,
                content: `Started conversation with ${agent.name}`,
                conversationName: conversationNameId,
                from: userId,
                isDefault: true,
                timestamp: serverTimestamp(),
                type: 'system'
            });
        }

        // 3. Set the current chat state
        const newChat = {
            id: conversationNameId,  // Using the conversationName ID
            title: `Chat with ${agent.name}`,
            agentId: agent.id,
            participants: [currentUser.uid],
            isDefault: true,
            conversationName: conversationNameId
        };

        console.log('Setting currentChat:', newChat);
        setCurrentChat(newChat);

        // 4. Refresh nested chats (which should exclude the default chat)
        await fetchNestedChats(agent.id);
        
    } catch (error) {
        console.error('Error in handleAgentClick:', error);
        console.error(error);  // Log the full error
    }
};

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
