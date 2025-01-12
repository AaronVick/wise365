// components/MilestonesSection.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import MilestoneCard from './MilestoneCard';
import MilestoneFilters from './MilestoneFilters';

const MilestonesSection = ({ currentUser }) => {
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'ready', 'in_progress', 'completed'

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const funnelsRef = collection(db, 'funnels');
        const funnelsSnapshot = await getDocs(funnelsRef);
        const funnelsData = funnelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const funnelDataRef = collection(db, 'funnelData');
        const funnelDataQuery = query(
          funnelDataRef,
          where('userId', '==', currentUser.uid)
        );
        const funnelDataSnapshot = await getDocs(funnelDataQuery);
        const userData = funnelDataSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        let processedMilestones = processMilestones(funnelsData, userData);

        // Default to Onboarding Funnel if no milestones started
        if (processedMilestones.length === 0) {
          const onboardingFunnel = funnelsData.find(funnel => funnel.name === 'Onboarding Funnel');
          processedMilestones = onboardingFunnel.milestones.map(milestone => ({
            ...milestone,
            funnelName: onboardingFunnel.name,
            progress: 0,
            status: 'ready',
            priority: onboardingFunnel.priority
          }));
        }

        setMilestones(processedMilestones);
        applyFilter(processedMilestones, activeFilter);
      } catch (error) {
        console.error('Error fetching milestones:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.uid) {
      fetchMilestones();
    }
  }, [currentUser]);

  const processMilestones = (funnels, userData) => {
    return funnels.flatMap(funnel =>
      funnel.milestones.map(milestone => {
        const progress = calculateMilestoneProgress(milestone, userData);
        const status = determineStatus(progress);

        return {
          ...milestone,
          funnelName: funnel.name,
          progress,
          status,
          priority: funnel.priority
        };
      })
    ).filter(milestone => milestone.status !== 'not_ready');
  };

  const calculateMilestoneProgress = (milestone, userData) => {
    if (!userData || userData.length === 0) return 0;

    const relevantData = userData.filter(data => data.conversationId === milestone.conversationId);
    return relevantData.length > 0 ? 100 : 0; // Example logic, adjust based on real criteria
  };

  const determineStatus = (progress) => {
    if (progress === 0) return 'ready';
    if (progress === 100) return 'completed';
    return 'in_progress';
  };

  const applyFilter = (milestones, filter) => {
    if (filter === 'all') {
      setFilteredMilestones(milestones);
    } else {
      setFilteredMilestones(milestones.filter(milestone => milestone.status === filter));
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilter(milestones, filter);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Milestones</h2>
        <MilestoneFilters 
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>
      <div className="space-y-4">
        {filteredMilestones.map((milestone) => (
          <MilestoneCard key={`${milestone.funnelName}-${milestone.name}`} milestone={milestone} />
        ))}
        {filteredMilestones.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No milestones found for the selected filter.
          </div>
        )}
      </div>
    </Card>
  );
};

export default MilestonesSection;
