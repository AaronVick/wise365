// pages/admin/index.js

import React, { useState } from 'react';
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

// Lazy load components
const AdminManagement = React.lazy(() => import('./adminManagement'));
const AgentStats = React.lazy(() => import('./agentStats'));
const AuditLogs = React.lazy(() => import('./auditLogs'));
const BillingManagement = React.lazy(() => import('./billingManagement'));
const Chat = React.lazy(() => import('./chat'));
const ManageAgents = React.lazy(() => import('./manage'));
const Prompts = React.lazy(() => import('./prompts'));
const TenantManagement = React.lazy(() => import('./tenantManagement'));
const Training = React.lazy(() => import('./training'));
const UsageStats = React.lazy(() => import('./usageStats'));

// Debug helper
const debug = (message, data = '') => {
  console.log(`[Admin Dashboard] ${message}`, data);
};

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  // Component mapping with strict typing
  const componentMap = {
    'Manage Agents': ManageAgents,
    'Training': Training,
    'Prompts': Prompts,
    'Chat Interface': Chat,
    'Agent Stats': AgentStats,
    'Usage Statistics': UsageStats,
    'Tenant Management': TenantManagement,
    'Admin Management': AdminManagement,
    'Billing Management': BillingManagement,
    'Audit Logs': AuditLogs,
    'System Settings': () => (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">System Settings</h2>
        <p>System settings configuration coming soon...</p>
      </div>
    )
  };

  // Navigation structure
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

  // Safe render function for navigation cards
  const renderNavigationCard = (item) => {
    if (!item?.name) {
      debug('Invalid navigation item:', item);
      return null;
    }

    const IconComponent = item.icon || Settings;
    const cardKey = `nav-card-${item.name.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <Card key={cardKey} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </div>
          <CardDescription>{item.description || ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full"
            onClick={() => {
              debug('Navigation clicked:', item.name);
              setCurrentView(item.name);
            }}
          >
            Access
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Safe render function for dynamic components
  const renderDynamicComponent = () => {
    if (currentView === 'dashboard') {
      return null;
    }

    const Component = componentMap[currentView];
    if (!Component) {
      debug('Component not found:', currentView);
      return (
        <div className="p-4">
          <p>Component not found: {currentView}</p>
        </div>
      );
    }

    return (
      <React.Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <Component />
      </React.Suspense>
    );
  };

  // Render dashboard content
  const renderDashboardContent = () => {
    if (currentView !== 'dashboard') {
      return renderDynamicComponent();
    }

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Management</TabsTrigger>
          <TabsTrigger value="system">System Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
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

  return (
    <div className="container mx-auto p-6">
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

      {renderDashboardContent()}
    </div>
  );
};

export default AdminDashboard;