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

  // Helper and calculation functions
  const calculateMilestoneProgress = (milestone, conversationProgress, formProgress, dataProgress) => {
    const weights = {
      conversations: 0.4,
      forms: 0.3,
      data: 0.3
    };

    let conversationScore = 0;
    if (conversationProgress) {
      if (conversationProgress.hasUserInput) conversationScore += 30;
      if (conversationProgress.hasAgentResponse) conversationScore += 30;
      if (conversationProgress.hasCompletion) conversationScore += 40;
    }

    const finalConversationScore = milestone.requiresConversation ? conversationScore : 100;
    const finalFormScore = milestone.requiresForm ? formProgress : 100;
    const finalDataScore = milestone.requiresData ? dataProgress : 100;

    return Math.round(
      (finalConversationScore * weights.conversations) +
      (finalFormScore * weights.forms) +
      (finalDataScore * weights.data)
    );
  };

  const handleOnboardingState = (progress, userData) => {
    const result = {
      phase: { name: 'Getting Started', status: 'active' },
      actions: [],
      forms: []
    };

    if (!userData || Object.keys(userData).length === 0) {
      result.actions = [{
        type: 'form',
        description: 'Complete Basic Information',
        agents: ['shawn']
      }];
      result.forms = ['basicInfo'];
      return result;
    }

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

  // Progress and state management helpers
  const determineCurrentPhase = (funnel, progress) => {
    if (!funnel.phases?.length) return null;
    return funnel.phases.find(phase => {
      const phaseProgress = calculatePhaseProgress(phase, progress);
      return phaseProgress < 100;
    }) || funnel.phases[funnel.phases.length - 1];
  };

  const calculatePhaseProgress = (phase, progress) => {
    if (!phase.milestones?.length) return 0;
    const milestonesProgress = phase.milestones.map(name => 
      progress.milestones[name] || 0
    );
    return Math.round(
      milestonesProgress.reduce((sum, p) => sum + p, 0) / phase.milestones.length
    );
  };

  const determineNextActions = async (phase, funnel, userData, progress) => {
    if (!phase || !funnel) return [];

    const actions = [];
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

    if (phase.actions) {
      const phaseActions = phase.actions.filter(action => 
        !progress.milestones[action.milestone]?.completed
      );
      actions.push(...phaseActions);
    }

    return actions;
  };

  // Validation helpers
  const validateDependencies = (funnel) => {
    if (!funnel.dependencies?.length) {
      return { isValid: true, missing: [] };
    }

    const missing = funnel.dependencies.filter(dep => {
      const dependencyData = funnelData?.find(f => f.funnelName === dep);
      return !dependencyData || dependencyData.progress.overall < 100;
    });

    return {
      isValid: missing.length === 0,
      missing
    };
  };

  const validatePrerequisites = (phase) => {
    if (!phase.prerequisites?.length) {
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

  // Return hook data and functions
  return {
    // Core state
    currentPhase,
    nextActions,
    requiredForms,
    progressDetails,
    loading,
    error,

    // Analysis functions
    getDetailedAnalysis: async () => {
      if (!progressDetails || !currentPhase) return null;
      const validations = {
        dependencies: validateDependencies(funnel),
        prerequisites: validatePrerequisites(currentPhase)
      };
      return {
        currentStatus: { phase: currentPhase, progress: progressDetails, actions: nextActions },
        validation: validations,
        insights: {
          completedMilestones: Object.entries(progressDetails.milestones)
            .filter(([_, progress]) => progress === 100)
            .map(([name]) => name),
          blockers: [
            ...(!validations.dependencies.isValid ? [{
              type: 'dependency',
              items: validations.dependencies.missing
            }] : []),
            ...(!validations.prerequisites.isValid ? [{
              type: 'prerequisite',
              items: validations.prerequisites.missing
            }] : [])
          ]
        }
      };
    },

    // Status helpers
    isComplete: progressDetails?.overall === 100,
    isBlocked: !validateDependencies(funnel).isValid || 
               (currentPhase && !validatePrerequisites(currentPhase).isValid),
    canProgress: !loading && !error && progressDetails?.overall < 100
  };
};

export default useFunnelProgression;