// components/ProgressAnalyzer.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useProgressAnalyzer = (currentUser, funnel, milestone) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const analyzeProgress = async () => {
      if (!currentUser?.uid || !funnel || !milestone) {
        setLoading(false);
        return;
      }

      try {
        // Gather data for analysis
        const data = await gatherAnalysisData(currentUser.uid, funnel, milestone);
        
        // Get LLM analysis
        const analysisResult = await performAnalysis(data);
        
        setAnalysis(analysisResult);
      } catch (err) {
        console.error('Error in progress analysis:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    analyzeProgress();
  }, [currentUser?.uid, funnel, milestone]);

  // Gather all relevant data for analysis
  const gatherAnalysisData = async (userId, funnel, milestone) => {
    // Get conversation history
    const conversationsRef = collection(db, 'conversations');
    const conversationsQuery = query(
      conversationsRef,
      where('conversationName', '==', milestone.conversationId),
      orderBy('timestamp', 'asc')
    );
    
    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversations = conversationsSnapshot.docs.map(doc => doc.data());

    // Get form submissions
    const formDataRef = collection(db, 'formData');
    const formQuery = query(
      formDataRef,
      where('userId', '==', userId),
      where('funnelId', '==', funnel.id)
    );
    
    const formSnapshot = await getDocs(formQuery);
    const formData = formSnapshot.docs.map(doc => doc.data());

    // Get project data if exists
    const projectDataRef = collection(db, 'projectNames');
    const projectQuery = query(
      projectDataRef,
      where('userId', '==', userId),
      where('funnelId', '==', funnel.id)
    );
    
    const projectSnapshot = await getDocs(projectQuery);
    const projectData = projectSnapshot.docs.map(doc => doc.data());

    return {
      conversations,
      formData,
      projectData,
      milestone,
      funnel
    };
  };

  // Perform LLM analysis
  const performAnalysis = async (data) => {
    try {
      // First, analyze conversations for insights
      const chatAnalysis = await fetch('/api/analyze-chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversations: data.conversations,
          milestone: data.milestone
        })
      });
      
      const chatInsights = await chatAnalysis.json();

      // Then get comprehensive progress analysis
      const progressResponse = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: data.milestone,
          conversations: chatInsights,
          formData: data.formData,
          projectData: data.projectData,
          funnel: data.funnel
        })
      });

      if (!progressResponse.ok) {
        throw new Error('Failed to analyze progress');
      }

      const progressAnalysis = await progressResponse.json();

      // Get next steps and recommendations
      const contextResponse = await fetch('/api/analyze-user-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: data.milestone,
          progress: progressAnalysis,
          funnel: data.funnel,
          formData: data.formData
        })
      });

      const contextAnalysis = await contextResponse.json();

      // Combine all analyses
      return {
        progress: progressAnalysis.progress,
        status: determineStatus(progressAnalysis.progress),
        insights: chatInsights,
        recommendations: contextAnalysis.recommendations,
        nextSteps: contextAnalysis.nextSteps,
        blockers: progressAnalysis.blockers || [],
        requiredForms: progressAnalysis.requiredForms || []
      };
    } catch (error) {
      console.error('Error in LLM analysis:', error);
      throw new Error('Failed to analyze progress');
    }
  };

  // Helper function to determine status
  const determineStatus = (progress) => {
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in_progress';
    return 'ready';
  };

  // Exposed helper functions
  const checkFormRequirement = (formId) => {
    if (!analysis) return true; // Assume required if no analysis
    return analysis.requiredForms.includes(formId);
  };

  const getNextSteps = () => {
    if (!analysis) return [];
    return analysis.nextSteps;
  };

  const getBlockers = () => {
    if (!analysis) return [];
    return analysis.blockers;
  };

  return {
    analysis,
    loading,
    error,
    checkFormRequirement,
    getNextSteps,
    getBlockers
  };
};

// Component for direct usage in UI if needed
const ProgressAnalyzer = ({ 
  currentUser, 
  funnel, 
  milestone, 
  onAnalysisComplete 
}) => {
  const { 
    analysis, 
    loading, 
    error, 
    checkFormRequirement, 
    getNextSteps, 
    getBlockers 
  } = useProgressAnalyzer(currentUser, funnel, milestone);

  useEffect(() => {
    if (analysis && onAnalysisComplete) {
      onAnalysisComplete(analysis);
    }
  }, [analysis, onAnalysisComplete]);

  // This component doesn't render anything directly
  return null;
};

export default ProgressAnalyzer;