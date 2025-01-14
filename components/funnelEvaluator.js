// components/funnelEvaluator.js

/**
 * Evaluates which funnels should be available based on user progress and criteria
 */
export const evaluateUserFunnels = (funnels, userData = {}, funnelData = {}) => {
  try {
    // Start with empty arrays for different funnel categories
    const availableFunnels = {
      inProgress: [],
      ready: [],
      completed: [],
      locked: []
    };

    // If no funnels data, return empty result
    if (!Array.isArray(funnels) || funnels.length === 0) {
      return availableFunnels;
    }

    // Find onboarding funnel first
    const onboardingFunnel = funnels.find(f => 
      f.name === 'Onboarding Funnel' && Array.isArray(f.milestones)
    );

    // For new users or users without progress, start with onboarding
    if (!funnelData || Object.keys(funnelData).length === 0) {
      if (onboardingFunnel) {
        availableFunnels.inProgress.push(processFunnel(onboardingFunnel));
      }
      // Add other funnels as locked
      funnels
        .filter(f => f.name !== 'Onboarding Funnel')
        .forEach(f => availableFunnels.locked.push(processFunnel(f)));
      return availableFunnels;
    }

    // Process each funnel to determine its status
    funnels.forEach(funnel => {
      const status = evaluateFunnelStatus(funnel, userData, funnelData);
      availableFunnels[status].push(processFunnel(funnel));
    });

    return availableFunnels;
  } catch (error) {
    console.error('Error evaluating funnels:', error);
    return {
      inProgress: [],
      ready: [],
      completed: [],
      locked: []
    };
  }
};

/**
 * Determines the status of a single funnel based on criteria and dependencies
 */
const evaluateFunnelStatus = (funnel, userData, funnelData) => {
  // Check if funnel is completed
  if (isFunnelCompleted(funnel.name, funnelData)) {
    return 'completed';
  }

  // Check if funnel is in progress
  if (isFunnelInProgress(funnel.name, funnelData)) {
    return 'inProgress';
  }

  // Special case for Onboarding Funnel - always available if not completed
  if (funnel.name === 'Onboarding Funnel') {
    return 'inProgress';
  }

  // Check if funnel dependencies are met
  if (areDependenciesMet(funnel, funnelData)) {
    // Check entry criteria
    if (meetsEntryCriteria(funnel.entryCriteria, userData)) {
      return 'ready';
    }
  }

  return 'locked';
};

/**
 * Processes a funnel to prepare it for display
 */
const processFunnel = (funnel) => {
  return {
    ...funnel,
    milestones: funnel.milestones.map(milestone => ({
      ...milestone,
      funnelName: funnel.name,
      status: 'ready', // Default status, will be updated based on progress
      progress: 0      // Default progress, will be updated from funnelData
    }))
  };
};

/**
 * Checks if a funnel's dependencies have been completed
 */
const areDependenciesMet = (funnel, funnelData) => {
  if (!funnel.dependencies || funnel.dependencies.length === 0) {
    return true;
  }

  return funnel.dependencies.every(dep => 
    isFunnelCompleted(dep, funnelData)
  );
};

/**
 * Checks if entry criteria are met
 */
const meetsEntryCriteria = (criteria, userData) => {
  if (!criteria) return true;

  // Check MSW score if required
  if (criteria.mswScore) {
    const userScore = userData.mswScore;
    if (!userScore) return false;
    
    if (criteria.mswScore.includes('-')) {
      const [min, max] = criteria.mswScore.split('-').map(Number);
      if (userScore < min || userScore > max) return false;
    } else {
      if (userScore < Number(criteria.mswScore)) return false;
    }
  }

  // Check reported challenges
  if (Array.isArray(criteria.reportedChallenges) && 
      criteria.reportedChallenges.length > 0) {
    const userChallenges = userData.reportedChallenges || [];
    if (!criteria.reportedChallenges.some(c => userChallenges.includes(c))) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if a funnel is marked as completed in funnelData
 */
const isFunnelCompleted = (funnelName, funnelData) => {
  return funnelData[funnelName]?.status === 'completed';
};

/**
 * Checks if a funnel is marked as in progress in funnelData
 */
const isFunnelInProgress = (funnelName, funnelData) => {
  return funnelData[funnelName]?.status === 'in_progress';
};

/**
 * Updates milestone status based on funnel progress
 */
export const updateMilestoneStatus = (milestone, funnelData) => {
  const funnelProgress = funnelData[milestone.funnelName];
  if (!funnelProgress) {
    return {
      ...milestone,
      status: milestone.funnelName === 'Onboarding Funnel' ? 'ready' : 'locked',
      progress: 0
    };
  }

  const milestoneProgress = funnelProgress.milestones?.[milestone.name];
  if (!milestoneProgress) {
    return {
      ...milestone,
      status: 'ready',
      progress: 0
    };
  }

  return {
    ...milestone,
    status: milestoneProgress.status || 'ready',
    progress: milestoneProgress.progress || 0
  };
};