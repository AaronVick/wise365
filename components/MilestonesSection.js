// components/MilestonesSection.js

'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import MilestoneCard from './MilestoneCard';
import MilestoneFilters from './MilestoneFilters';
import FunnelActionInterface from './FunnelActionInterface';
import { useProgressAnalyzer } from './ProgressAnalyzer';
import { evaluateUserFunnels, updateMilestoneStatus } from './funnelEvaluator';
import { Loader2 } from 'lucide-react';

const MilestonesSection = ({ currentUser, setCurrentChat }) => {
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userData, setUserData] = useState(null);
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [funnelDefinitions, setFunnelDefinitions] = useState([]);

  // Get milestone analysis
  const { analysis: milestoneAnalysis, loading: analysisLoading } = useProgressAnalyzer(
    currentUser,
    activeFunnel,
    selectedMilestone
  );

  
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const fetchFunnelsAndProgress = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch funnel definitions first
        const funnelsRef = collection(db, 'funnels');
        const funnelsSnapshot = await getDocs(funnelsRef);
        const funnelsData = funnelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFunnelDefinitions(funnelsData);

        // Get base onboarding funnel
        const onboardingFunnel = funnelsData.find(f => 
          f.name.toLowerCase() === 'onboarding funnel'
        );

        // Fetch user's funnel data
        const funnelDataRef = collection(db, 'funnelData');
        const funnelDataQuery = query(
          funnelDataRef,
          where('userId', '==', currentUser.uid)
        );
        const funnelDataSnapshot = await getDocs(funnelDataQuery);
        const userFunnelData = funnelDataSnapshot.docs[0]?.data() || {};
        setUserData(userFunnelData);

        // Handle new user case - no funnel data yet
        if (!userFunnelData || Object.keys(userFunnelData).length === 0) {
          if (onboardingFunnel) {
            const onboardingMilestone = {
              name: onboardingFunnel.milestones[0]?.name || 'Getting Started',
              description: onboardingFunnel.milestones[0]?.description || 'Complete your initial business setup',
              status: 'ready',
              progress: 0,
              funnelName: 'Onboarding Funnel',
              priority: 1,
              id: onboardingFunnel.id
            };

            setMilestones([onboardingMilestone]);
            setFilteredMilestones([onboardingMilestone]);
            setSelectedMilestone(onboardingMilestone);
            setActiveFunnel(onboardingFunnel);
            setLoading(false);
            return;
          }
        }

        // Get all available funnels for the user
        const availableFunnels = await analyzeFunnelAvailability(
          funnelsData,
          userFunnelData
        );
        console.log('Available funnels:', availableFunnels);

        // Process milestones for all relevant funnels
        let processedMilestones = [];

        // 1. Always process onboarding first for new users
        const onboardingFunnel = funnelsData.find(f => 
          f.name.toLowerCase() === 'onboarding funnel'
        );
        if (onboardingFunnel && (!userFunnelData || !userFunnelData[onboardingFunnel.name]?.completed)) {
          processedMilestones.push(
            ...processFunnelMilestones(onboardingFunnel, userFunnelData, true)
          );
        }

        // 2. Process active funnels (those with progress data)
        const activeFunnels = funnelsData.filter(f => 
          userFunnelData[f.name] && 
          f.name.toLowerCase() !== 'onboarding funnel'
        );
        activeFunnels.forEach(funnel => {
          processedMilestones.push(
            ...processFunnelMilestones(funnel, userFunnelData, false)
          );
        });

        // 3. Process upcoming funnels (meet prerequisites but no progress yet)
        availableFunnels.upcoming.forEach(funnel => {
          const upcomingMilestones = processFunnelMilestones(funnel, userFunnelData, false);
          // Mark first milestone as ready, others as not_ready
          upcomingMilestones[0].status = 'ready';
          processedMilestones.push(...upcomingMilestones);
        });

        // Sort milestones by priority and status
        processedMilestones.sort((a, b) => {
          // First by priority
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Then by status (ready > in_progress > completed > not_ready)
          const statusOrder = { ready: 0, in_progress: 1, completed: 2, not_ready: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        console.log('Final processed milestones:', processedMilestones);

        // Set initial selected milestone for new users
        if (!selectedMilestone && processedMilestones.length > 0) {
          const firstMilestone = processedMilestones[0];
          setSelectedMilestone(firstMilestone);
          const associatedFunnel = funnelsData.find(f => f.name === firstMilestone.funnelName);
          if (associatedFunnel) {
            setActiveFunnel(associatedFunnel);
          }
        }

        setMilestones(processedMilestones);
        applyFilter(processedMilestones, activeFilter);

      } catch (error) {
        console.error('Error fetching milestones:', error);
        setError(error.message || 'Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };

    fetchFunnelsAndProgress();
  }, [currentUser?.uid, selectedMilestone]);


  
  const categorizeFunnels = (funnels, userFunnelData) => {
    const result = {
      active: [],
      upcoming: [],
      locked: []
    };
  
    if (!Array.isArray(funnels) || !userFunnelData) {
      console.warn('Invalid input to categorizeFunnels');
      return result;
    }
  
    funnels.forEach(funnel => {
      try {
        // Special handling for onboarding
        if (funnel?.name?.toLowerCase() === 'onboarding funnel') {
          if (!userFunnelData[funnel.name]?.completed) {
            result.active.push(funnel);
          }
          return;
        }
  
        const hasProgress = userFunnelData[funnel.name];
        const meetsAllCriteria = checkAllFunnelPrerequisites(funnel, userFunnelData);
  
        if (hasProgress) {
          result.active.push(funnel);
        } else if (meetsAllCriteria) {
          result.upcoming.push(funnel);
        } else {
          result.locked.push(funnel);
        }
      } catch (error) {
        console.error(`Error processing funnel ${funnel?.name}:`, error);
      }
    });
  
    return result;
  };
  
  

  
  const checkAllFunnelPrerequisites = (funnel, userFunnelData) => {
    // 1. Check dependencies
    const dependenciesMet = (funnel.dependencies || []).every(depName => {
      return userFunnelData[depName]?.completed === true;
    });
    if (!dependenciesMet) return false;
  
    // 2. Check MSW score requirements
    if (funnel.entryCriteria?.mswScore) {
      const userMswScore = userFunnelData.mswScore;
      if (!userMswScore) return false;
  
      if (funnel.entryCriteria.mswScore.includes('-')) {
        const [min, max] = funnel.entryCriteria.mswScore.split('-').map(Number);
        if (userMswScore < min || userMswScore > max) return false;
      } else {
        if (userMswScore < Number(funnel.entryCriteria.mswScore)) return false;
      }
    }
  
    // 3. Check reported challenges
    if (funnel.entryCriteria?.reportedChallenges?.length > 0) {
      const userChallenges = userFunnelData.reportedChallenges || [];
      const hasRequiredChallenge = funnel.entryCriteria.reportedChallenges
        .some(challenge => userChallenges.includes(challenge));
      if (!hasRequiredChallenge) return false;
    }
  
    // 4. Check required forms
    if (funnel.formsNeeded?.length > 0) {
      const completedForms = userFunnelData.completedForms || [];
      const hasAllRequiredForms = funnel.formsNeeded
        .every(form => completedForms.includes(form));
      if (!hasAllRequiredForms) return false;
    }
  
    return true;
  };



  const processFunnelMilestones = (funnel, userFunnelData, isOnboarding) => {
    return funnel.milestones.map((milestone, index) => ({
      ...milestone,
      funnelName: funnel.name,
      status: determineInitialStatus(funnel, milestone, userFunnelData, index, isOnboarding),
      progress: calculateProgress(funnel.name, milestone.name, userFunnelData),
      priority: determinePriority(funnel, milestone, index),
      responsibleAgents: funnel.responsibleAgents,
      formsNeeded: funnel.formsNeeded
    }));
  };

  const determineInitialStatus = (funnel, milestone, userData, index, isOnboarding) => {
    const funnelProgress = userData[funnel.name];
    if (!funnelProgress) {
      return isOnboarding || index === 0 ? 'ready' : 'not_ready';
    }
    const progress = funnelProgress.milestones?.[milestone.name]?.progress || 0;
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in_progress';
    return 'ready';
  };

  const calculateProgress = (funnelName, milestoneName, userData) => {
    return userData[funnelName]?.milestones?.[milestoneName]?.progress || 0;
  };

  const determinePriority = (funnel, milestone, index) => {
    if (funnel.name.toLowerCase() === 'onboarding funnel') return 1;
    return milestone.priority || funnel.priority || (index + 2);
  };

  const applyFilter = (milestones, filter) => {
  if (!Array.isArray(milestones)) {
    setFilteredMilestones([]);
    return;
  }

  // Always show onboarding milestone for new users
  const isNewUser = !userData || Object.keys(userData).length === 0;
  if (isNewUser) {
    const onboardingMilestone = milestones.find(m => 
      m.funnelName.toLowerCase() === 'onboarding funnel'
    );
    if (onboardingMilestone) {
      setFilteredMilestones([onboardingMilestone]);
      return;
    }
  }

  const filtered = filter === 'all' 
    ? milestones
    : milestones.filter(milestone => milestone.status === filter);
  
  setFilteredMilestones(filtered);
};



  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(milestones, filter);
  };

  const handleMilestoneClick = async (milestone) => {
    setSelectedMilestone(milestone);
    
    // Find the corresponding funnel
    const funnel = funnelDefinitions.find(f => f.name === milestone.funnelName);
    if (funnel) {
      setActiveFunnel(funnel);
    } else {
      console.error('Could not find funnel for milestone:', milestone.funnelName);
    }
  };

  const handleActionComplete = async (actionResult) => {
    // Update milestone progress
    const updatedMilestones = milestones.map(m => {
      if (m.name === selectedMilestone.name && m.funnelName === selectedMilestone.funnelName) {
        return {
          ...m,
          progress: actionResult.progress || m.progress,
          status: actionResult.status || m.status
        };
      }
      return m;
    });

    // If this completion unlocks new funnels, trigger a refresh
    if (actionResult.status === 'completed') {
      const funnel = funnelDefinitions.find(f => f.name === selectedMilestone.funnelName);
      if (funnel) {
        // Refresh available funnels
        const availableFunnels = await analyzeFunnelAvailability(
          funnelDefinitions,
          { ...userData, [funnel.name]: { completed: true } }
        );

        // Add any newly available funnels
        const newMilestones = availableFunnels.upcoming.flatMap(f => 
          processFunnelMilestones(f, userData, false)
        );

        updatedMilestones.push(...newMilestones);
      }
    }

    setMilestones(updatedMilestones);
    applyFilter(updatedMilestones, activeFilter);
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Milestones</h2>
          <MilestoneFilters 
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : filteredMilestones.length > 0 ? (
              filteredMilestones.map((milestone) => (
                <MilestoneCard 
                  key={`${milestone.funnelName}-${milestone.name}`} 
                  milestone={milestone}
                  currentUser={currentUser}
                  funnelData={userData}
                  onClick={() => handleMilestoneClick(milestone)}
                  isSelected={selectedMilestone?.name === milestone.name}
                  setCurrentChat={setCurrentChat}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No milestones available at this time.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {selectedMilestone && activeFunnel && (
        <Card className="p-6">
          <FunnelActionInterface
            funnel={activeFunnel}
            currentUser={currentUser}
            userData={userData}
            setCurrentChat={setCurrentChat}
            onActionComplete={handleActionComplete}
            milestone={selectedMilestone}
            analysis={milestoneAnalysis}
          />
        </Card>
      )}
    </div>
  );
};

export default MilestonesSection;