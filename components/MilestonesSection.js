// components/MilestonesSection.js

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from '@/components/ui/card';
import MilestoneCard from './MilestoneCard';
import MilestoneFilters from './MilestoneFilters';
import { evaluateUserFunnels, updateMilestoneStatus } from './funnelEvaluator';

const MilestonesSection = ({ currentUser }) => {
  const [milestones, setMilestones] = useState([]);
  const [filteredMilestones, setFilteredMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userData, setUserData] = useState(null);

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

        // Sort milestones by priority and status
        processedMilestones.sort((a, b) => {
          // First sort by priority
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Then sort by status (in_progress first, then ready, then completed)
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
        {filteredMilestones.length > 0 ? (
          filteredMilestones.map((milestone) => (
            <MilestoneCard 
              key={`${milestone.funnelName}-${milestone.name}`} 
              milestone={milestone}
              currentUser={currentUser}
              funnelData={userData}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeFilter === 'all' 
                ? 'No milestones available. Starting with onboarding...'
                : `No ${activeFilter} milestones found.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MilestonesSection;