// pages/admin/index.js

import React, { useState, useEffect } from 'react';
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

// Debug helper
const debug = (message, data = '') => {
  console.log(`[Admin Dashboard] ${message}`, data);
};

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Admin Dashboard Error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600">{this.state.error?.message}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load components with error handling
const loadComponent = async (name) => {
  debug(`Loading component: ${name}`);
  try {
    const component = await import(`./${name.toLowerCase()}`);
    debug(`Successfully loaded component: ${name}`);
    return component.default;
  } catch (error) {
    console.error(`Error loading component ${name}:`, error);
    return null;
  }
};

const AdminDashboard = () => {
  debug('Rendering AdminDashboard');

  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [loadedComponents, setLoadedComponents] = useState({});
  const [error, setError] = useState(null);

  // Track current view changes
  useEffect(() => {
    debug('Current view changed to:', currentView);
  }, [currentView]);

  // Define navigation structure
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

  // Load component on view change
  useEffect(() => {
    if (currentView !== 'dashboard' && !loadedComponents[currentView]) {
      debug(`Loading component for view: ${currentView}`);
      
      const loadViewComponent = async () => {
        try {
          // Convert view name to component path (e.g., "Manage Agents" -> "manageagents")
          const componentPath = currentView.toLowerCase().replace(/\s+/g, '');
          const Component = await loadComponent(componentPath);
          
          if (Component) {
            setLoadedComponents(prev => ({
              ...prev,
              [currentView]: Component
            }));
            debug(`Component loaded successfully: ${currentView}`);
          } else {
            throw new Error(`Failed to load component: ${currentView}`);
          }
        } catch (err) {
          console.error('Error loading component:', err);
          setError(`Failed to load ${currentView}. Please try again.`);
        }
      };

      loadViewComponent();
    }
  }, [currentView, loadedComponents]);

  const renderNavigationCard = (item) => {
    debug(`Rendering navigation card for: ${item.name}`);
    
    if (!item?.name) {
      console.warn('Invalid navigation item:', item);
      return null;
    }

    const IconComponent = item.icon || Settings;

    return (
      <Card key={item.name} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </div>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => {
              debug(`Navigation clicked: ${item.name}`);
              setCurrentView(item.name);
            }}
          >
            Access
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderDashboard = () => {
    debug('Rendering dashboard view');
    
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Management</TabsTrigger>
          <TabsTrigger value="system">System Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Key metrics and status</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-4">
                    <div className="text-sm">New tenant onboarded: Acme Corp</div>
                    <div className="text-sm">Agent configuration updated: Support Bot</div>
                    <div className="text-sm">System backup completed</div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigation.agentManagement.map(renderNavigationCard)}
        </TabsContent>

        <TabsContent value="system" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigation.systemManagement.map(renderNavigationCard)}
        </TabsContent>
      </Tabs>
    );
  };

  const renderComponent = () => {
    if (currentView === 'dashboard') {
      return renderDashboard();
    }

    const Component = loadedComponents[currentView];
    
    if (!Component) {
      debug(`No component found for view: ${currentView}`);
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading component...</p>
        </div>
      );
    }

    debug(`Rendering component for: ${currentView}`);
    return <ErrorBoundary><Component /></ErrorBoundary>;
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => {
            setError(null);
            setCurrentView('dashboard');
          }}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Persistent Header with Home Button */}
      <div className="flex items-center gap-4 mb-8">
        {currentView !== 'dashboard' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              debug('Back button clicked');
              setCurrentView('dashboard');
            }}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            debug('Home button clicked');
            setCurrentView('dashboard');
          }}
        >
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {currentView === 'dashboard' ? 'Admin Dashboard' : currentView}
        </h1>
      </div>

      {/* Main Content */}
      {renderComponent()}
    </div>
  );
};

export default AdminDashboard;