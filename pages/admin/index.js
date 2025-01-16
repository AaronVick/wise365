// pages/admin/index.js
import React, { useState, useEffect, Suspense } from 'react';
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
const debug = (area, message, data = '') => {
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? data : '');
};

// Lazy load all components
const AdminManagement = React.lazy(() => {
  debug('Lazy Load', 'Loading AdminManagement');
  return import('./adminManagement').catch(e => {
    debug('Error', 'Failed to load AdminManagement', e);
    return { default: () => <div>Error loading Admin Management</div> };
  });
});

const AgentStats = React.lazy(() => {
  debug('Lazy Load', 'Loading AgentStats');
  return import('./agentStats').catch(e => {
    debug('Error', 'Failed to load AgentStats', e);
    return { default: () => <div>Error loading Agent Stats</div> };
  });
});

// ... Similarly for other components
const AuditLogs = React.lazy(() => import('./auditLogs'));
const BillingManagement = React.lazy(() => import('./billingManagement'));
const TenantManagement = React.lazy(() => import('./tenantManagement'));
const UsageStats = React.lazy(() => import('./usageStats'));

// Loading component
const LoadingComponent = () => (
  <div className="flex justify-center items-center h-48">
    <p className="text-gray-500">Loading...</p>
  </div>
);

const AdminDashboard = () => {
  debug('Render', 'Starting AdminDashboard render');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    debug('Effect', 'Current view changed to:', currentView);
  }, [currentView]);

  useEffect(() => {
    debug('Effect', 'Active tab changed to:', activeTab);
  }, [activeTab]);

  // Navigation structure
  const navigation = {
    agentManagement: [
      { name: 'Admin Management', icon: Users, component: AdminManagement },
      { name: 'Agent Stats', icon: BarChart3, component: AgentStats }
      // Add other agent management items as needed
    ],
    systemManagement: [
      { name: 'Usage Statistics', icon: BarChart3, component: UsageStats },
      { name: 'Tenant Management', icon: Building2, component: TenantManagement },
      { name: 'Billing Management', icon: Receipt, component: BillingManagement },
      { name: 'Audit Logs', icon: ClipboardList, component: AuditLogs },
      { name: 'System Settings', icon: Settings, component: null }
    ]
  };

  const renderNavigationCard = (item) => {
    debug('Render', `Rendering navigation card for: ${item.name}`);
    
    if (!item?.name) {
      debug('Error', 'Invalid navigation item:', item);
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
              debug('Action', `Navigation clicked: ${item.name}`);
              setCurrentView(item.name);
            }}
          >
            Access
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderDashboardContent = () => {
    debug('Render', 'Rendering dashboard content');
    
    return (
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          debug('Action', `Tab changed to: ${value}`);
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
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Stats Card */}
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

            {/* Recent Activity Card */}
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
          {navigation.agentManagement.map((item) => {
            debug('Render', `Rendering agent management card: ${item.name}`);
            return renderNavigationCard(item);
          })}
        </TabsContent>

        <TabsContent value="system" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navigation.systemManagement.map((item) => {
            debug('Render', `Rendering system management card: ${item.name}`);
            return renderNavigationCard(item);
          })}
        </TabsContent>
      </Tabs>
    );
  };

  const renderComponent = () => {
    debug('Render', `Rendering component for view: ${currentView}`);

    if (currentView === 'dashboard') {
      return renderDashboardContent();
    }

    // Find the component to render
    const componentConfig = [...navigation.agentManagement, ...navigation.systemManagement]
      .find(item => item.name === currentView);

    if (!componentConfig?.component) {
      debug('Error', `No component found for view: ${currentView}`);
      return <div>Component not found</div>;
    }

    const Component = componentConfig.component;
    debug('Render', `Found component for: ${currentView}`);

    return (
      <Suspense fallback={<LoadingComponent />}>
        <Component />
      </Suspense>
    );
  };

  if (error) {
    debug('Error', 'Rendering error state:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-800 font-medium">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {currentView !== 'dashboard' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              debug('Action', 'Back button clicked');
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
            debug('Action', 'Home button clicked');
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
      {isLoading ? (
        <LoadingComponent />
      ) : (
        <ErrorBoundary onError={(error) => {
          debug('Error', 'ErrorBoundary caught error:', error);
          setError(error.message);
        }}>
          {renderComponent()}
        </ErrorBoundary>
      )}
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    debug('Error', 'ErrorBoundary getDerivedStateFromError:', error);
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    debug('Error', 'ErrorBoundary caught error:', { error, errorInfo });
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminDashboard;