import { createContext, useContext, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultContextValue = {
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
  goals: [],
  setGoals: () => {},
  recentActivity: [],
  setRecentActivity: () => {},
  showGoalModal: false,
  setShowGoalModal: () => {},
  fetchResources: () => Promise.resolve([]), // Default fetchResources to return an empty array
};

export const DashboardContext = createContext(defaultContextValue);

export function DashboardProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Fetch resources from the 'resources' collection in Firestore
  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const resourcesRef = collection(db, 'resources');
      const querySnapshot = await getDocs(resourcesRef);
      const resources = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIsLoading(false);
      return resources;
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError(error.message);
      setIsLoading(false);
      return [];
    }
  };

  const value = {
    isLoading,
    setIsLoading,
    error,
    setError,
    goals,
    setGoals,
    recentActivity,
    setRecentActivity,
    showGoalModal,
    setShowGoalModal,
    fetchResources, // Add fetchResources to the context
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    console.warn('useDashboard must be used within a DashboardProvider');
    return defaultContextValue;
  }
  return context;
}
