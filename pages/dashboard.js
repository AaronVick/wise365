

// /pages/dashboard.js


// /pages/dashboard.js
import dynamic from 'next/dynamic';
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
import { Button } from '../components/ui/button'; 
import { Badge } from "../components/ui/badge";
import { ScrollArea } from '../components/ui/scroll-area';
import DashboardContent from '../components/DashboardContent'; // Dashboard content
import { useDashboard } from '../contexts/DashboardContext';
import ChatInterface from '../components/ChatInterface'; // Chat interface component
import { ChevronRight, Home, Settings } from 'lucide-react'; // Icons
import ErrorBoundary from '../components/ErrorBoundary'; // Add ErrorBoundary for robust error handling

import Accordion, {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/Accordion';
import GoalCreationModal from '../components/GoalCreationModal';
import { agents } from '../data/agents';
import SidebarContent from '../components/SidebarContent';



const DynamicComponent = dynamic(() => import('../components/DynamicComponent'), { ssr: false });


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

  // Auth Effect
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

  useEffect(() => {
    if (currentUser?.uid) {
      fetchSuggestedGoals();
      // Only analyze if there are no suggested goals
      const analyzeSuggestions = async () => {
        const snapshot = await getDocs(query(
          collection(db, 'suggestedGoals'),
          where('userId', '==', currentUser.uid),
          where('isCurrent', '==', false),
          where('isIgnored', '==', false)
        ));
        if (snapshot.empty) {
          await analyzeUserContext();
        }
      };
      analyzeSuggestions();
    }
  }, [currentUser?.uid]);

  // Load All Nested Chats Effect
useEffect(() => {
  const loadAllNestedChats = async () => {
    if (!currentUser?.uid) return;
    
    try {
      // Get all non-default chats for all agents
      const namesQuery = query(
        collection(db, 'conversationNames'),
        where('userId', '==', currentUser.uid)
      );
      
      const namesSnapshot = await getDocs(namesQuery);
      console.log('[Debug] All conversations found:', namesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      const conversationsByAgent = {};
      
      namesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const agentId = data.agentId;

        // Skip if it's a default chat
        if (data.isDefault === true) {
          console.log('[Debug] Skipping default chat:', data);
          return;
        }
        
        if (!conversationsByAgent[agentId]) {
          conversationsByAgent[agentId] = [];
        }

        conversationsByAgent[agentId].push({
          id: doc.id,
          displayName: data.conversationName,
          agentId: data.agentId,
          conversationName: doc.id,
          ...data
        });
      });

      console.log('[Debug] Conversations by agent:', conversationsByAgent);
      setNestedChats(conversationsByAgent);
    } catch (error) {
      console.error('Error loading nested chats:', error);
    }
  };

  loadAllNestedChats();
}, [currentUser?.uid]);


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
  const fetchNestedChats = async (agentId) => {
    try {
      console.log(`[Debug] Fetching nested chats for agent: ${agentId}`);
  
      // Query for non-default chats under the given agentId
      const namesQuery = query(
        collection(db, 'conversationNames'),
        where('agentId', '==', agentId),
        where('userId', '==', currentUser.uid),
        where('isDefault', '==', false) // Ensure we fetch only non-default chats
      );
  
      const namesSnapshot = await getDocs(namesQuery);
  
      console.log(`[Debug] Fetched nested chats for agent ${agentId}:`, namesSnapshot.docs);
  
      // Map results to extract chat data
      const chats = namesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Debugging output
      console.log(`[Debug] Processed nested chats for agent ${agentId}:`, chats);
  
      // Update the state with the fetched nested chats
      setNestedChats((prev) => ({
        ...prev,
        [agentId]: chats,
      }));
    } catch (error) {
      console.error(`[Error] Failed to fetch nested chats for agent ${agentId}:`, error);
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
  
    // Fetch nested chats if not already loaded
    if (!nestedChats[agentId]) {
      fetchNestedChats(agentId);
    }
  };
  

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
        style={{ width: `${sidebarWidth}px`, resize: 'horizontal', overflow: 'hidden' }}
      >
        <SidebarContent
          currentUser={currentUser}
          setCurrentChat={setCurrentChat}
          nestedChats={nestedChats}
          projects={projects}
          goals={goals}
          isGoalModalOpen={isGoalModalOpen}
          setIsGoalModalOpen={setIsGoalModalOpen}
          resources={resources}
        />
      </div>
  
      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={handleSidebarResizeStart}
      />
  
      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface {...currentChat} userId={currentUser.uid} />
        ) : (
          <DashboardContent 
            currentUser={currentUser}
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