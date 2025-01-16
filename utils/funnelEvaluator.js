// /utils/funnelEvaluator.js

import _ from 'lodash';

export const evaluateFunnelAvailability = (funnels, userData, userFunnelData) => {
  // Initialize result structure
  const result = {
    available: [], // Currently available/active funnels
    locked: [],    // Funnels that don't meet prerequisites
    completed: []  // Completed funnels
  };

  // Sort funnels to ensure onboarding is first
  const sortedFunnels = _.sortBy(funnels, funnel => 
    funnel.name.toLowerCase() === 'onboarding funnel' ? 0 : 1
  );

  sortedFunnels.forEach(funnel => {
    const funnelStatus = determineFunnelStatus(funnel, userData, userFunnelData);
    result[funnelStatus].push({
      ...funnel,
      status: funnelStatus,
      progress: calculateFunnelProgress(funnel, userFunnelData),
      requirements: getUnmetRequirements(funnel, userData, userFunnelData)
    });
  });

  return result;
};

const determineFunnelStatus = (funnel, userData, userFunnelData) => {
  // Special handling for onboarding funnel
  if (funnel.name.toLowerCase() === 'onboarding funnel') {
    if (!userFunnelData || _.isEmpty(userFunnelData)) return 'available';
    return userFunnelData.onboardingComplete ? 'completed' : 'available';
  }

  // Check if funnel is completed
  if (userFunnelData?.[funnel.name]?.status === 'completed') {
    return 'completed';
  }

  // Check prerequisites
  const meetsPrerequisites = checkPrerequisites(funnel, userData, userFunnelData);
  if (!meetsPrerequisites) {
    return 'locked';
  }

  return 'available';
};

const calculateFunnelProgress = (funnel, userFunnelData) => {
  if (!userFunnelData || !userFunnelData[funnel.name]) return 0;

  const milestoneProgress = funnel.milestones.map(milestone => {
    const progress = userFunnelData[funnel.name]?.milestones?.[milestone.name]?.progress || 0;
    return {
      name: milestone.name,
      progress,
      weight: milestone.weight || 1
    };
  });

  const totalWeight = _.sumBy(milestoneProgress, 'weight');
  const weightedProgress = _.sumBy(milestoneProgress, m => (m.progress * m.weight));

  return Math.round((weightedProgress / totalWeight) || 0);
};

const checkPrerequisites = (funnel, userData, userFunnelData) => {
  // Always require onboarding completion unless this is the onboarding funnel
  if (funnel.name.toLowerCase() !== 'onboarding funnel' && 
      !userFunnelData?.onboardingComplete) {
    return false;
  }

  // Check explicit dependencies
  if (funnel.dependencies) {
    const dependenciesMet = funnel.dependencies.every(dep => 
      userFunnelData?.[dep]?.status === 'completed'
    );
    if (!dependenciesMet) return false;
  }

  // Check data requirements
  if (funnel.dataRequirements) {
    const dataRequirementsMet = funnel.dataRequirements.every(req => {
      const value = _.get(userData, req.path);
      return value !== undefined && value !== null;
    });
    if (!dataRequirementsMet) return false;
  }

  return true;
};

const getUnmetRequirements = (funnel, userData, userFunnelData) => {
  const unmet = [];

  // Check onboarding
  if (funnel.name.toLowerCase() !== 'onboarding funnel' && 
      !userFunnelData?.onboardingComplete) {
    unmet.push('Complete onboarding process');
  }

  // Check dependencies
  if (funnel.dependencies) {
    funnel.dependencies.forEach(dep => {
      if (userFunnelData?.[dep]?.status !== 'completed') {
        unmet.push(`Complete ${dep}`);
      }
    });
  }

  // Check data requirements
  if (funnel.dataRequirements) {
    funnel.dataRequirements.forEach(req => {
      const value = _.get(userData, req.path);
      if (value === undefined || value === null) {
        unmet.push(`Provide ${req.description || req.path}`);
      }
    });
  }

  return unmet;
};