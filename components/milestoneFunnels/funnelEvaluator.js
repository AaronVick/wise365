// components/milestoneFunnels/funnelEvaluator.js

'use client';

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

    // Debug log all funnel names
    console.log('Available funnels:', funnels.map(f => ({ 
      name: f.name, 
      milestones: f.milestones?.length 
    })));

    // Find onboarding funnel first (case insensitive)
    const onboardingFunnel = funnels.find(f => 
      f.name.toLowerCase() === 'onboarding funnel' && 
      Array.isArray(f.milestones) && 
      f.milestones.length > 0
    );

    console.log('Onboarding funnel found:', onboardingFunnel?.name);

    // For new users or users without any funnel data
    if (!userFunnelData || Object.keys(userFunnelData).length === 0) {
      console.log('New user detected - setting up onboarding');
      if (onboardingFunnel) {
        // Process onboarding funnel for new user
        const processedFunnel = {
          ...onboardingFunnel,
          milestones: onboardingFunnel.milestones.map((m, index) => ({
            ...m,
            status: index === 0 ? 'ready' : 'not_ready',
            progress: 0,
            funnelName: onboardingFunnel.name,
            priority: 1
          }))
        };
        availableFunnels.inProgress.push(processedFunnel);
        console.log('Added onboarding funnel for new user:', processedFunnel);
        return availableFunnels;
      }
    }

    // Check onboarding completion status
    const onboardingStatus = evaluateFunnelStatus(onboardingFunnel, userFunnelData);
    const isOnboardingCompleted = onboardingStatus === 'completed';
    console.log('Onboarding status:', onboardingStatus);

    // If onboarding isn't completed, show it and any progress made
    if (!isOnboardingCompleted && onboardingFunnel) {
      const processedFunnel = {
        ...onboardingFunnel,
        milestones: onboardingFunnel.milestones.map(m => ({
          ...m,
          status: 'ready',
          progress: getUserMilestoneProgress(m.name, onboardingFunnel.name, userFunnelData),
          funnelName: onboardingFunnel.name
        }))
      };
      availableFunnels.inProgress.push(processedFunnel);
    }

    // Process other funnels
    funnels.forEach(funnel => {
      if (funnel.name.toLowerCase() === 'onboarding funnel') return;

      const status = evaluateFunnelStatus(funnel, userFunnelData);
      const meetsPrerequisites = checkFunnelPrerequisites(funnel, userFunnelData);
      
      console.log('Evaluating funnel:', {
        name: funnel.name,
        status,
        meetsPrerequisites,
        dependencies: funnel.dependencies
      });

      const processedFunnel = {
        ...funnel,
        milestones: funnel.milestones.map(m => ({
          ...m,
          status: getFunnelStatus(status, meetsPrerequisites),
          progress: getUserMilestoneProgress(m.name, funnel.name, userFunnelData),
          funnelName: funnel.name
        }))
      };

      if (status === 'completed') {
        availableFunnels.completed.push(processedFunnel);
      } else if (status === 'in_progress' || (status === 'ready' && meetsPrerequisites)) {
        availableFunnels.inProgress.push(processedFunnel);
      } else if (meetsPrerequisites) {
        availableFunnels.ready.push(processedFunnel);
      }
    });

    console.log('Final available funnels:', {
      inProgress: availableFunnels.inProgress.map(f => f.name),
      ready: availableFunnels.ready.map(f => f.name),
      completed: availableFunnels.completed.map(f => f.name)
    });

  } catch (error) {
    console.error('Error evaluating funnels:', error);
  }

  return availableFunnels;
};

const evaluateFunnelStatus = (funnel, userData) => {
  if (!funnel) return 'not_ready';
  
  const funnelData = userData[funnel.name];
  
  if (!funnelData) {
    return funnel.name.toLowerCase() === 'onboarding funnel' ? 'in_progress' : 'ready';
  }

  if (funnelData.status === 'completed') {
    return 'completed';
  }

  return funnelData.status || 'ready';
};

const getUserMilestoneProgress = (milestoneName, funnelName, userData) => {
  return userData[funnelName]?.milestones?.[milestoneName]?.progress || 0;
};

const getFunnelStatus = (funnelStatus, meetsPrerequisites) => {
  if (!meetsPrerequisites) return 'not_ready';
  if (funnelStatus === 'completed') return 'completed';
  if (funnelStatus === 'in_progress') return 'in_progress';
  return 'ready';
};

const checkFunnelPrerequisites = (funnel, userData) => {
  if (!funnel.dependencies || funnel.dependencies.length === 0) {
    return true;
  }
  return funnel.dependencies.every(dep => {
    const depData = userData[dep];
    return depData?.status === 'completed';
  });
};

export const updateMilestoneStatus = (milestone, funnelData = {}) => {
  try {
    // For new users or no funnel data
    if (!funnelData || Object.keys(funnelData).length === 0) {
      return {
        ...milestone,
        status: milestone.funnelName.toLowerCase() === 'onboarding funnel' ? 'ready' : 'not_ready',
        progress: 0
      };
    }

    const funnelProgress = funnelData[milestone.funnelName];
    if (!funnelProgress) {
      return {
        ...milestone,
        status: milestone.funnelName.toLowerCase() === 'onboarding funnel' ? 'ready' : 'not_ready',
        progress: 0
      };
    }

    const milestoneProgress = funnelProgress.milestones?.[milestone.name]?.progress || 0;
    let status;

    if (milestoneProgress === 100) status = 'completed';
    else if (milestoneProgress > 0) status = 'in_progress';
    else status = milestone.status || 'ready';

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