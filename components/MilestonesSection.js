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
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

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

        // Fetch user's funnel data
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
          const onboardingFunnel = funnelsData.find(funnel => 
            funnel.name === 'Onboarding Funnel' && 
            Array.isArray(funnel.milestones)
          );

          if (onboardingFunnel) {
            processedMilestones = onboardingFunnel.milestones.map(milestone => ({
              ...milestone,
              funnelName: onboardingFunnel.name,
              progress: 0,
              status: 'ready',
              priority: onboardingFunnel.priority || 1
            }));
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

    fetchMilestones();
  }, [currentUser?.uid]);

  const processMilestones = (funnels, userData) => {
    try {
      if (!Array.isArray(funnels)) return [];

      return funnels.flatMap(funnel => {
        if (!Array.isArray(funnel.milestones)) return [];

        return funnel.milestones.map(milestone => {
          if (!milestone || typeof milestone !== 'object') return null;

          const progress = calculateMilestoneProgress(milestone, userData);
          const status = determineStatus(progress);

          return {
            ...milestone,
            funnelName: funnel.name || 'Unknown Funnel',
            progress,
            status,
            priority: funnel.priority || 1,
            conversationId: milestone.conversationId || `milestone-${milestone.name}`
          };
        }).filter(Boolean);
      }).filter(milestone => milestone.status !== 'not_ready');
    } catch (error) {
      console.error('Error processing milestones:', error);
      return [];
    }
  };

  const calculateMilestoneProgress = (milestone, userData) => {
    if (!userData || !Array.isArray(userData) || !milestone) return 0;

    try {
      const relevantData = userData.filter(data => {
        const hasConversation = data.conversationId === milestone.conversationId;
        const hasProgress = typeof data.progress === 'number';
        return hasConversation && hasProgress;
      });

      if (relevantData.length === 0) return 0;

      // Calculate average progress if multiple entries exist
      const totalProgress = relevantData.reduce((sum, data) => sum + data.progress, 0);
      return Math.round(totalProgress / relevantData.length);
    } catch (error) {
      console.error('Error calculating milestone progress:', error);
      return 0;
    }
  };

  const determineStatus = (progress) => {
    if (progress === 0) return 'ready';
    if (progress === 100) return 'completed';
    return 'in_progress';
  };

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
        <MilestoneCard 
          key={`${milestone.funnelName}-${milestone.name}`} 
          milestone={milestone}
          currentUser={currentUser}
          funnelData={userData} 
        />
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