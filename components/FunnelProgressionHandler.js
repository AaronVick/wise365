// components/FunnelProgressionHandler.js
import { useState, useEffect } from 'react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import firebaseService from '../lib/services/firebaseService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useFunnelProgression = (funnel, currentUser, userData) => {
  // Core state management
  const [currentPhase, setCurrentPhase] = useState(null);
  const [nextActions, setNextActions] = useState([]);
  const [requiredForms, setRequiredForms] = useState([]);
  const [progressDetails, setProgressDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch funnel data with fallback for empty collections
  const { data: funnelData, isLoading: isFunnelLoading } = useFirebaseData(
    'funnelData',
    currentUser?.authenticationID && funnel?.name ? [
      where('userId', '==', currentUser.authenticationID),
      where('funnelName', '==', funnel.name),
      orderBy('updatedAt', 'desc')
    ] : [],
    [currentUser?.authenticationID, funnel?.name]
  );

  // Fetch conversation data with fallback for empty collections
  const { data: conversationData, isLoading: isConversationLoading } = useFirebaseData(
    'conversations',
    currentUser?.authenticationID && funnel?.name ? [
      where('userId', '==', currentUser.authenticationID),
      where('funnelName', '==', funnel.name),
      orderBy('timestamp', 'asc')
    ] : [],
    [currentUser?.authenticationID, funnel?.name]
  );

  // Fetch form submissions if relevant
  const { data: formSubmissions, isLoading: isFormLoading } = useFirebaseData(
    'formData',
    currentUser?.authenticationID && funnel?.formsNeeded?.length ? [
      where('userId', '==', currentUser.authenticationID),
      where('formId', 'in', funnel.formsNeeded)
    ] : [],
    [currentUser?.authenticationID, funnel?.formsNeeded?.join(',')]
  );

  // Initialize default state for new users
  useEffect(() => {
    if (!currentUser || !funnel) {
      setCurrentPhase(null);
      setNextActions([]);
      setRequiredForms([]);
      setProgressDetails(null);
      return;
    }

    // Handle new user case
    if (!userData || Object.keys(userData).length === 0) {
      if (funnel.name.toLowerCase() === 'onboarding funnel') {
        setCurrentPhase({
          name: 'Getting Started',
          status: 'active',
          description: 'Complete your initial setup'
        });
        setNextActions([{
          type: 'form',
          description: 'Complete Basic Information',
          agents: ['shawn']
        }]);
        setRequiredForms(['basicInfo']);
        setProgressDetails({
          overall: 0,
          milestones: {},
          forms: 0,
          conversations: {}
        });
      }
    }
  }, [currentUser, funnel, userData]);

  // components/FunnelProgressionHandler.js
import { useState, useEffect } from 'react';
import { useFirebaseData } from '../hooks/useFirebaseData';
import firebaseService from '../lib/services/firebaseService';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useFunnelProgression = (funnel, currentUser, userData) => {
  // Core state management
  const [currentPhase, setCurrentPhase] = useState(null);
  const [nextActions, setNextActions] = useState([]);
  const [requiredForms, setRequiredForms] = useState([]);
  const [progressDetails, setProgressDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch funnel data with fallback for empty collections
  const { data: funnelData, isLoading: isFunnelLoading } = useFirebaseData(
    'funnelData',
    currentUser?.authenticationID && funnel?.name ? [
      where('userId', '==', currentUser.authenticationID),
      where('funnelName', '==', funnel.name),
      orderBy('updatedAt', 'desc')
    ] : [],
    [currentUser?.authenticationID, funnel?.name]
  );

  // Fetch conversation data with fallback for empty collections
  const { data: conversationData, isLoading: isConversationLoading } = useFirebaseData(
    'conversations',
    currentUser?.authenticationID && funnel?.name ? [
      where('userId', '==', currentUser.authenticationID),
      where('funnelName', '==', funnel.name),
      orderBy('timestamp', 'asc')
    ] : [],
    [currentUser?.authenticationID, funnel?.name]
  );

  // Fetch form submissions if relevant
  const { data: formSubmissions, isLoading: isFormLoading } = useFirebaseData(
    'formData',
    currentUser?.authenticationID && funnel?.formsNeeded?.length ? [
      where('userId', '==', currentUser.authenticationID),
      where('formId', 'in', funnel.formsNeeded)
    ] : [],
    [currentUser?.authenticationID, funnel?.formsNeeded?.join(',')]
  );

  // Initialize default state for new users
  useEffect(() => {
    if (!currentUser || !funnel) {
      setCurrentPhase(null);
      setNextActions([]);
      setRequiredForms([]);
      setProgressDetails(null);
      return;
    }

    // Handle new user case
    if (!userData || Object.keys(userData).length === 0) {
      if (funnel.name.toLowerCase() === 'onboarding funnel') {
        setCurrentPhase({
          name: 'Getting Started',
          status: 'active',
          description: 'Complete your initial setup'
        });
        setNextActions([{
          type: 'form',
          description: 'Complete Basic Information',
          agents: ['shawn']
        }]);
        setRequiredForms(['basicInfo']);
        setProgressDetails({
          overall: 0,
          milestones: {},
          forms: 0,
          conversations: {}
        });
      }
    }
  }, [currentUser, funnel, userData]);

  // Main effect for analyzing funnel state
  useEffect(() => {
    const analyzeFunnelState = async () => {
      // Don't proceed if essential data is missing or still loading
      if (!funnel || !currentUser || isFunnelLoading || isConversationLoading || isFormLoading) {
        return;
      }

      try {
        setLoading(true);
        
        // Initialize progress structure
        const progress = {
          overall: 0,
          milestones: {},
          forms: 0,
          conversations: {},
          dataRequirements: 0
        };

        // Calculate conversation progress
        if (conversationData?.length > 0) {
          progress.conversations = conversationData.reduce((acc, conv) => {
            const milestoneId = conv.milestoneId || 'default';
            if (!acc[milestoneId]) {
              acc[milestoneId] = {
                messageCount: 0,
                hasUserInput: false,
                hasAgentResponse: false,
                hasCompletion: false
              };
            }
            
            acc[milestoneId].messageCount++;
            if (conv.from === currentUser.authenticationID) {
              acc[milestoneId].hasUserInput = true;
            } else {
              acc[milestoneId].hasAgentResponse = true;
              if (conv.content?.toLowerCase().includes('completed') || 
                  conv.content?.toLowerCase().includes('finished')) {
                acc[milestoneId].hasCompletion = true;
              }
            }
            return acc;
          }, {});
        }

        // Calculate form completion progress
        if (funnel.formsNeeded?.length > 0) {
          const completedForms = formSubmissions?.length || 0;
          progress.forms = (completedForms / funnel.formsNeeded.length) * 100;
        } else {
          progress.forms = 100; // No forms needed = 100% complete
        }

        // Calculate data requirement progress
        if (funnel.dataRequirements?.length > 0) {
          const satisfiedRequirements = funnel.dataRequirements.filter(req => {
            const paths = req.path.split('.');
            let current = userData;
            return paths.every(path => {
              if (!current || !current[path]) return false;
              current = current[path];
              return true;
            });
          }).length;
          
          progress.dataRequirements = 
            (satisfiedRequirements / funnel.dataRequirements.length) * 100;
        } else {
          progress.dataRequirements = 100; // No requirements = 100% complete
        }

        // Calculate milestone-specific progress
        if (funnel.milestones?.length > 0) {
          funnel.milestones.forEach(milestone => {
            progress.milestones[milestone.name] = calculateMilestoneProgress(
              milestone,
              progress.conversations[milestone.name],
              progress.forms,
              progress.dataRequirements
            );
          });

          // Calculate overall progress
          progress.overall = Math.round(
            Object.values(progress.milestones)
              .reduce((sum, val) => sum + val, 0) / funnel.milestones.length
          );
        }

        setProgressDetails(progress);

        // Handle different funnel types
        if (funnel.name.toLowerCase() === 'onboarding funnel') {
          const result = handleOnboardingState(progress, userData);
          setCurrentPhase(result.phase);
          setNextActions(result.actions);
          setRequiredForms(result.forms);
        } else {
          // Handle regular funnel progression
          const phase = determineCurrentPhase(funnel, progress);
          setCurrentPhase(phase);

          const missingForms = funnel.formsNeeded?.filter(form => 
            !formSubmissions?.some(submission => submission.formId === form)
          ) || [];
          setRequiredForms(missingForms);

          const actions = await determineNextActions(phase, funnel, userData, progress);
          setNextActions(actions);
        }

        // Update funnel data if significant changes
        if (shouldUpdateFunnelData(progress, funnelData?.[0])) {
          await firebaseService.create('funnelData', {
            userId: currentUser.authenticationID,
            funnelName: funnel.name,
            progress,
            lastUpdated: new Date()
          });
        }

      } catch (err) {
        console.error('Error analyzing funnel state:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    analyzeFunnelState();
  }, [
    funnel, 
    currentUser, 
    userData, 
    funnelData, 
    conversationData, 
    formSubmissions,
    isFunnelLoading, 
    isConversationLoading,
    isFormLoading
  ]);

  // Helper function to calculate milestone-specific progress
  const calculateMilestoneProgress = (milestone, conversationProgress, formProgress, dataProgress) => {
    // Weight factors for different components
    const weights = {
      conversations: 0.4,
      forms: 0.3,
      data: 0.3
    };

    // Calculate conversation score
    let conversationScore = 0;
    if (conversationProgress) {
      if (conversationProgress.hasUserInput) conversationScore += 30;
      if (conversationProgress.hasAgentResponse) conversationScore += 30;
      if (conversationProgress.hasCompletion) conversationScore += 40;
    }

    // Calculate weighted scores
    const finalConversationScore = milestone.requiresConversation ? conversationScore : 100;
    const finalFormScore = milestone.requiresForm ? formProgress : 100;
    const finalDataScore = milestone.requiresData ? dataProgress : 100;

    // Return weighted average
    return Math.round(
      (finalConversationScore * weights.conversations) +
      (finalFormScore * weights.forms) +
      (finalDataScore * weights.data)
    );
  };

  // Helper function to handle onboarding state
  const handleOnboardingState = (progress, userData) => {
    const result = {
      phase: { name: 'Getting Started', status: 'active' },
      actions: [],
      forms: []
    };

    // For brand new users
    if (!userData || Object.keys(userData).length === 0) {
      result.actions = [{
        type: 'form',
        description: 'Complete Basic Information',
        agents: ['shawn']
      }];
      result.forms = ['basicInfo'];
      return result;
    }

    // For users with some progress
    const currentProgress = progress.overall;
    if (currentProgress < 33) {
      result.phase = { name: 'Initial Setup', status: 'active' };
      result.actions = getInitialSetupActions(progress);
    } else if (currentProgress < 66) {
      result.phase = { name: 'Business Profile', status: 'active' };
      result.actions = getBusinessProfileActions(progress);
    } else if (currentProgress < 100) {
      result.phase = { name: 'Final Steps', status: 'active' };
      result.actions = getFinalStepActions(progress);
    } else {
      result.phase = { name: 'Completed', status: 'completed' };
    }

    return result;
  };

  // Helper function to determine current phase
  const determineCurrentPhase = (funnel, progress) => {
    if (!funnel.phases || funnel.phases.length === 0) {
      return null;
    }

    // Find the first incomplete phase
    return funnel.phases.find(phase => {
      const phaseProgress = calculatePhaseProgress(phase, progress);
      return phaseProgress < 100;
    }) || funnel.phases[funnel.phases.length - 1];
  };

  // Helper function to calculate phase progress
  const calculatePhaseProgress = (phase, progress) => {
    if (!phase.milestones || phase.milestones.length === 0) {
      return 0;
    }

    const milestonesProgress = phase.milestones.map(milestoneName => 
      progress.milestones[milestoneName] || 0
    );

    return Math.round(
      milestonesProgress.reduce((sum, p) => sum + p, 0) / phase.milestones.length
    );
  };

  // Helper function to determine next actions
  const determineNextActions = async (phase, funnel, userData, progress) => {
    if (!phase || !funnel) {
      return [];
    }

    const actions = [];

    // Check for required forms
    const missingForms = funnel.formsNeeded?.filter(form => 
      !progress.forms[form]?.completed
    ) || [];

    missingForms.forEach(form => {
      actions.push({
        type: 'form',
        description: `Complete ${form}`,
        formId: form,
        agents: ['shawn']
      });
    });

    // Check for required conversations
    if (phase.conversations) {
      phase.conversations.forEach(conversation => {
        if (!progress.conversations[conversation.id]?.hasCompletion) {
          actions.push({
            type: 'conversation',
            description: conversation.description,
            agents: conversation.agents || ['shawn']
          });
        }
      });
    }

    // Add phase-specific actions
    if (phase.actions) {
      const phaseActions = phase.actions.filter(action => 
        !progress.milestones[action.milestone]?.completed
      );
      actions.push(...phaseActions);
    }

    return actions;
  };

  // Helper function to check if funnel data needs updating
  const shouldUpdateFunnelData = (newProgress, existingData) => {
    if (!existingData) return true;
    
    const lastUpdate = existingData.lastUpdated?.toDate() || 0;
    const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
    
    // Update if more than 1 hour has passed or significant progress change
    return hoursSinceUpdate > 1 || 
           Math.abs(newProgress.overall - existingData.progress.overall) > 5;
  };

  // Action helper functions for onboarding
  const getInitialSetupActions = (progress) => {
    const actions = [];
    if (!progress.forms.basicInfo?.completed) {
      actions.push({
        type: 'form',
        description: 'Complete Basic Information',
        formId: 'basicInfo',
        agents: ['shawn']
      });
    }
    return actions;
  };

  const getBusinessProfileActions = (progress) => {
    const actions = [];
    if (!progress.forms.businessProfile?.completed) {
      actions.push({
        type: 'form',
        description: 'Complete Business Profile',
        formId: 'businessProfile',
        agents: ['shawn']
      });
    }
    return actions;
  };

  const getFinalStepActions = (progress) => {
    const actions = [];
    if (!progress.forms.goals?.completed) {
      actions.push({
        type: 'form',
        description: 'Set Your Goals',
        formId: 'goals',
        agents: ['shawn']
      });
    }
    return actions;
  };

  // Dependency validation helper
  const validateDependencies = (funnel) => {
    if (!funnel.dependencies || funnel.dependencies.length === 0) {
      return { isValid: true, missing: [] };
    }

    const missing = funnel.dependencies.filter(dep => {
      // Check if the dependency exists in user's funnels
      const dependencyData = funnelData?.find(f => f.funnelName === dep);
      return !dependencyData || dependencyData.progress.overall < 100;
    });

    return {
      isValid: missing.length === 0,
      missing
    };
  };

  // Prerequisite validation helper
  const validatePrerequisites = (phase) => {
    if (!phase.prerequisites || phase.prerequisites.length === 0) {
      return { isValid: true, missing: [] };
    }

    const missing = phase.prerequisites.filter(prereq => {
      if (prereq.type === 'form') {
        return !formSubmissions?.some(form => form.formId === prereq.id);
      }
      if (prereq.type === 'data') {
        const paths = prereq.path.split('.');
        let current = userData;
        return !paths.every(path => {
          if (!current || !current[path]) return false;
          current = current[path];
          return true;
        });
      }
      return false;
    });

    return {
      isValid: missing.length === 0,
      missing
    };
  };

  // Integration with ProgressAnalyzer
  const getDetailedAnalysis = async () => {
    if (!progressDetails || !currentPhase) return null;

    try {
      // Get comprehensive analysis from ProgressAnalyzer
      const analysis = {
        currentStatus: {
          phase: currentPhase,
          progress: progressDetails,
          actions: nextActions
        },
        validation: {
          dependencies: validateDependencies(funnel),
          prerequisites: validatePrerequisites(currentPhase)
        },
        insights: {
          completedMilestones: Object.entries(progressDetails.milestones)
            .filter(([_, progress]) => progress === 100)
            .map(([name]) => name),
          blockers: [],
          recommendations: []
        }
      };

      // Add blockers based on validation
      if (!analysis.validation.dependencies.isValid) {
        analysis.insights.blockers.push({
          type: 'dependency',
          items: analysis.validation.dependencies.missing
        });
      }

      if (!analysis.validation.prerequisites.isValid) {
        analysis.insights.blockers.push({
          type: 'prerequisite',
          items: analysis.validation.prerequisites.missing
        });
      }

      // Generate recommendations
      if (analysis.insights.blockers.length > 0) {
        analysis.insights.recommendations.push(
          'Complete required dependencies before proceeding'
        );
      }

      if (progressDetails.forms < 100) {
        analysis.insights.recommendations.push(
          'Submit all required forms to unlock next steps'
        );
      }

      return analysis;
    } catch (error) {
      console.error('Error getting detailed analysis:', error);
      return null;
    }
  };

  // State transition helper
  const transitionState = async (newState) => {
    try {
      if (!funnel || !currentUser) return false;

      // Validate transition
      const validationResult = validateStateTransition(newState);
      if (!validationResult.isValid) {
        throw new Error(validationResult.reason);
      }

      // Update funnel data
      await firebaseService.create('funnelData', {
        userId: currentUser.authenticationID,
        funnelName: funnel.name,
        progress: progressDetails,
        currentState: newState,
        lastUpdated: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error in state transition:', error);
      return false;
    }
  };

  // Validate state transitions
  const validateStateTransition = (newState) => {
    if (!currentPhase) {
      return { isValid: false, reason: 'No current phase' };
    }

    // Check if this is a valid next state
    const validTransitions = {
      'active': ['completed', 'blocked'],
      'blocked': ['active'],
      'completed': ['active'] // Allow reopening if needed
    };

    const currentState = currentPhase.status;
    if (!validTransitions[currentState]?.includes(newState)) {
      return {
        isValid: false,
        reason: `Invalid transition from ${currentState} to ${newState}`
      };
    }

    return { isValid: true };
  };

  // Return all necessary data and functions
  return {
    // Core state
    currentPhase,
    nextActions,
    requiredForms,
    progressDetails,
    loading,
    error,

    // Analysis
    getDetailedAnalysis,

    // State management
    transitionState,
    validateDependencies,
    validatePrerequisites,

    // Status helpers
    isComplete: progressDetails?.overall === 100,
    isBlocked: !validateDependencies(funnel).isValid || 
               (currentPhase && !validatePrerequisites(currentPhase).isValid),
    canProgress: !loading && !error && progressDetails?.overall < 100
  };
};

export default useFunnelProgression;