// pages/api/generate-suggestions.js

import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, teamId } = req.body;

    if (!userId || !teamId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get default suggestions while waiting for analysis
    const defaultSuggestions = [
      {
        type: 'agent',
        title: 'Start Marketing Strategy',
        description: 'Work with Mike to develop your marketing plan',
        agent: { id: 'mike', name: 'Mike' },
        priority: 1,
        relevanceScore: 0.8
      },
      {
        type: 'agent',
        title: 'Define Target Audience',
        description: 'Collaborate with Alex on buyer personas',
        agent: { id: 'alex', name: 'Alex' },
        priority: 2,
        relevanceScore: 0.7
      }
    ];

    // Get user's resource usage
    const resourcesRef = collection(db, 'resources');
    const resourceQuery = query(
      resourcesRef,
      where('teamId', '==', teamId)
    );
    const resourceSnapshot = await getDocs(resourceQuery);
    
    const unusedResources = resourceSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(resource => !resource.lastUsed);

    // Add resource-based suggestions
    if (unusedResources.length > 0) {
      const resourceSuggestion = {
        type: 'tool',
        title: `Complete ${unusedResources[0].name}`,
        description: `Enhance your strategy by filling out the ${unusedResources[0].name}`,
        toolId: unusedResources[0].id,
        action: unusedResources[0].action,
        priority: 3,
        relevanceScore: 0.6
      };
      defaultSuggestions.push(resourceSuggestion);
    }

    return res.status(200).json({ 
      suggestions: defaultSuggestions
    });

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
}