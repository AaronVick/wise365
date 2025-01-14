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
      where('isDefault', '==', false)
    );

    const snapshot = await getDocs(nestedChatsQuery);

    const chats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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
    return <div className="ml-4 text-xs text-gray-400">Required data unavailable.</div>;
  }

  const chats = nestedChats[agentId] || [];

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
  );
};

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

export const handleAgentClick = async (agent, currentUser, db, setCurrentChat) => {
  if (!agent || !currentUser || !currentUser.uid || !db || !setCurrentChat) {
    console.error("[Error] Missing required parameters for handleAgentClick.");
    return;
  }

  try {
    console.log('Starting handleAgentClick for:', agent.name);

    setCurrentChat(null);

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
  } catch (error) {
    console.error('Error in handleAgentClick:', error);
  }
};

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
        conversationName: 'Project Chat',
        userId: currentUser.uid,
        isDefault: true,
      });
      conversationNameId = nameDoc.id;
    } else {
      console.log('Found existing project chat.');
      conversationNameId = namesSnapshot.docs[0].id;
    }

    const newChat = {
      id: conversationNameId,
      title: "Project Chat",
      projectId: project.id,
      projectName: project.ProjectName,
      participants: project.participants || {},
      isDefault: true,
      conversationName: conversationNameId,
    };

    console.log('Setting project chat:', newChat);
    setCurrentChat(newChat);
  } catch (error) {
    console.error('Error in handleProjectClick:', error);
  }
};

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

    const conversationNameRef = await addDoc(collection(db, 'conversationNames'), {
      agentId: agent.id,
      conversationName: name,
      projectName: '',
      userId: currentUser.uid,
    });

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
  } catch (error) {
    console.error('[Error] Failed to create named chat:', error);
  }
};