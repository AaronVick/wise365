//components/MilestonesSection.js
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../ui/card';
import MilestoneCard from './MilestoneCard';
import MilestoneFilters from './MilestoneFilters';

const MilestonesSection = ({ currentUser }) => {
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'completed', 'in_progress'

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        // Fetch funnel definitions
        const funnelsRef = collection(db, 'funnels');
        const funnelsSnapshot = await getDocs(funnelsRef);
        const funnelsData = funnelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch user's funnel data
        const funnelDataRef = collection(db, 'funnelData');
        const funnelDataQuery = query(
          funnelDataRef,
          where('userId', '==', currentUser.uid)
        );
        const funnelDataSnapshot = await getDocs(funnelDataQuery);
        const userData = funnelDataSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Process milestones
        const processedMilestones = processMilestones(funnelsData, userData);
        setMilestones(processedMilestones);
        applyFilter(processedMilestones, activeFilter);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) {
      fetchMilestones();
    }
  }, [currentUser]);

  // Process milestones and calculate progress
  const processMilestones = (funnels, userData) => {
    return funnels.flatMap(funnel => 
      funnel.milestones.map(milestone => {
        const progress = calculateMilestoneProgress(milestone, userData);
        const status = determineStatus(progress, milestone, userData);
        
        return {
          ...milestone,
          funnelName: funnel.name,
          progress,
          status,
          priority: funnel.priority
        };
      })
    ).filter(milestone => milestone.status !== 'not_ready');
  };

  // Calculate progress for a milestone based on user data
  const calculateMilestoneProgress = async (milestone, userData) => {
    try {
      // Early return if no user data
      if (!userData || userData.length === 0) return 0;
  
      // Get relevant user data
      const relevantData = userData.filter(data => {
        // Match based on conversationId if it exists
        if (milestone.conversationId) {
          return data.conversationId === milestone.conversationId;
        }
        
        // Check the data path for relevant data
        const pathParts = milestone.dataPath.split('.');
        return pathParts.every(part => data[part] !== undefined);
      });
  
      // If no relevant data found, milestone hasn't been started
      if (relevantData.length === 0) return 0;
  
      // Prepare data for LLM analysis
      const analysisPrompt = {
        milestone: {
          name: milestone.name,
          description: milestone.description,
          validationLogic: milestone.validationLogic,
          dataPath: milestone.dataPath,
          kpis: milestone.kpis
        },
        userData: relevantData,
        task: "Analyze the user's progress on this milestone based on the available data. " +
              "Consider the validation logic, KPIs, and any relevant conversations or form submissions. " +
              "Return a progress percentage (0-100) and a brief explanation."
      };
  
      // Call LLM for analysis
      const response = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisPrompt)
      });
  
      if (!response.ok) {
        console.error('Error from progress analysis API');
        return calculateBasicProgress(relevantData);
      }
  
      const analysis = await response.json();
      return analysis.progress;
  
    } catch (error) {
      console.error('Error calculating milestone progress:', error);
      return calculateBasicProgress(relevantData);
    }
  };
  
  // Fallback basic progress calculation
  const calculateBasicProgress = (userData) => {
    // Basic progress indicators could include:
    // - Presence of required data
    // - Number of interactions
    // - Timestamps of activities
    
    if (!userData || userData.length === 0) return 0;
    
    // Look for any progress indicators
    const hasInteractions = userData.some(data => data.type === 'interaction');
    const hasFormSubmissions = userData.some(data => data.type === 'form_submission');
    const hasAgentFeedback = userData.some(data => data.type === 'agent_feedback');
  
    // Very basic progress calculation
    let progressPoints = 0;
    if (hasInteractions) progressPoints += 33;
    if (hasFormSubmissions) progressPoints += 33;
    if (hasAgentFeedback) progressPoints += 34;
  
    return progressPoints;
  };
  
  // API route for progress analysis (api/analyze-progress.js)
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { milestone, userData, task } = req.body;
  
      // Construct the prompt for the LLM
      const messages = [
        {
          role: 'system',
          content: 'You are an AI assistant helping to analyze user progress through business development milestones. ' +
                   'Analyze the provided data and determine a progress percentage based on completion criteria, user actions, and KPIs.'
        },
        {
          role: 'user',
          content: `Please analyze the following milestone progress:
            Milestone: ${JSON.stringify(milestone, null, 2)}
            User Data: ${JSON.stringify(userData, null, 2)}
            Task: ${task}`
        }
      ];
  
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
  
      // Parse the response to extract progress percentage
      const responseText = completion.choices[0].message.content;
      
      // You'll need to implement parsing logic based on your preferred response format
      // For now, assuming the LLM returns a structured response we can parse
      const progressMatch = responseText.match(/progress: (\d+)/i);
      const progress = progressMatch ? parseInt(progressMatch[1]) : 0;
  
      return res.status(200).json({
        progress,
        explanation: responseText
      });
  
    } catch (error) {
      console.error('Error analyzing progress:', error);
      return res.status(500).json({ error: 'Error analyzing progress' });
    }
  }

  // Determine milestone status
  const determineStatus = (progress, milestone, userData) => {
    if (progress === 0) return 'ready';
    if (progress === 100) return 'completed';
    return 'in_progress';
  };

  // Handle filter changes
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(milestones, filter);
  };

  const applyFilter = (milestones, filter) => {
    if (filter === 'all') {
      setFilteredMilestones(milestones);
      return;
    }
    
    const filtered = milestones.filter(milestone => milestone.status === filter);
    setFilteredMilestones(filtered);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Milestones</h2>
        <MilestoneFilters 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="space-y-4">
        {filteredMilestones.map((milestone) => (
          <MilestoneCard
            key={`${milestone.funnelName}-${milestone.name}`}
            milestone={milestone}
          />
        ))}
        
        {filteredMilestones.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No milestones found for the selected filter.
          </div>
        )}
      </div>
    </Card>
  );
};

export default MilestonesSection;