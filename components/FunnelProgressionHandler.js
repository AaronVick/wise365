// components/FunnelProgressionHandler.js
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import firebaseService from '../lib/services/firebaseService';


export const useFunnelProgression = (funnel, currentUser, userData) => {
  const [currentPhase, setCurrentPhase] = useState(null);
  const [nextActions, setNextActions] = useState([]);
  const [requiredForms, setRequiredForms] = useState([]);
  const [progressDetails, setProgressDetails] = useState(null);

  useEffect(() => {
    const analyzeFunnelState = async () => {
      try {
        // Get all relevant funnel data
        const [funnelData, conversationData, formData] = await Promise.all([
          getFunnelData(currentUser.authenticationID, funnel.name),
          getConversationData(currentUser.authenticationID, funnel.name),
          getFormData(currentUser.authenticationID, funnel.formsNeeded)
        ]);

        // Calculate comprehensive progress
        const progress = await calculateFunnelProgress(
          funnel,
          conversationData,
          formData,
          userData
        );
        setProgressDetails(progress);

        // For Onboarding funnel, special handling
        if (funnel.name.toLowerCase() === 'onboarding funnel') {
          const actions = determineOnboardingActions(progress, userData);
          setNextActions(actions);
          setCurrentPhase(determineOnboardingPhase(progress));
          return;
        }

        // Analyze required forms
        const completedForms = formData.map(f => f.formId);
        const missingForms = (funnel.formsNeeded || [])
          .filter(form => !completedForms.includes(form));
        setRequiredForms(missingForms);

        // Determine current phase
        const phase = determineCurrentPhase(funnel, progress);
        setCurrentPhase(phase);

        // Get next actions
        const actions = await determineNextActions(phase, funnel, userData, progress);
        setNextActions(actions);

        // Update funnel data in Firestore if needed
        if (shouldUpdateFunnelData(progress, funnelData)) {
          await updateFunnelProgress(currentUser.authenticationID, funnel.name, progress);
        }

      } catch (error) {
        console.error('Error analyzing funnel state:', error);
      }
    };

    if (funnel && currentUser) {
      analyzeFunnelState();
    }
  }, [funnel, currentUser, userData]);

  const calculateFunnelProgress = async (funnel, conversations, forms, userData) => {
    const progress = {
      overall: 0,
      milestones: {},
      conversations: analyzeConversations(conversations),
      forms: calculateFormProgress(forms, funnel.formsNeeded),
      dataRequirements: checkDataRequirements(userData, funnel)
    };

    // Calculate milestone-specific progress
    funnel.milestones.forEach(milestone => {
      progress.milestones[milestone.name] = calculateMilestoneProgress(
        milestone,
        progress.conversations,
        progress.forms,
        progress.dataRequirements
      );
    });

    // Calculate overall funnel progress
    progress.overall = Math.round(
      Object.values(progress.milestones)
        .reduce((sum, val) => sum + val, 0) / funnel.milestones.length
    );

    return progress;
  };

  const analyzeConversations = (conversations) => {
    const progress = {};
    conversations.forEach(conv => {
      const milestoneId = conv.milestoneId;
      if (!progress[milestoneId]) {
        progress[milestoneId] = {
          messageCount: 0,
          hasUserInput: false,
          hasAgentResponse: false,
          hasCompletion: false
        };
      }

      progress[milestoneId].messageCount++;
      
      if (conv.type === 'user') {
        progress[milestoneId].hasUserInput = true;
      } else if (conv.type === 'agent') {
        progress[milestoneId].hasAgentResponse = true;
        if (conv.content.toLowerCase().includes('completed') || 
            conv.content.toLowerCase().includes('finished')) {
          progress[milestoneId].hasCompletion = true;
        }
      }
    });

    return progress;
  };

  const calculateFormProgress = (completedForms, requiredForms) => {
    if (!requiredForms?.length) return 100;
    const completed = requiredForms.filter(form => 
      completedForms.some(cf => cf.formId === form)
    );
    return (completed.length / requiredForms.length) * 100;
  };

  const checkDataRequirements = (userData, funnel) => {
    if (!funnel.dataRequirements) return 100;
    let metRequirements = 0;
    
    funnel.dataRequirements.forEach(req => {
      const paths = req.path.split('.');
      let current = userData;
      let isValid = true;
      
      for (const path of paths) {
        if (!current || !current[path]) {
          isValid = false;
          break;
        }
        current = current[path];
      }
      
      if (isValid) metRequirements++;
    });

    return (metRequirements / funnel.dataRequirements.length) * 100;
  };

  const calculateMilestoneProgress = (milestone, conversationProgress, formProgress, dataProgress) => {
    const weights = {
      conversations: 0.4,
      forms: 0.3,
      data: 0.3
    };

    const conversationScore = getConversationScore(milestone, conversationProgress);
    const formScore = milestone.requiresForm ? formProgress : 100;
    const dataScore = milestone.requiresData ? dataProgress : 100;

    return Math.round(
      (conversationScore * weights.conversations) +
      (formScore * weights.forms) +
      (dataScore * weights.data)
    );
  };

  const getConversationScore = (milestone, conversationProgress) => {
    const progress = conversationProgress[milestone.name];
    if (!progress) return 0;

    let score = 0;
    if (progress.hasUserInput) score += 30;
    if (progress.hasAgentResponse) score += 30;
    if (progress.hasCompletion) score += 40;

    return Math.min(score, 100);
  };

  // ... rest of your existing helper functions ...

  return {
    currentPhase,
    nextActions,
    requiredForms,
    progressDetails
  };
};

// Helper functions for data fetching
async function getFunnelData(userId, funnelName) {
  return await firebaseService.getFunnelData(userId, funnelName);
}


async function getConversationData(userId, funnelName) {
  const ref = collection(db, 'conversations');
  const q = query(ref,
    where('userId', '==', userId),
    where('funnelName', '==', funnelName),
    orderBy('timestamp', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

async function getFormData(userId, formIds) {
  if (!formIds?.length) return [];
  const ref = collection(db, 'formData');
  const q = query(ref,
    where('userId', '==', userId),
    where('formId', 'in', formIds)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

async function updateFunnelProgress(userId, funnelName, progress) {
  const ref = collection(db, 'funnelData');
  await addDoc(ref, {
    userId,
    funnelName,
    progress,
    updatedAt: serverTimestamp()
  });
}

function shouldUpdateFunnelData(newProgress, existingData) {
  if (!existingData) return true;
  const lastUpdate = existingData.updatedAt?.toDate() || 0;
  const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
  return hoursSinceUpdate > 1 || Math.abs(newProgress.overall - existingData.progress.overall) > 5;
}