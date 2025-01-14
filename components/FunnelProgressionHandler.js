// components/FunnelProgressionHandler.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useFunnelProgression = (funnel, currentUser, userData) => {
  const [currentPhase, setCurrentPhase] = useState(null);
  const [nextActions, setNextActions] = useState([]);
  const [requiredForms, setRequiredForms] = useState([]);

  useEffect(() => {
    const analyzeFunnelState = async () => {
      try {
        // Get user's funnel progress data
        const funnelDataRef = collection(db, 'funnelData');
        const q = query(
          funnelDataRef,
          where('userId', '==', currentUser.uid),
          where('funnelName', '==', funnel.name)
        );
        const snapshot = await getDocs(q);
        const funnelProgress = snapshot.docs[0]?.data() || {};

        // For Onboarding funnel, special handling
        if (funnel.name === 'Onboarding Funnel') {
          const actions = determineOnboardingActions(funnelProgress, userData);
          setNextActions(actions);
          return;
        }

        // Analyze required forms from funnel definition
        const forms = funnel.formsNeeded || [];
        const completedForms = userData.completedForms || [];
        const missingForms = forms.filter(form => !completedForms.includes(form));
        setRequiredForms(missingForms);

        // Determine current phase based on milestones
        const phase = determineCurrentPhase(funnel, funnelProgress);
        setCurrentPhase(phase);

        // Get next actions based on phase
        const actions = await determineNextActions(phase, funnel, userData);
        setNextActions(actions);

      } catch (error) {
        console.error('Error analyzing funnel state:', error);
      }
    };

    if (funnel && currentUser) {
      analyzeFunnelState();
    }
  }, [funnel, currentUser, userData]);

  const determineOnboardingActions = (progress, userData) => {
    const actions = [];
    
    // Check if MSW is needed
    if (!userData.mswScore) {
      actions.push({
        type: 'form',
        formId: 'marketing-success-wheel',
        description: 'Complete Marketing Success Wheel assessment',
        priority: 1,
        agent: 'shawn'
      });
    }

    // Add other onboarding specific checks
    if (!userData.basicInfo?.website) {
      actions.push({
        type: 'chat',
        agent: 'shawn',
        description: 'Gather basic business information',
        priority: 1
      });
    }

    return actions;
  };

  const determineCurrentPhase = (funnel, progress) => {
    // Check milestones in order
    for (const milestone of funnel.milestones) {
      const milestoneProgress = progress[milestone.name]?.progress || 0;
      if (milestoneProgress < 100) {
        return milestone;
      }
    }
    return funnel.milestones[funnel.milestones.length - 1];
  };

  const determineNextActions = async (phase, funnel, userData) => {
    try {
      // Get AI insights for next steps
      const response = await fetch('/api/analyze-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: phase,
          userData: userData,
          funnel: funnel
        })
      });

      if (!response.ok) throw new Error('Failed to analyze progress');
      
      const { suggestedActions } = await response.json();
      return suggestedActions.map(action => ({
        ...action,
        agents: determineRequiredAgents(action, funnel)
      }));

    } catch (error) {
      console.error('Error determining next actions:', error);
      return [];
    }
  };

  const determineRequiredAgents = (action, funnel) => {
    const agents = [];
    // Add lead agent
    if (funnel.responsibleAgents?.lead) {
      agents.push(funnel.responsibleAgents.lead);
    }
    // Add supporting agents based on action type
    if (funnel.responsibleAgents?.supporting) {
      agents.push(...funnel.responsibleAgents.supporting);
    }
    return agents;
  };

  return {
    currentPhase,
    nextActions,
    requiredForms
  };
};