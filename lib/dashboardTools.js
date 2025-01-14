// lib/dashboardTools.js

import { Button } from '../components/ui/button';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/Accordion';

// Fetch nested chats
export const fetchNestedChats = async (agentId, currentUser, setNestedChats, db) => {
  if (!agentId) {
    console.error("[Error] Missing agentId for fetching nested chats.");
    return;
  }

  if (!currentUser || !currentUser.uid) {
    console.error("[Error] Invalid or missing currentUser.");
    return;
  }

  try {
    console.log(`[Debug] Fetching nested chats for agent: ${agentId}`);

    const nestedChatsQuery = query(
      collection(db, 'conversationNames'),
      where('agentId', '==', agentId),
      where('userId', '==', currentUser.uid),
      where('isDefault', '==', false)  // Only get non-default chats
    );

    const snapshot = await getDocs(nestedChatsQuery);

    const chats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })).filter(chat => !chat.isDefault); // Double check to filter out any default chats

    setNestedChats((prev) => ({
      ...prev,
      [agentId]: chats.length > 0 ? chats : [],
    }));
  } catch (error) {
    console.error(`[Error] Failed to fetch nested chats for agent ${agentId}:`, error);
    setNestedChats((prev) => ({
      ...prev,
      [agentId]: [],
    }));
  }
};

// Render nested chats
export const renderNestedChats = (agentId, nestedChats, currentUser, setCurrentChat) => {
  if (!agentId || !nestedChats || !currentUser || !setCurrentChat) {
    console.error("[Error] Missing parameters for rendering nested chats.");
    return null;
  }

  const chats = nestedChats[agentId] || [];
  const nonDefaultChats = chats.filter(chat => !chat.isDefault);

  if (nonDefaultChats.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="chats">
        <AccordionTrigger className="text-sm text-gray-400 hover:text-white py-1">
          Conversations
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1">
            {nonDefaultChats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                className="w-full justify-start text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => setCurrentChat({
                  id: chat.id,
                  title: chat.conversationName,
                  agentId: chat.agentId,
                  participants: [currentUser.uid],
                  isDefault: false,
                  conversationName: chat.id,
                })}
              >
                {chat.conversationName}
              </Button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// agent and project handling


// Agent handlers
export const handleAgentClick = async (agent, currentUser, db, setCurrentChat) => {
  if (!agent || !currentUser || !currentUser.uid || !db || !setCurrentChat) {
    console.error("[Error] Missing required parameters for handleAgentClick.");
    return;
  }

  try {
    console.log('Starting handleAgentClick for:', agent.name);

    // Clear current chat while loading
    setCurrentChat(null);

    // Find or create default conversation
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
        timestamp: serverTimestamp(),
      });
      conversationNameId = nameDoc.id;
    } else {
      conversationNameId = namesSnapshot.docs[0].id;
    }

    // Create initial message for new conversations
    if (isNewConversation) {
      console.log('Creating initial message');
      const messagesRef = collection(db, 'conversations');
      await addDoc(messagesRef, {
        agentId: agent.id,
        content: `Started conversation with ${agent.name}`,
        conversationName: conversationNameId,
        from: currentUser.uid,
        isDefault: true,
        timestamp: serverTimestamp(),
        type: 'system',
      });
    }

    const newChat = {
      id: conversationNameId,
      title: `Chat with ${agent.name}`,
      agentId: agent.id,
      participants: [currentUser.uid],
      isDefault: true,
      conversationName: conversationNameId,
    };

    console.log('Setting currentChat:', newChat);
    setCurrentChat(newChat);
    return newChat;
  } catch (error) {
    console.error('Error in handleAgentClick:', error);
    throw error;
  }
};

// Project handlers
export const handleProjectClick = async (project, currentUser, db, setCurrentChat) => {
  if (!project || !currentUser || !currentUser.uid || !db || !setCurrentChat) {
    console.error("[Error] Missing required parameters for handleProjectClick.");
    return;
  }

  try {
    console.log('Starting handleProjectClick for project:', project);

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
      console.log('No existing project chat found, creating a new one.');
      const nameDoc = await addDoc(namesRef, {
        projectId: project.id,
        conversationName: project.ProjectName || 'Project Chat',
        userId: currentUser.uid,
        isDefault: true,
        timestamp: serverTimestamp(),
      });
      conversationNameId = nameDoc.id;
    } else {
      console.log('Found existing project chat.');
      conversationNameId = namesSnapshot.docs[0].id;
    }

    const newChat = {
      id: conversationNameId,
      title: project.ProjectName || "Project Chat",
      projectId: project.id,
      projectName: project.ProjectName,
      participants: project.participants || {},
      isDefault: true,
      conversationName: conversationNameId,
    };

    console.log('Setting project chat:', newChat);
    setCurrentChat(newChat);
    return newChat;
  } catch (error) {
    console.error('Error in handleProjectClick:', error);
    throw error;
  }
};

// Context menu handler for creating new chats
export const handleContextMenu = async (e, agent, currentUser, db, setCurrentChat) => {
  if (!agent || !currentUser || !currentUser.uid || !db || !setCurrentChat) {
    console.error('[Error] Missing required parameters for handleContextMenu.');
    return;
  }

  e.preventDefault();

  const name = prompt('Enter a name for the new chat:');
  if (!name) {
    console.log('[Info] Chat creation canceled by user.');
    return;
  }

  try {
    console.log(`[Debug] Creating a new chat named "${name}" for agent: ${agent.id}`);

    // Create the conversation name entry
    const conversationNameRef = await addDoc(collection(db, 'conversationNames'), {
      agentId: agent.id,
      conversationName: name,
      projectName: '',
      userId: currentUser.uid,
      isDefault: false,
      timestamp: serverTimestamp(),
    });

    // Create the initial conversation entry
    const docRef = await addDoc(collection(db, 'conversations'), {
      agentId: agent.id,
      conversationName: conversationNameRef.id,
      from: currentUser.uid,
      timestamp: serverTimestamp(),
      isDefault: false,
      type: 'parent',
    });

    const newChat = {
      id: docRef.id,
      title: name,
      agentId: agent.id,
      participants: [currentUser.uid],
      isDefault: false,
      conversationName: conversationNameRef.id,
    };

    console.log('[Debug] Setting new named chat:', newChat);
    setCurrentChat(newChat);
    return newChat;
  } catch (error) {
    console.error('[Error] Failed to create named chat:', error);
    throw error;
  }
};





// goals and analysis functions


// Goals and Analysis Functions

// Analyze user context
export const analyzeUserContext = async (db, currentUser, fetchSuggestedGoals) => {
  if (!currentUser || !currentUser.uid || !fetchSuggestedGoals) {
    console.error("[Error] Missing required parameters for analyzeUserContext.");
    return;
  }

  try {
    const agentsSnapshot = await getDocs(collection(db, 'agents'));
    const agents = agentsSnapshot.docs.map((doc) => doc.data());

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('from', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversations = conversationsSnapshot.docs.map((doc) => doc.data());

    const currentGoalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', currentUser.uid),
      where('status', 'in', ['not_started', 'in_progress'])
    );
    const currentGoalsSnapshot = await getDocs(currentGoalsQuery);
    const currentGoals = currentGoalsSnapshot.docs.map((doc) => doc.data());

    const response = await fetch('/api/analyze-user-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.uid,
        conversations,
        agents,
        currentGoals,
      }),
    });

    if (response.ok) {
      const suggestions = await response.json();

      for (const suggestion of suggestions) {
        await addDoc(collection(db, 'suggestedGoals'), {
          ...suggestion,
          userId: currentUser.uid,
          isCurrent: false,
          isIgnored: false,
          teamId: currentUser.teamId || '',
          createdAt: serverTimestamp(),
        });
      }

      await fetchSuggestedGoals();
    }
  } catch (error) {
    console.error('[Error] Analyzing user context failed:', error);
  }
};

// Fetch goals
export const fetchGoals = async (db, userId) => {
  if (!db || !userId) {
    console.error('[Error] Missing required parameters: db or userId.');
    return [];
  }

  try {
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(goalsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('[Error] Failed to fetch goals:', error);
    return [];
  }
};

// Fetch suggested goals
export const fetchSuggestedGoals = async (db, userId) => {
  if (!db || !userId) {
    console.error('[Error] Missing required parameters: db or userId.');
    return [];
  }

  try {
    const suggestedGoalsQuery = query(
      collection(db, 'suggestedGoals'),
      where('userId', '==', userId),
      where('isCurrent', '==', false),
      where('isIgnored', '==', false)
    );

    const snapshot = await getDocs(suggestedGoalsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('[Error] Failed to fetch suggested goals:', error);
    return [];
  }
};

