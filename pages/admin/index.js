// pages/admin/index.js
import React, { useState } from 'react';
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
} from 'lucide-react';

const debug = (area, message, data = '') => {
  console.log(`[Admin Dashboard][${area}] ${message}`, data ? JSON.stringify(data) : '');
};

// Lazy load components with error boundaries
const ManageAgents = dynamic(() => import('./manage'), {
  loading: () => <div>Loading Manage Agents...</div>,
  ssr: false
});

const Chat = dynamic(() => import('./chat'), {
  loading: () => <div>Loading Chat Interface...</div>,
  ssr: false
});

const Training = dynamic(() => import('./training'), {
  loading: () => <div>Loading Training Interface...</div>,
  ssr: false
});

const Prompts = dynamic(() => import('./prompts'), {
  loading: () => <div>Loading Prompts Interface...</div>,
  ssr: false
});

const AgentStats = dynamic(() => import('./agentStats'), {
  loading: () => <div>Loading Agent Stats...</div>,
  ssr: false
});

const AdminDashboard = () => {
  debug('Init', 'Starting dashboard initialization');
  
  const [currentView, setCurrentView] = useState('dashboard');
  const [error, setError] = useState(null);

  // Only define agent management section initially
  const agentManagementItems = [
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
  ];

  // Safe navigation handler
  const handleNavigation = (view) => {
    debug('Navigation', `Navigating to: ${view}`);
    setCurrentView(view);
  };

  // Render navigation card
  const renderNavigationCard = (item) => {
    debug('Render', `Rendering navigation card: ${item.name}`);
    
    return (
      <Card key={item.name} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <item.icon className="h-5 w-5" />
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
    );
  };

  // Render main content
  const renderContent = () => {
    debug('Render', 'Rendering main content', { view: currentView });

    if (currentView === 'dashboard') {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Agent Management Hub</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentManagementItems.map(renderNavigationCard)}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">System Administration</h2>
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <p className="text-gray-600">System administration features will be added here.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Find and render the selected component
    const selectedItem = agentManagementItems.find(item => item.path === currentView);
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
        <h1 className="text-3xl font-bold">
          {currentView === 'dashboard' ? 'Admin Dashboard' : 
           agentManagementItems.find(item => item.path === currentView)?.name || 'Not Found'}
        </h1>
      </div>

      {/* Main Content */}
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;