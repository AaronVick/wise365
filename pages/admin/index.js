// pages/admin/index.js
import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Settings, 
  Users, 
  Building2, 
  BarChart3, 
  Bot, 
  MessageCircle, 
  BookOpen, 
  Code, 
  ArrowLeft,
  Receipt,
  ClipboardList 
} from 'lucide-react';

const debug = (area, message, data = '') => {
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? JSON.stringify(data) : '');
};

// Navigation Card - Completely isolated component
const NavigationCard = dynamic(() => Promise.resolve(({ item, onNavigate }) => {
  debug('NavigationCard', 'Rendering card', { name: item?.name });
  
  if (!item?.name) {
    debug('NavigationCard', 'Invalid item, skipping render');
    return null;
  }

  const IconComponent = item.icon || Settings;
  
  return (
    <div className="relative">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </div>
          {item.description && (
            <CardDescription>{item.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              debug('NavigationCard', 'Navigation clicked', { name: item.name });
              if (onNavigate) onNavigate(item.name);
            }}
          >
            Access
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>,
  ssr: false
});

// Stats Card Component
const StatsCard = ({ title, value, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-between animate-pulse">
        <span className="bg-gray-200 h-4 w-24 rounded"></span>
        <span className="bg-gray-200 h-4 w-12 rounded"></span>
      </div>
    );
  }

  return (
    <div className="flex justify-between">
      <span>{title}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
};

const AdminDashboard = () => {
  debug('Init', 'Starting dashboard initialization');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Only define navigation items that are ready
  const navigation = {
    agentManagement: [
      { 
        name: 'Manage Agents', 
        icon: Bot, 
        description: 'Create and configure AI agents',
        ready: true
      }
      // Add other items only when their components are ready
    ],
    systemManagement: [
      { 
        name: 'Usage Statistics', 
        icon: BarChart3, 
        description: 'System-wide usage metrics',
        ready: true
      }
      // Add other items only when their components are ready
    ]
  };

  // Safe navigation handler
  const handleNavigation = async (view) => {
    debug('Navigation', 'Attempting navigation', { from: currentView, to: view });
    try {
      setIsLoading(true);
      
      // Validate the view exists before navigating
      const allItems = [
        ...navigation.agentManagement,
        ...navigation.systemManagement
      ];
      
      const targetItem = allItems.find(item => item.name === view && item.ready);
      
      if (!targetItem) {
        debug('Navigation', 'Invalid view requested', { view });
        return;
      }

      setCurrentView(view);
    } catch (error) {
      debug('Navigation', 'Navigation failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Overview content with loading states
  const renderOverviewContent = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key metrics and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <StatsCard 
              title="Active Tenants"
              value={stats?.tenants || '0'}
              loading={!stats}
            />
            <StatsCard 
              title="Total Agents"
              value={stats?.agents || '0'}
              loading={!stats}
            />
            <StatsCard 
              title="Active Users"
              value={stats?.users || '0'}
              loading={!stats}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-4">
              {/* Only show placeholder content until real data is available */}
              <div className="text-sm text-gray-500">No recent activity</div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  // Progressive content rendering
  const renderContent = () => {
    debug('Render', 'Rendering content', { view: currentView, tab: activeTab });

    if (currentView !== 'dashboard') {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Loading view...</p>
        </div>
      );
    }

    return (
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          debug('Tabs', 'Tab change', { from: activeTab, to: value });
          setActiveTab(value);
        }} 
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Management</TabsTrigger>
          <TabsTrigger value="system">System Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewContent()}
        </TabsContent>

        <TabsContent value="agents" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigation.agentManagement
            .filter(item => item.ready)
            .map((item) => (
              <NavigationCard 
                key={item.name}
                item={item}
                onNavigate={handleNavigation}
              />
            ))}
        </TabsContent>

        <TabsContent value="system" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigation.systemManagement
            .filter(item => item.ready)
            .map((item) => (
              <NavigationCard 
                key={item.name}
                item={item}
                onNavigate={handleNavigation}
              />
            ))}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="container mx-auto p-6">
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
          {currentView === 'dashboard' ? 'Admin Dashboard' : currentView}
        </h1>
      </div>

      <Suspense fallback={<div>Loading dashboard...</div>}>
        {renderContent()}
      </Suspense>
    </div>
  );
};

export default AdminDashboard;