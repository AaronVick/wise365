// contexts/DashboardContext.js
import { createContext, useContext, useState } from 'react';

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
  setShowGoalModal: () => {}
};

export const DashboardContext = createContext(defaultContextValue);

export function DashboardProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goals, setGoals] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showGoalModal, setShowGoalModal] = useState(false);

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