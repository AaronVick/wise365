// pages/api/generate-suggestions.js

import { Configuration, OpenAIApi } from 'openai';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { mapFunnelDataToFunnels } from './funnelAnalyzer';

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId, userFunnelData, resourcesData } = req.body;

    // Check cache first
    const cachedSuggestions = await checkCache(userId);
    if (cachedSuggestions) {
      return res.status(200).json(cachedSuggestions);
    }

    // Gather all necessary data
    const [
      funnelAnalysis,
      chatHistory,
      resourceAnalysis
    ] = await Promise.all([
      getFunnelSuggestions(userId, teamId, userFunnelData),
      getChatHistorySuggestions(userId),
      getResourceSuggestions(userId, resourcesData)
    ]);

    // Combine all suggestions
    let allSuggestions = [
      ...funnelAnalysis,
      ...chatHistory,
      ...resourceAnalysis
    ];

    // Use LLM to enhance and prioritize suggestions
    allSuggestions = await enhanceSuggestionsWithLLM(allSuggestions, userId);

    // Cache the results
    await cacheSuggestions(userId, allSuggestions);

    return res.status(200).json({ suggestions: allSuggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}

async function getFunnelSuggestions(userId, teamId, userFunnelData) {
  const { conversations, funnels } = await mapFunnelDataToFunnels(teamId);
  const suggestions = [];

  // Add suggestions from funnel analysis
  for (const funnel of funnels) {
    const progress = userFunnelData?.[funnel.name] || {};
    
    // Find incomplete milestones
    const incompleteMilestones = funnel.milestones.filter(m => 
      !progress.milestones?.[m.name]?.completed
    );

    if (incompleteMilestones.length > 0) {
      suggestions.push({
        type: 'agent',
        title: `Continue ${funnel.name}`,
        description: `Work on ${incompleteMilestones[0].name}`,
        agent: { id: funnel.responsibleAgents.lead, name: funnel.responsibleAgents.lead },
        priority: funnel.name.toLowerCase() === 'onboarding funnel' ? 1 : 2,
        relevanceScore: 0.8
      });
    }
  }

  return suggestions;
}

async function getChatHistorySuggestions(userId) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-chat-history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  const { groupedData } = await response.json();
  const suggestions = [];

  for (const agentId in groupedData) {
    const unresolvedItems = groupedData[agentId].summary.unresolved;
    if (unresolvedItems?.length > 0) {
      suggestions.push({
        type: 'agent',
        title: 'Follow Up Discussion',
        description: `Continue your conversation about ${unresolvedItems[0]}`,
        agent: { id: agentId, name: agentId },
        priority: 1,
        relevanceScore: 0.8
      });
    }
  }

  return suggestions;
}

async function getResourceSuggestions(userId, resourcesData) {
  const suggestions = [];
  
  // Find unused resources
  const unusedResources = resourcesData.filter(resource => 
    !resource.lastUsed || 
    (new Date() - new Date(resource.lastUsed)) > 30 * 24 * 60 * 60 * 1000 // 30 days
  );

  // Add suggestions for unused resources
  unusedResources.forEach(resource => {
    suggestions.push({
      type: 'tool',
      title: `Complete ${resource.name}`,
      description: `Enhance your business strategy by filling out the ${resource.name}`,
      toolId: resource.id,
      onClick: resource.action,
      priority: 3,
      relevanceScore: 0.5
    });
  });

  return suggestions;
}

async function enhanceSuggestionsWithLLM(suggestions, userId) {
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: 'system',
          content: 'You are a business advisor helping to prioritize and enhance action suggestions for a user.'
        },
        {
          role: 'user',
          content: `Please analyze and enhance these suggestions, providing a relevance score (0-1) and priority (1-3) for each: ${JSON.stringify(suggestions)}`
        }
      ],
      temperature: 0.7,
    });

    const enhancedSuggestions = JSON.parse(completion.data.choices[0].message.content);
    return enhancedSuggestions;
  } catch (error) {
    console.error('Error enhancing suggestions with LLM:', error);
    return suggestions; // Return original suggestions if enhancement fails
  }
}

async function checkCache(userId) {
  const cacheRef = doc(db, 'suggestionCache', userId);
  const cacheDoc = await getDoc(cacheRef);
  
  if (!cacheDoc.exists()) return null;
  
  const cache = cacheDoc.data();
  const now = Date.now();
  
  if (now - cache.timestamp < CACHE_DURATION) {
    return cache.suggestions;
  }
  
  return null;
}

async function cacheSuggestions(userId, suggestions) {
  const cacheRef = doc(db, 'suggestionCache', userId);
  await setDoc(cacheRef, {
    suggestions,
    timestamp: Date.now()
  });
}