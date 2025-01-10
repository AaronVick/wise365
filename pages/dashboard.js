

// /pages/dashboard.js
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
import ChatInterface from '../components/ChatInterface'; // Chat interface component
import { ChevronRight, Home, Settings } from 'lucide-react'; // Icons
import ErrorBoundary from '../components/ErrorBoundary'; // Add ErrorBoundary for robust error handling
import dynamic from 'next/dynamic';



// Agents data
const agents = [
  { id: 'mike', name: 'Mike', role: 'Trusted Marketing Strategist', category: 'Marketing' },
  { id: 'shawn', name: 'Shawn', role: 'Tool Guidance Assistant', category: 'Administrative' },
  { id: 'alex', name: 'Alex', role: 'Persona Pilot Pro', category: 'Sales' },
  { id: 'sylvester', name: 'Sylvester', role: 'Marketing Success Wheel Optimizer', category: 'Marketing' },
  { id: 'ally', name: 'Ally', role: 'Positioning Factors Accelerator', category: 'Marketing' },
  { id: 'aaron', name: 'Aaron', role: 'T.I.N.B. Builder', category: 'Sales' },
  { id: 'deborah', name: "De'Borah", role: 'Facebook Marketing Maestro', category: 'Social Media' },
  { id: 'claire', name: 'Claire', role: 'LinkedIn Messaging Maestro', category: 'Social Media' },
  { id: 'ej', name: 'EJ', role: 'TikTok Marketing Maestro', category: 'Social Media' },
  { id: 'lisa', name: 'Lisa', role: 'Instagram Marketing Maestro', category: 'Social Media' },
  { id: 'troy', name: 'Troy', role: 'CrossSell Catalyst', category: 'Sales' },
  { id: 'rom', name: 'Rom', role: 'PitchPerfect AI', category: 'Administrative' },
  { id: 'larry', name: 'Larry', role: 'Market Edge AI', category: 'Administrative' },
  { id: 'jen', name: 'Jen', role: 'CloseMaster AI', category: 'Administrative' },
  { id: 'daniela', name: 'Daniela', role: 'Reputation Builder AI', category: 'Administrative' },
  { id: 'antonio', name: 'Antonio', role: 'Video Story Architect', category: 'Copy Editing' },
  { id: 'mason', name: 'Mason', role: 'StoryAlign AI', category: 'Copy Editing' },
  { id: 'gabriel', name: 'Gabriel', role: 'Blog Blueprint', category: 'Copy Editing' },
  { id: 'orion', name: 'Orion', role: 'PersonaLead Magnet Maker', category: 'Marketing' },
  { id: 'sadie', name: 'Sadie', role: 'Ad Copy Maestro', category: 'Copy Editing' },
  { id: 'jesse', name: 'Jesse', role: 'Email Marketing Maestro', category: 'Marketing' },
  { id: 'caner', name: 'Caner', role: 'InsightPulse AI', category: 'Administrative' },
  { id: 'jr', name: 'JR', role: 'Audience Gap Genius', category: 'Sales' },
];


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
        const namesQuery = query(
          collection(db, 'conversationNames'),
          where('userId', '==', currentUser.uid)
        );
        const namesSnapshot = await getDocs(namesQuery);
        const conversationsByAgent = {};
        
        namesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (!conversationsByAgent[data.agentId]) {
            conversationsByAgent[data.agentId] = [];
          }
          conversationsByAgent[data.agentId].push({
            id: doc.id,
            displayName: data.conversationName,
            ...data
          });
        });
  
        setNestedChats(conversationsByAgent);
      } catch (error) {
        console.error('Error loading nested chats:', error);
      }
    };
  
    loadAllNestedChats();
  }, [currentUser?.uid]);




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







  // Handler Functions
  const fetchNestedChats = async (agentId) => {
    try {
      console.log('Fetching nested chats for agent:', agentId);
      
      // Get ONLY non-default chats from conversationNames
      const namesQuery = query(
        collection(db, 'conversationNames'),
        where('agentId', '==', agent.id),
        where('userId', '==', currentUser.uid),
        where('isDefault', '==', false) // Changed from '!=' to '==' false to be explicit
      );
      
      const namesSnapshot = await getDocs(namesQuery);
      const chats = namesSnapshot.docs.map(doc => ({
        id: doc.id,
        displayName: doc.data().conversationName,
        agentId: doc.data().agentId,
        conversationName: doc.id,
        ...doc.data()
      })).filter(chat => !chat.isDefault); // Double check to filter out any default chats
      
      console.log('Found nested chats:', chats);

      setNestedChats((prev) => ({
        ...prev,
        [agentId]: chats
      }));
    } catch (error) {
      console.error('Error fetching nested chats:', error);
    }
};



const renderNestedChats = (agentId) => {
  const chats = nestedChats[agentId] || [];
  console.log('Rendering nested chats for agent:', agentId, chats);

  // Explicitly filter out any default chats
  const nonDefaultChats = chats.filter(chat => chat.isDefault === false);
  
  console.log('Non-default chats:', nonDefaultChats);
  
  return (
    <div className="ml-4 space-y-1">
      {nonDefaultChats.map((chat) => {
        console.log('Rendering chat:', chat);
        return (
          <Button
            key={chat.id}
            variant="ghost"
            className="text-left text-xs w-full truncate py-1 h-auto"
            onClick={() => {
              console.log('Clicking subchat:', chat);
              setCurrentChat({
                id: chat.id,
                title: chat.displayName,
                agentId: chat.agentId,
                participants: [currentUser.uid],
                isDefault: false,
                conversationName: chat.conversationName
              });
            }}
          >
            {chat.displayName}
          </Button>
        );
      })}
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
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
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
        {/* Home and Title Bar */}
        <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setCurrentChat(null)}>
            <Home className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Dashboard</h1>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          {/* Agents Section */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-sm font-semibold mb-2">AGENTS</h2>
            <div className="space-y-1">
           {agents.map((agent) => (
  <div key={agent.id} className="mb-1">
    <div
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700 rounded"
      onContextMenu={(e) => handleContextMenu(e, agent)}
    >
      <div className="flex items-center space-x-2">
        <ChevronRight 
          className={`h-4 w-4 transform transition-transform ${expandedAgents[agent.id] ? 'rotate-90' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleAgentExpanded(agent.id);
          }}
        />
        <span 
          onClick={(e) => {
            e.stopPropagation();
            handleAgentClick(agent);
          }}
        >
          {agent.name}
        </span>
      </div>
      <span className="text-xs text-gray-400">{agent.role}</span>
    </div>
    {expandedAgents[agent.id] && nestedChats[agent.id] && renderNestedChats(agent.id)}
  </div>
))}
            </div>
          </div>


          {/* Goals Sections */}
<div className="p-4 border-b border-gray-700">
  <div className="mb-4">
    <h2 className="text-sm font-semibold">CURRENT GOALS</h2>
    <div className="space-y-1 mt-2">
      {currentGoals.map((goal) => (
        <div key={goal.id} className="p-2 bg-gray-800 rounded">
          <div className="text-sm">{goal.description}</div>
          <div className="text-xs text-gray-400 mt-1">
            Assigned to: {agents.find(a => a.id === goal.agentId)?.name || goal.agentId}
          </div>
        </div>
      ))}
    </div>
  </div>

  <div className="mt-4">
    <h2 className="text-sm font-semibold">SUGGESTED GOALS</h2>
    <div className="space-y-1 mt-2">
      {suggestedGoals.map((suggestion) => (
        <div key={suggestion.id} className="p-2 bg-gray-800 rounded">
          <div className="text-sm">{suggestion.goalDescription}</div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">
              {agents.find(a => a.id === suggestion.agentAssigned)?.name || suggestion.agentAssigned}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAcceptSuggestion(suggestion)}
                className="px-2 py-1 hover:bg-green-700"
              >
                Accept
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleIgnoreSuggestion(suggestion)}
                className="px-2 py-1 hover:bg-red-700"
              >
                Ignore
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>




          {/* Projects Section */}
          <div className="p-4">
            <div 
              className="flex items-center justify-between mb-2"
              onContextMenu={handleProjectContextMenu}
            >
              <h2 className="text-sm font-semibold">PROJECTS</h2>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <div key={project.id} className="mb-1">
                  <div
                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-700 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <ChevronRight 
                        className={`h-4 w-4 transform transition-transform ${expandedProjects[project.id] ? 'rotate-90' : ''}`}
                        onClick={() => toggleProjectExpanded(project.id)}
                      />
                      <span 
                        className="text-sm cursor-pointer"
                        onClick={() => handleProjectClick(project)}
                      >
                        {project.ProjectName}
                      </span>
                    </div>
                  </div>
                  {expandedProjects[project.id] && (
                    <div className="ml-4 space-y-1">
                      {/* Project chats would be rendered here */}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Settings Button */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="ghost" className="w-full">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={(e) => {
          e.preventDefault();
          document.addEventListener('mousemove', handleSidebarResize);
          document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleSidebarResize);
          });
        }}
      />

      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={currentUser.uid}
            isDefault={currentChat.isDefault}
            title={currentChat.title}
            conversationName={currentChat.conversationName}
            projectId={currentChat.projectId}
            projectName={currentChat.projectName}
          />
        ) : (
          <DashboardContent currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;