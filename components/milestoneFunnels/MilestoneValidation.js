// components/MilestoneValidation.js

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

const MilestoneValidation = ({ currentUser, funnelData, milestone }) => {
  const [validationState, setValidationState] = useState({
    isReady: false,
    nextSteps: [],
    blockers: [],
    dependencies: []
  });

  // Validate milestone requirements and dependencies
  const validateMilestoneReadiness = (milestone, funnelData, userData) => {
    const validationResults = {
      isReady: true,
      nextSteps: [],
      blockers: [],
      dependencies: []
    };

    try {
      // Check if this is first-time user (should start with Onboarding)
      if (!userData || Object.keys(userData).length === 0) {
        if (milestone.funnelName !== 'Onboarding Funnel') {
          validationResults.isReady = false;
          validationResults.blockers.push('Complete onboarding first');
          return validationResults;
        }
      }

      // Validate dependencies
      if (milestone.dependencies?.length > 0) {
        milestone.dependencies.forEach(dep => {
          const dependencyComplete = checkDependencyCompletion(dep, userData);
          if (!dependencyComplete) {
            validationResults.isReady = false;
            validationResults.dependencies.push(dep);
          }
        });
      }

      // Validate entry criteria
      if (milestone.entryCriteria) {
        // Check MSW score if required
        if (milestone.entryCriteria.mswScore) {
          const userMswScore = userData?.mswScore;
          if (!userMswScore || !isMswScoreValid(userMswScore, milestone.entryCriteria.mswScore)) {
            validationResults.isReady = false;
            validationResults.blockers.push('Required MSW score not met');
          }
        }

        // Check reported challenges
        if (milestone.entryCriteria.reportedChallenges?.length > 0) {
          const userChallenges = userData?.reportedChallenges || [];
          const hasRequiredChallenge = milestone.entryCriteria.reportedChallenges
            .some(challenge => userChallenges.includes(challenge));
          
          if (!hasRequiredChallenge) {
            validationResults.isReady = false;
            validationResults.blockers.push('Required challenges not reported');
          }
        }
      }

      // Check required forms
      if (milestone.formsNeeded?.length > 0) {
        milestone.formsNeeded.forEach(form => {
          if (!checkFormCompletion(form, userData)) {
            validationResults.isReady = false;
            validationResults.nextSteps.push(`Complete ${form}`);
          }
        });
      }

      // Validate data path requirements
      if (milestone.dataPath) {
        const hasRequiredData = checkDataPathValue(milestone.dataPath, userData);
        if (!hasRequiredData) {
          validationResults.isReady = false;
          validationResults.nextSteps.push('Required data missing');
        }
      }

    } catch (error) {
      console.error('Validation error:', error);
      validationResults.isReady = false;
      validationResults.blockers.push('Error validating milestone requirements');
    }

    return validationResults;
  };

  // Helper function to check dependency completion
  const checkDependencyCompletion = (dependencyName, userData) => {
    const dependencyFunnel = userData?.funnels?.[dependencyName];
    return dependencyFunnel?.completed || false;
  };

  // Helper function to validate MSW score
  const isMswScoreValid = (userScore, requiredScore) => {
    if (typeof requiredScore === 'string' && requiredScore.includes('-')) {
      const [min, max] = requiredScore.split('-').map(Number);
      return userScore >= min && userScore <= max;
    }
    return userScore >= Number(requiredScore);
  };

  // Helper function to check form completion
  const checkFormCompletion = (formName, userData) => {
    return userData?.completedForms?.includes(formName) || false;
  };

  // Helper function to check data path value
  const checkDataPathValue = (dataPath, userData) => {
    const paths = dataPath.split('.');
    let current = userData;
    
    for (const path of paths) {
      if (!current || !current[path]) return false;
      current = current[path];
    }
    
    return true;
  };

  useEffect(() => {
    if (milestone && currentUser) {
      const validation = validateMilestoneReadiness(milestone, funnelData, currentUser);
      setValidationState(validation);
    }
  }, [milestone, funnelData, currentUser]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Milestone Status</h3>
        <span className={`px-2 py-1 rounded-full text-xs ${
          validationState.isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {validationState.isReady ? 'Ready' : 'Pending Requirements'}
        </span>
      </div>

      {/* Display validation results */}
      {!validationState.isReady && (
        <div className="space-y-2">
          {validationState.blockers.length > 0 && (
            <div className="text-sm">
              <p className="font-medium text-red-600">Blockers:</p>
              <ul className="list-disc pl-4">
                {validationState.blockers.map((blocker, idx) => (
                  <li key={idx} className="text-red-600">{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          {validationState.dependencies.length > 0 && (
            <div className="text-sm">
              <p className="font-medium text-orange-600">Required Dependencies:</p>
              <ul className="list-disc pl-4">
                {validationState.dependencies.map((dep, idx) => (
                  <li key={idx} className="text-orange-600">{dep}</li>
                ))}
              </ul>
            </div>
          )}

          {validationState.nextSteps.length > 0 && (
            <div className="text-sm">
              <p className="font-medium text-blue-600">Next Steps:</p>
              <ul className="list-disc pl-4">
                {validationState.nextSteps.map((step, idx) => (
                  <li key={idx} className="text-blue-600">{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default MilestoneValidation;