// pages/admin/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { 
  Bot, 
  MessageCircle, 
  BookOpen, 
  BarChart3, 
  Code,
  Home,
  ArrowLeft,
  Users,
  Settings,
  Receipt,
  ClipboardList,
  LineChart
} from 'lucide-react';

// Lazy load components with error boundaries
const DynamicComponent = ({ importFunc, loadingText = 'Loading...' }) => {
  const Component = dynamic(importFunc, {
    ssr: false,
    loading: () => (
      <div className="p-4 text-center">
        <p>{loadingText}</p>
      </div>
    )
  });
  
  return (
    <ErrorBoundary
      fallback={<div className="p-4 text-red-500">Error loading component</div>}
    >
      <Component />
    </ErrorBoundary>
  );
};

const ManageAgents = () => (
  <DynamicComponent importFunc={() => import('./manage')} />
);

// Dynamic imports remain the same
const Chat = dynamic(() => import('./chat'), { ssr: false });
const Training = dynamic(() => import('./training'), { ssr: false });
const Prompts = dynamic(() => import('./prompts'), { ssr: false });
const AgentStats = dynamic(() => import('./agentStats'), { ssr: false });
const AdminManagement = dynamic(() => import('./adminManagement'), { ssr: false });
const UsageStats = dynamic(() => import('./usageStats'), { ssr: false });
const BillingManagement = dynamic(() => import('./billingManagement'), { ssr: false });
const AuditLogs = dynamic(() => import('./auditLogs'), { ssr: false });
const TenantManagement = dynamic(() => import('./tenantManagement'), { ssr: false });

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalConversations: 0,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsSnap, usersSnap, conversationsSnap] = await Promise.all([
          getDocs(collection(db, 'agents')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'conversations'))
        ]);

        setStats({
          totalAgents: agentsSnap.size,
          totalUsers: usersSnap.size,
          totalConversations: conversationsSnap.size,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load dashboard statistics');
      }
    };

    fetchStats();
  }, []);

  const navigationSections = {
    // ... navigation sections remain the same ...
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderNavigationSection = (section) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
      <p className="text-gray-500 mb-4">{section.description}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {section.items.map((item) => (
          <div
            key={item.name}
            className="p-4 border border-gray-200 rounded-md shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-50 p-2 rounded-md mr-3">
                <item.icon size={24} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold">{item.name}</h3>
            </div>
            <p className="mb-4">{item.description}</p>
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors duration-200"
              onClick={() => handleNavigation(item.path)}
            >
              Access
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 border border-gray-200 rounded-md shadow-md">
              <p className="text-gray-600">Total Agents</p>
              <h2 className="text-2xl font-bold">{stats.totalAgents}</h2>
            </div>
            <div className="p-4 border border-gray-200 rounded-md shadow-md">
              <p className="text-gray-600">Active Users</p>
              <h2 className="text-2xl font-bold">{stats.totalUsers}</h2>
            </div>
            <div className="p-4 border border-gray-200 rounded-md shadow-md">
              <p className="text-gray-600">Total Conversations</p>
              <h2 className="text-2xl font-bold">{stats.totalConversations}</h2>
            </div>
          </div>
          {renderNavigationSection(navigationSections.agentManagement)}
          {renderNavigationSection(navigationSections.systemManagement)}
        </>
      );
    }

    const selectedItem = [
      ...navigationSections.agentManagement.items,
      ...navigationSections.systemManagement.items,
    ].find((item) => item.path === currentView);

    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return <Component />;
    }

    return <p>Page not found</p>;
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-sm font-semibold text-red-600">Error</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        {currentView !== 'dashboard' && (
          <button
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={() => handleNavigation('dashboard')}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold">
          {currentView === 'dashboard' ? 'Admin Dashboard' : 
           navigationSections.agentManagement.items.find((item) => item.path === currentView)?.name || 'Not Found'}
        </h1>
      </div>
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;