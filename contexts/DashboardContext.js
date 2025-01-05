// contexts/DashboardContext.js
import { createContext, useContext, useState } from 'react';

export const DashboardContext = createContext();

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

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}



export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}