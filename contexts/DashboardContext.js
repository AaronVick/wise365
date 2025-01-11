import { createContext, useContext, useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase'; // Ensure your Firebase configuration is correctly imported

const defaultContextValue = {
  isLoading: false,
  setIsLoading: () => {},
  error: null,
  setError: () => {},
  goals: [],
  setGoals: () => {},
  recentActivity: [],
  setRecentActivity: () => {},
  resources: [],
  setResources: () => {},
  showGoalModal: false,
  setShowGoalModal: () => {}
};

export const DashboardContext = createContext(defaultContextValue);

export function DashboardProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [resources, setResources] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Function to fetch resources
  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const resourcesRef = collection(db, 'resources');
      const querySnapshot = await getDocs(resourcesRef);
      const fetchedResources = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setResources(fetchedResources);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically load resources when the context is mounted
  useEffect(() => {
    fetchResources();
  }, []);

  const value = {
    isLoading,
    setIsLoading,
    error,
    setError,
    goals,
    setGoals,
    recentActivity,
    setRecentActivity,
    resources,
    setResources,
    showGoalModal,
    setShowGoalModal
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
