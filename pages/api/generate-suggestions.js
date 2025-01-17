// pages/api/generate-suggestions.js

import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit 
} from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId } = req.body;

    if (!userId && !teamId) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        details: 'Both userId and teamId are required' 
      });
    }

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'userId is required' 
      });
    }

    if (!teamId) {
      return res.status(400).json({ 
        error: 'Missing required parameter', 
        details: 'teamId is required' 
      });
    }

    // Verify team exists
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      return res.status(404).json({ 
        error: 'Team not found',
        details: `No team found with ID: ${teamId}`
      });
    }

    const suggestions = [];

    // 1. Check incomplete resources
    const resourcesRef = collection(db, 'resources');
    const resourceQuery = query(
      resourcesRef,
      where('teamId', '==', teamId),
      where('lastUsed', '==', null)
    );
    const resourceSnapshot = await getDocs(resourceQuery);
    
    const unusedResources = resourceSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Add resource-based suggestions
    for (const resource of unusedResources) {
      suggestions.push({
        type: 'tool',
        title: `Complete ${resource.name}`,
        description: `Enhance your strategy by filling out the ${resource.name}`,
        toolId: resource.id,
        action: resource.action,
        priority: resource.priority || 3,
        relevanceScore: 0.6
      });
    }

    // 2. Check incomplete funnels
    const funnelsRef = collection(db, 'funnelData');
    const funnelQuery = query(
      funnelsRef,
      where('userId', '==', userId),
      where('status', '==', 'incomplete')
    );
    const funnelSnapshot = await getDocs(funnelQuery);

    const incompleteFunnels = funnelSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Add funnel-based suggestions
    for (const funnel of incompleteFunnels) {
      suggestions.push({
        type: 'tool',
        title: `Continue ${funnel.name}`,
        description: `Resume working on your ${funnel.name.toLowerCase()}`,
        toolId: funnel.id,
        action: 'continue_funnel',
        priority: funnel.priority || 2,
        relevanceScore: 0.7
      });
    }

    // 3. Check recent conversations and agent interactions
    const conversationsRef = collection(db, 'conversations');
    const conversationQuery = query(
      conversationsRef,
      where('userId', '==', userId),
      orderBy('lastUpdatedAt', 'desc'),
      limit(5)
    );
    const conversationSnapshot = await getDocs(conversationQuery);

    const recentConversations = conversationSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Check for agents the user hasn't interacted with
    const agentsRef = collection(db, 'agents');
    const agentSnapshot = await getDocs(agentsRef);
    const allAgents = agentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const interactedAgentIds = new Set(recentConversations.map(conv => conv.agentId));
    const unusedAgents = allAgents.filter(agent => !interactedAgentIds.has(agent.id));

    // Add agent-based suggestions
    for (const agent of unusedAgents) {
      suggestions.push({
        type: 'agent',
        title: `Connect with ${agent.name}`,
        description: agent.description || `Start a conversation with ${agent.name} to get expert advice`,
        agent: {
          id: agent.id,
          name: agent.name
        },
        priority: agent.priority || 1,
        relevanceScore: 0.8
      });
    }

    // Sort suggestions by priority and relevance
    suggestions.sort((a, b) => {
      if (a.priority === b.priority) {
        return b.relevanceScore - a.relevanceScore;
      }
      return a.priority - b.priority;
    });

    return res.status(200).json({ 
      suggestions,
      metadata: {
        totalSuggestions: suggestions.length,
        categories: {
          resources: unusedResources.length,
          funnels: incompleteFunnels.length,
          agents: unusedAgents.length
        }
      }
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ 
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
}