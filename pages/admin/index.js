// pages/admin/index.js
import React, { useState, Suspense } from 'react';
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
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? data : '');
};

// Separate Navigation Card Component
const NavigationCard = ({ item, onNavigate }) => {
  if (!item?.name) {
    debug('NavigationCard', 'Invalid item props');
    return null;
  }

  const IconComponent = item.icon || Settings;

  return (
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
          onClick={() => {
            debug('NavigationCard', `Click: ${item.name}`);
            if (onNavigate) onNavigate(item.name);
          }}
        >
          Access
        </Button>
      </CardContent>
    </Card>
  );
};

// Overview Card Component
const OverviewCard = ({ title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const AdminDashboard = () => {
  debug('Init', 'Initializing AdminDashboard');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  // Navigation Structure
  const navigation = {
    agentManagement: [
      { name: 'Manage Agents', icon: Bot, description: 'Create and configure AI agents' },
      { name: 'Training', icon: BookOpen, description: 'Train and fine-tune agent models' },
      { name: 'Prompts', icon: Code, description: 'Manage agent prompts and behaviors' },
      { name: 'Chat Interface', icon: MessageCircle, description: 'Test and monitor agent conversations' },
      { name: 'Agent Stats', icon: BarChart3, description: 'View agent performance metrics' }
    ],
    systemManagement: [
      { name: 'Usage Statistics', icon: BarChart3, description: 'System-wide usage metrics' },
      { name: 'Tenant Management', icon: Building2, description: 'Manage organization tenants' },
      { name: 'Admin Management', icon: Users, description: 'Manage system administrators' },
      { name: 'Billing Management', icon: Receipt, description: 'Manage subscriptions and billing' },
      { name: 'Audit Logs', icon: ClipboardList, description: 'View system audit trails' },
      { name: 'System Settings', icon: Settings, description: 'Configure system-wide settings' }
    ]
  };

  const handleNavigation = (view) => {
    debug('Navigation', `Changing view to: ${view}`);
    setCurrentView(view);
  };

  const renderOverviewContent = () => (
    <div className="grid gap-6 md:grid-cols-2">
      <OverviewCard title="System Overview" description="Key metrics and status">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Active Tenants</span>
            <span className="font-semibold">23</span>
          </div>
          <div className="flex justify-between">
            <span>Total Agents</span>
            <span className="font-semibold">45</span>
          </div>
          <div className="flex justify-between">
            <span>Active Users</span>
            <span className="font-semibold">156</span>
          </div>
        </div>
      </OverviewCard>

      <OverviewCard title="Recent Activity" description="Latest system events">
        <ScrollArea className="h-48">
          <div className="space-y-4">
            <div className="text-sm">New tenant onboarded: Acme Corp</div>
            <div className="text-sm">Agent configuration updated: Support Bot</div>
            <div className="text-sm">System backup completed</div>
          </div>
        </ScrollArea>
      </OverviewCard>
    </div>
  );

  const renderDynamicComponent = () => {
    debug('Render', `Loading dynamic component for: ${currentView}`);
    
    const Component = React.lazy(() => 
      import(`./${currentView.toLowerCase().replace(/\s+/g, '')}`).catch(error => {
        debug('Error', `Failed to load component: ${currentView}`, error);
        return { default: () => <div>Error loading component</div> };
      })
    );

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <Component />
      </Suspense>
    );
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Management</TabsTrigger>
            <TabsTrigger value="system">System Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverviewContent()}
          </TabsContent>

          <TabsContent value="agents" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navigation.agentManagement.map((item) => (
              <NavigationCard 
                key={item.name}
                item={item}
                onNavigate={handleNavigation}
              />
            ))}
          </TabsContent>

          <TabsContent value="system" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navigation.systemManagement.map((item) => (
              <NavigationCard 
                key={item.name}
                item={item}
                onNavigate={handleNavigation}
              />
            ))}
          </TabsContent>
        </Tabs>
      );
    }

    return renderDynamicComponent();
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

      {renderContent()}
    </div>
  );
};

export default AdminDashboard;