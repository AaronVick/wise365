// components/funnelEvaluator.js

export const evaluateUserFunnels = (funnels, currentUser, userFunnelData = {}) => {
  try {
    // Start with empty arrays for different funnel categories
    const availableFunnels = {
      inProgress: [],
      ready: [],
      completed: []
    };

    // If no funnels data, return empty result
    if (!Array.isArray(funnels) || funnels.length === 0) {
      console.log('No funnels data available');
      return availableFunnels;
    }

    // Find onboarding funnel first
    const onboardingFunnel = funnels.find(f => 
      f.name === 'Onboarding Funnel' && Array.isArray(f.milestones)
    );

    console.log('Checking user funnel data:', userFunnelData);
    console.log('Found onboarding funnel:', onboardingFunnel);

    // For new users or users without progress
    if (!userFunnelData || Object.keys(userFunnelData).length === 0) {
      console.log('New user or no funnel data - starting with onboarding');
      if (onboardingFunnel) {
        availableFunnels.inProgress.push(onboardingFunnel);
      }
      return availableFunnels;
    }

    // Check if onboarding is completed
    const isOnboardingCompleted = checkFunnelCompletion('Onboarding Funnel', userFunnelData);
    console.log('Onboarding completed:', isOnboardingCompleted);

    // If onboarding isn't completed, only show onboarding
    if (!isOnboardingCompleted && onboardingFunnel) {
      availableFunnels.inProgress.push(onboardingFunnel);
      return availableFunnels;
    }

    // Process each funnel to determine its status
    funnels.forEach(funnel => {
      const status = evaluateFunnelStatus(funnel, userFunnelData);
      if (status === 'completed') {
        availableFunnels.completed.push(funnel);
      } else if (status === 'in_progress') {
        availableFunnels.inProgress.push(funnel);
      } else if (status === 'ready' && checkFunnelPrerequisites(funnel, userFunnelData)) {
        availableFunnels.ready.push(funnel);
      }
    });

    console.log('Available funnels:', availableFunnels);
    return availableFunnels;
  } catch (error) {
    console.error('Error evaluating funnels:', error);
    return {
      inProgress: [],
      ready: [],
      completed: []
    };
  }
};

export const updateMilestoneStatus = (milestone, funnelData = {}) => {
  try {
    // For new users or no funnel data
    if (!funnelData || Object.keys(funnelData).length === 0) {
      console.log('No funnel data for milestone:', milestone.name);
      return {
        ...milestone,
        status: milestone.funnelName === 'Onboarding Funnel' ? 'ready' : 'not_ready',
        progress: 0
      };
    }

    const funnelProgress = funnelData[milestone.funnelName];
    if (!funnelProgress) {
      console.log('No progress data for funnel:', milestone.funnelName);
      return {
        ...milestone,
        status: milestone.funnelName === 'Onboarding Funnel' ? 'ready' : 'not_ready',
        progress: 0
      };
    }

    const milestoneProgress = funnelProgress.milestones?.[milestone.name]?.progress || 0;
    const status = determineStatus(milestoneProgress);

    return {
      ...milestone,
      status,
      progress: milestoneProgress
    };
  } catch (error) {
    console.error('Error updating milestone status:', error);
    return milestone;
  }
};

const checkFunnelCompletion = (funnelName, userData) => {
  return userData[funnelName]?.status === 'completed';
};

const checkFunnelPrerequisites = (funnel, userData) => {
  if (!funnel.dependencies || funnel.dependencies.length === 0) {
    return true;
  }
  return funnel.dependencies.every(dep => checkFunnelCompletion(dep, userData));
};

const evaluateFunnelStatus = (funnel, userData) => {
  const funnelData = userData[funnel.name];
  
  if (!funnelData) {
    return funnel.name === 'Onboarding Funnel' ? 'in_progress' : 'not_ready';
  }

  if (funnelData.status === 'completed') {
    return 'completed';
  }

  return funnelData.status || 'ready';
};

const determineStatus = (progress) => {
  if (progress === 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'ready';
};