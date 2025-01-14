// components/MilestonesSection.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import MilestoneCard from './MilestoneCard';
import MilestoneFilters from './MilestoneFilters';
import FunnelActionInterface from './FunnelActionInterface';
import { useProgressAnalyzer } from './ProgressAnalyzer';
import { evaluateUserFunnels, updateMilestoneStatus } from './funnelEvaluator';
import { Loader2 } from 'lucide-react';

const MilestonesSection = ({ 
  currentUser,
  setCurrentChat // Add this prop for handling chat navigation
}) => {
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userData, setUserData] = useState(null);
  const [activeFunnel, setActiveFunnel] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Use progress analyzer for the selected milestone
  const { 
    analysis: milestoneAnalysis, 
    loading: analysisLoading 
  } = useProgressAnalyzer(
    currentUser,
    activeFunnel,
    selectedMilestone
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const fetchMilestones = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch funnels data
        const funnelsRef = collection(db, 'funnels');
        const funnelsSnapshot = await getDocs(funnelsRef);
        const funnelsData = funnelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (!Array.isArray(funnelsData) || funnelsData.length === 0) {
          throw new Error('No funnel data available');
        }

        // Fetch user's funnel data if it exists
        const funnelDataRef = collection(db, 'funnelData');
        const funnelDataQuery = query(
          funnelDataRef,
          where('userId', '==', currentUser.uid)
        );
        const funnelDataSnapshot = await getDocs(funnelDataQuery);
        const userFunnelData = funnelDataSnapshot.docs[0]?.data() || {};
        setUserData(userFunnelData);

        // Evaluate available funnels and their milestones
        const { inProgress, ready, completed } = evaluateUserFunnels(
          funnelsData,
          currentUser,
          userFunnelData
        );

        // Combine and process milestones
        let processedMilestones = [
          ...inProgress.flatMap(f => f.milestones),
          ...ready.flatMap(f => f.milestones),
          ...completed.flatMap(f => f.milestones)
        ].map(milestone => updateMilestoneStatus(milestone, userFunnelData));

        // Handle new user case with onboarding
        if (processedMilestones.length === 0) {
          const onboardingFunnel = funnelsData.find(funnel => 
            funnel.name === 'Onboarding Funnel' && 
            Array.isArray(funnel.milestones)
          );

          if (onboardingFunnel) {
            setActiveFunnel(onboardingFunnel);
            processedMilestones = onboardingFunnel.milestones.map(milestone => ({
              ...milestone,
              funnelName: onboardingFunnel.name,
              progress: 0,
              status: 'ready',
              priority: onboardingFunnel.priority || 1,
              conversationId: milestone.conversationId || `milestone-${milestone.name}`
            }));
            // Set the first milestone as selected for new users
            setSelectedMilestone(processedMilestones[0]);
          }
        }

        // Sort milestones
        processedMilestones.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          const statusOrder = { in_progress: 0, ready: 1, completed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        });

        setMilestones(processedMilestones);
        applyFilter(processedMilestones, activeFilter);
      } catch (error) {
        console.error('Error fetching milestones:', error);
        setError(error.message || 'Failed to load milestones');
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [currentUser?.uid]);

  const applyFilter = (milestones, filter) => {
    if (!Array.isArray(milestones)) {
      setFilteredMilestones([]);
      return;
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
    const funnelsRef = collection(db, 'funnels');
    const funnelQuery = query(
      funnelsRef,
      where('name', '==', milestone.funnelName)
    );
    const funnelSnapshot = await getDocs(funnelQuery);
    const funnel = funnelSnapshot.docs[0]?.data();
    
    if (funnel) {
      setActiveFunnel(funnel);
    }
  };

  // Handle completion of funnel actions
  const handleActionComplete = async (actionResult) => {
    // Refresh milestones after action completion
    const updatedMilestones = milestones.map(m => {
      if (m.name === selectedMilestone.name) {
        return {
          ...m,
          progress: actionResult.progress || m.progress,
          status: actionResult.status || m.status
        };
      }
      return m;
    });

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


  if (processedMilestones.length === 0) {
    console.log('No processed milestones, checking onboarding');
    const onboardingFunnel = funnelsData.find(funnel => 
      funnel.name === 'Onboarding Funnel' && 
      Array.isArray(funnel.milestones)
    );
  
    if (onboardingFunnel) {
      console.log('Found onboarding funnel:', onboardingFunnel);
      processedMilestones = onboardingFunnel.milestones.map(milestone => ({
        ...milestone,
        funnelName: onboardingFunnel.name,
        progress: 0,
        status: 'ready',
        priority: onboardingFunnel.priority || 1,
        conversationId: milestone.conversationId || `milestone-${milestone.name}`
      }));
      console.log('Processed onboarding milestones:', processedMilestones);
    }
  }

  return (
    <div className="space-y-6">
      {/* Milestones Overview */}
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
          {filteredMilestones.length > 0 ? (
            filteredMilestones.map((milestone) => (
              <MilestoneCard 
                key={`${milestone.funnelName}-${milestone.name}`} 
                milestone={milestone}
                currentUser={currentUser}
                funnelData={userData}
                onClick={() => handleMilestoneClick(milestone)}
                isSelected={selectedMilestone?.name === milestone.name}
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

      {/* Active Funnel Interface */}
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