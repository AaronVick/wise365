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

// Import all the component pages
import ManageAgents from './manage';
import Training from './training';
import Prompts from './prompts';
import Chat from './chat';
import AgentStats from './agentStats';
import UsageStats from './usageStats';
import TenantManagement from './tenantManagement';
import AdminManagement from './adminManagement';
import AuditLogs from './auditLogs';
import BillingManagement from './billingManagement';
import TenantCustomization from './tenantCustomization';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('overview');

  // Define a placeholder component for System Settings
  const SystemSettings = () => (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">System Settings</h2>
      <p>System settings configuration coming soon...</p>
    </div>
  );

  // Define all available components
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
    'System Settings': SystemSettings,
    'Tenant Customization': TenantCustomization
  };

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
      { name: 'System Settings', icon: Settings, description: 'Configure system-wide settings' },
      { name: 'Tenant Customization', icon: Settings, description: 'Customize tenant settings' }
    ]
  };

  const renderNavigationCard = (item) => {
    if (!item || !item.name) return null;
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
            onClick={() => setCurrentView(item.name)}
          >
            Access
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderComponent = () => {
    if (currentView === 'dashboard') {
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
    }

    // Find the component to render from componentMap
    const ComponentToRender = componentMap[currentView];
    if (ComponentToRender) {
      return <ComponentToRender />;
    }
    
    return <div>Page not found</div>;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Persistent Header with Home Button */}
      <div className="flex items-center gap-4 mb-8">
        {currentView !== 'dashboard' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentView('dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('dashboard')}
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