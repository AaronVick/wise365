// components/FunnelActionHandler.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const createFunnelProject = async (action, currentUser, funnel) => {
  try {
    // Create project in projectNames collection
    const projectRef = await addDoc(collection(db, 'projectNames'), {
      ProjectName: `${funnel.name} - ${action.description}`,
      participants: {
        userId: currentUser.uid,
        agent: action.agents[0], // Primary agent
        supporting: action.agents.slice(1) // Supporting agents
      },
      teamId: currentUser.teamId || '',
      funnelId: funnel.id,
      phase: action.phase,
      status: 'active',
      createdAt: serverTimestamp()
    });

    // Create initial chat for the project
    const conversationRef = await addDoc(collection(db, 'conversationNames'), {
      agentId: action.agents[0],
      conversationName: `${funnel.name} - ${action.description}`,
      userId: currentUser.uid,
      isDefault: false,
      projectId: projectRef.id,
      projectName: `${funnel.name} - ${action.description}`,
      timestamp: serverTimestamp()
    });

    // Add initial context message
    await addDoc(collection(db, 'conversations'), {
      agentId: action.agents[0],
      content: generateInitialMessage(action, funnel),
      conversationName: conversationRef.id,
      from: action.agents[0],
      isDefault: false,
      projectId: projectRef.id,
      timestamp: serverTimestamp(),
      type: 'agent'
    });

    return {
      projectId: projectRef.id,
      conversationId: conversationRef.id
    };
  } catch (error) {
    console.error('Error creating funnel project:', error);
    throw error;
  }
};

const generateInitialMessage = (action, funnel) => {
  let message = `Hi! I'm here to help you with ${action.description} as part of your ${funnel.name} progression.`;

  if (action.type === 'form') {
    message += `\n\nWe'll need to complete the ${action.formId} form. I'll guide you through this process.`;
  }

  if (action.prerequisites) {
    message += `\n\nBefore we begin, let's make sure we have:\n${action.prerequisites.map(p => `- ${p}`).join('\n')}`;
  }

  message += `\n\nShall we get started?`;

  return message;
};