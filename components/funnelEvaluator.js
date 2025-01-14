// components/funnelEvaluator.js

export const evaluateUserFunnels = (funnels, currentUser, userFunnelData = {}) => {
  console.log('Starting funnel evaluation with:', {
    funnelsLength: funnels?.length,
    hasCurrentUser: !!currentUser,
    userFunnelDataKeys: Object.keys(userFunnelData)
  });

  const availableFunnels = {
    inProgress: [],
    ready: [],
    completed: []
  };

  try {
    if (!Array.isArray(funnels) || funnels.length === 0) {
      console.log('No funnels data available');
      return availableFunnels;
    }

    // Find onboarding funnel first
    const onboardingFunnel = funnels.find(f => f.name === 'Onboarding Funnel');
    console.log('Onboarding funnel found:', !!onboardingFunnel);

    // For new users or users without any funnel data
    if (!userFunnelData || Object.keys(userFunnelData).length === 0) {
      console.log('New user or no funnel data - starting with onboarding');
      if (onboardingFunnel) {
        availableFunnels.inProgress.push(onboardingFunnel);
        
        // Also add any funnels that don't have prerequisites
        funnels.forEach(funnel => {
          if (funnel.name !== 'Onboarding Funnel' && (!funnel.dependencies || funnel.dependencies.length === 0)) {
            availableFunnels.ready.push(funnel);
          }
        });
      }
      return availableFunnels;
    }

    // Check onboarding completion status
    const onboardingStatus = evaluateFunnelStatus(onboardingFunnel, userFunnelData);
    const isOnboardingCompleted = onboardingStatus === 'completed';
    console.log('Onboarding status:', onboardingStatus);

    // If onboarding isn't completed, show it and any progress made
    if (!isOnboardingCompleted && onboardingFunnel) {
      availableFunnels.inProgress.push(onboardingFunnel);
    }

    // Process each funnel to determine availability
    funnels.forEach(funnel => {
      // Skip onboarding as it's already handled
      if (funnel.name === 'Onboarding Funnel') return;

      const status = evaluateFunnelStatus(funnel, userFunnelData);
      const meetsPrerequisites = checkFunnelPrerequisites(funnel, userFunnelData);
      
      console.log('Evaluated funnel:', {
        name: funnel.name,
        status,
        meetsPrerequisites,
        dependencies: funnel.dependencies
      });

      // Place funnel in appropriate category
      if (status === 'completed') {
        availableFunnels.completed.push(funnel);
      } else if (status === 'in_progress' || (status === 'ready' && meetsPrerequisites)) {
        availableFunnels.inProgress.push(funnel);
      } else if (meetsPrerequisites) {
        availableFunnels.ready.push(funnel);
      }
    });

  } catch (error) {
    console.error('Error evaluating funnels:', error);
  }

  return availableFunnels;
};

const evaluateFunnelStatus = (funnel, userData) => {
  if (!funnel) return 'not_ready';
  
  const funnelData = userData[funnel.name];
  
  // New funnel with no data
  if (!funnelData) {
    // Onboarding is special - it starts as in_progress
    return funnel.name === 'Onboarding Funnel' ? 'in_progress' : 'ready';
  }

  // Check completion status
  if (funnelData.status === 'completed') {
    return 'completed';
  }

  // Check milestone progress
  const hasStartedMilestones = funnel.milestones?.some(milestone => 
    userData[funnel.name]?.milestones?.[milestone.name]?.progress > 0
  );

  return hasStartedMilestones ? 'in_progress' : 'ready';
};

export const updateMilestoneStatus = (milestone, funnelData = {}) => {
  try {
    // For new users or no funnel data
    if (!funnelData || Object.keys(funnelData).length === 0) {
      return {
        ...milestone,
        status: milestone.funnelName === 'Onboarding Funnel' ? 'ready' : 'not_ready',
        progress: 0,
        priority: milestone.priority || 
          (milestone.funnelName === 'Onboarding Funnel' ? 1 : 2)
      };
    }

    const funnelProgress = funnelData[milestone.funnelName];
    const milestoneProgress = funnelProgress?.milestones?.[milestone.name]?.progress || 0;
    
    let status;
    if (milestoneProgress === 100) status = 'completed';
    else if (milestoneProgress > 0) status = 'in_progress';
    else status = funnelProgress ? 'ready' : 'not_ready';

    return {
      ...milestone,
      status,
      progress: milestoneProgress,
      priority: milestone.priority || 
        (milestone.funnelName === 'Onboarding Funnel' ? 1 : 2)
    };
  } catch (error) {
    console.error('Error updating milestone status:', error);
    return milestone;
  }
};