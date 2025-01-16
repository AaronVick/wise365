// pages/admin/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { 
  Bot, 
  MessageCircle,
  Settings,
  ArrowLeft,
  Home
} from 'lucide-react';

const debug = (area, message, data = '') => {
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? JSON.stringify(data) : '');
};

// Simple placeholder component to verify UI component loading
const PlaceholderCard = ({ children }) => {
  debug('UI', 'Rendering PlaceholderCard');
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {children}
    </div>
  );
};

const AdminDashboard = () => {
  debug('Init', 'Starting dashboard initialization');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Only include agent management features initially
  const navigation = {
    agentManagement: [
      { 
        name: 'Manage Agents', 
        icon: Bot, 
        description: 'Create and configure AI agents',
        path: 'manage'
      },
      { 
        name: 'Chat Interface', 
        icon: MessageCircle, 
        description: 'Test and monitor agent conversations',
        path: 'chat'
      }
    ]
  };

  // Fetch initial dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      debug('Firebase', 'Starting dashboard data fetch');
      try {
        setIsLoading(true);

        // Check if collections exist first
        const collections = ['agents', 'conversations'];
        const data = {};

        for (const collectionName of collections) {
          debug('Firebase', `Checking collection: ${collectionName}`);
          try {
            const snapshot = await getDocs(collection(db, collectionName));
            data[collectionName] = {
              exists: true,
              count: snapshot.size
            };
            debug('Firebase', `Collection ${collectionName} found`, data[collectionName]);
          } catch (e) {
            debug('Firebase', `Collection ${collectionName} not found or error`, e.message);
            data[collectionName] = {
              exists: false,
              count: 0
            };
          }
        }

        setDashboardData(data);
        debug('Firebase', 'Dashboard data fetch complete', data);
      } catch (err) {
        debug('Error', 'Dashboard data fetch failed', err.message);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle navigation with logging
  const handleNavigation = (view) => {
    debug('Navigation', `Navigating to: ${view}`);
    setCurrentView(view);
  };

  // Render agent management card
  const renderAgentCard = (item) => {
    debug('Render', `Rendering agent card: ${item.name}`);
    return (
      <Card key={item.name} className="p-4">
        <div className="flex items-center mb-4">
          <item.icon className="h-5 w-5 mr-2" />
          <h3 className="font-medium">{item.name}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{item.description}</p>
        <Button 
          className="w-full"
          onClick={() => handleNavigation(item.path)}
        >
          Access
        </Button>
      </Card>
    );
  };

  // Main content render
  const renderContent = () => {
    debug('Render', 'Rendering main content', { view: currentView });

    if (isLoading) {
      return (
        <PlaceholderCard>
          <p className="text-center">Loading dashboard data...</p>
        </PlaceholderCard>
      );
    }

    if (error) {
      return (
        <PlaceholderCard>
          <p className="text-red-500">{error}</p>
        </PlaceholderCard>
      );
    }

    if (currentView === 'dashboard') {
      return (
        <div className="space-y-6">
          {/* Basic Stats */}
          <div className="grid grid-cols-2 gap-4">
            <PlaceholderCard>
              <h3 className="font-medium mb-2">Agents</h3>
              <p className="text-2xl font-bold">
                {dashboardData?.agents?.count || 0}
              </p>
            </PlaceholderCard>
            <PlaceholderCard>
              <h3 className="font-medium mb-2">Conversations</h3>
              <p className="text-2xl font-bold">
                {dashboardData?.conversations?.count || 0}
              </p>
            </PlaceholderCard>
          </div>

          {/* Agent Management Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {navigation.agentManagement.map(renderAgentCard)}
          </div>
        </div>
      );
    }

    // For other views, we'll implement them progressively
    return (
      <PlaceholderCard>
        <p>View not implemented yet: {currentView}</p>
        <Button 
          className="mt-4"
          onClick={() => handleNavigation('dashboard')}
        >
          Back to Dashboard
        </Button>
      </PlaceholderCard>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {currentView !== 'dashboard' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigation('dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigation('dashboard')}
        >
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {currentView === 'dashboard' ? 'Agent Management' : currentView}
        </h1>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;