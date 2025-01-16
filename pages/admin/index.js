// pages/admin/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const debug = (area, message, data = '') => {
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? JSON.stringify(data) : '');
};

// Lazy load agent management components
const ManageAgents = dynamic(() => {
  debug('Load', 'Loading ManageAgents component');
  return import('./manage').catch(err => {
    debug('Error', 'Failed to load ManageAgents', err);
    return () => <div>Error loading Manage Agents</div>;
  });
}, { loading: () => <div>Loading Manage Agents...</div>, ssr: false });

const Chat = dynamic(() => {
  debug('Load', 'Loading Chat component');
  return import('./chat');
}, { loading: () => <div>Loading Chat Interface...</div>, ssr: false });

const Training = dynamic(() => {
  debug('Load', 'Loading Training component');
  return import('./training');
}, { loading: () => <div>Loading Training Interface...</div>, ssr: false });

const Prompts = dynamic(() => {
  debug('Load', 'Loading Prompts component');
  return import('./prompts');
}, { loading: () => <div>Loading Prompts Interface...</div>, ssr: false });

const AgentStats = dynamic(() => {
  debug('Load', 'Loading AgentStats component');
  return import('./agentStats');
}, { loading: () => <div>Loading Agent Stats...</div>, ssr: false });

// Lazy load system management components
const AdminManagement = dynamic(() => {
  debug('Load', 'Loading AdminManagement component');
  return import('./adminManagement');
}, { loading: () => <div>Loading Admin Management...</div>, ssr: false });

const UsageStats = dynamic(() => {
  debug('Load', 'Loading UsageStats component');
  return import('./usageStats');
}, { loading: () => <div>Loading Usage Stats...</div>, ssr: false });

const BillingManagement = dynamic(() => {
  debug('Load', 'Loading BillingManagement component');
  return import('./billingManagement');
}, { loading: () => <div>Loading Billing Management...</div>, ssr: false });

const AuditLogs = dynamic(() => {
  debug('Load', 'Loading AuditLogs component');
  return import('./auditLogs');
}, { loading: () => <div>Loading Audit Logs...</div>, ssr: false });

const AdminDashboard = () => {
  debug('Init', 'Starting dashboard initialization');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [error, setError] = useState(null);


  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalConversations: 0,
  });
  const [systemHealth, setSystemHealth] = useState('Good'); // Placeholder logic for now
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [agentsSnap, usersSnap, conversationsSnap] = await Promise.all([
          getDocs(collection(db, 'agents')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'conversations')),
        ]);
  
        setStats({
          totalAgents: agentsSnap.size,
          totalUsers: usersSnap.size,
          totalConversations: conversationsSnap.size,
        });
  
        // Placeholder: Update system health logic here
        setSystemHealth('Good'); // Add real health check logic
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
  
    fetchStats();
  }, []);


  // Define navigation sections
  const navigationSections = {
    agentManagement: {
      title: "Agent Management Hub",
      description: "Manage and monitor AI agents",
      items: [
        { 
          name: 'Agent Configuration',
          icon: Bot,
          component: ManageAgents,
          description: 'Create and configure AI agents',
          path: 'manage'
        },
        { 
          name: 'Agent Training',
          icon: BookOpen,
          component: Training,
          description: 'Train and configure agent behaviors',
          path: 'training'
        },
        {
          name: 'Agent Prompts',
          icon: Code,
          component: Prompts,
          description: 'Manage agent prompts and templates',
          path: 'prompts'
        },
        { 
          name: 'Chat Interface',
          icon: MessageCircle,
          component: Chat,
          description: 'Test and monitor agent conversations',
          path: 'chat'
        },
        { 
          name: 'Performance Analytics',
          icon: BarChart3,
          component: AgentStats,
          description: 'View agent interaction statistics',
          path: 'agentStats'
        }
      ]
    },
    systemManagement: {
      title: "System Administration",
      description: "Manage system settings and users",
      items: [
        {
          name: 'Admin Management',
          icon: Users,
          component: AdminManagement,
          description: 'Manage system administrators',
          path: 'adminManagement'
        },
        {
          name: 'Usage Statistics',
          icon: LineChart,
          component: UsageStats,
          description: 'System-wide usage metrics',
          path: 'usageStats'
        },
        {
          name: 'Billing Management',
          icon: Receipt,
          component: BillingManagement,
          description: 'Manage subscriptions and billing',
          path: 'billingManagement'
        },
        {
          name: 'Audit Logs',
          icon: ClipboardList,
          component: AuditLogs,
          description: 'View system audit trails',
          path: 'auditLogs'
        },
        {
          name: 'System Settings',
          icon: Settings,
          component: () => <div>Settings coming soon...</div>,
          description: 'Configure system-wide settings',
          path: 'settings'
        }
      ]
    }
  };

  // Safe navigation handler
  const handleNavigation = (view) => {
    debug('Navigation', `Navigating to: ${view}`);
    setCurrentView(view);
  };

  // Render navigation section
  const renderNavigationSection = (section) => {
    debug('Render', `Rendering navigation section: ${section.title}`);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{section.title}</h2>
            <p className="text-gray-500">{section.description}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {section.items.map(item => (
            <Card 
              key={item.name} 
              className="hover:shadow-lg transition-shadow border-l-4 border-l-primary"
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </div>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => handleNavigation(item.path)}
                >
                  Access
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Render main content
  const renderContent = () => {
    debug('Render', 'Rendering main content', { view: currentView });

    if (currentView === 'dashboard') {
      return (
        <div className="space-y-12">
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAgents}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalConversations}</div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-12">
            {renderNavigationSection(navigationSections.agentManagement)}
            {renderNavigationSection(navigationSections.systemManagement)}
          </div>
        </div>
      );
    }

    // Find and render the selected component
    const allItems = [
      ...navigationSections.agentManagement.items,
      ...navigationSections.systemManagement.items
    ];
    
    const selectedItem = allItems.find(item => item.path === currentView);
    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return <Component />;
    }

    return <div>Page not found</div>;
  };

  if (error) {
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
        <div>
          <h1 className="text-3xl font-bold">
            {currentView === 'dashboard' ? 'Admin Dashboard' : 
             allItems.find(item => item.path === currentView)?.name || 'Not Found'}
          </h1>
          {currentView !== 'dashboard' && (
            <p className="text-gray-500">
              {allItems.find(item => item.path === currentView)?.description}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;