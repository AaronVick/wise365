import React, { useState, useEffect, Suspense } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

// Lazy load components
const Chat = React.lazy(() => import('./chat'));
const Training = React.lazy(() => import('./training'));
const Prompts = React.lazy(() => import('./prompts'));
const AgentStats = React.lazy(() => import('./agentStats'));
const AdminManagement = React.lazy(() => import('./adminManagement'));
const UsageStats = React.lazy(() => import('./usageStats'));
const BillingManagement = React.lazy(() => import('./billingManagement'));
const AuditLogs = React.lazy(() => import('./auditLogs'));
const TenantManagement = React.lazy(() => import('./tenantManagement'));
const ManageAgents = React.lazy(() => import('./manage'));

// Loading component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500">
          Something went wrong. Please try refreshing the page.
        </div>
      );
    }
    return this.props.children;
  }
}

// Define navigation sections
const navigationSections = {
  agentManagement: {
    title: "Agent Management",
    description: "Manage and monitor your AI agents",
    items: [
      {
        name: "Manage Agents",
        description: "Create and configure AI agents",
        icon: Bot,
        path: "manage",
        component: ManageAgents
      },
      {
        name: "Chat Interface",
        description: "Interact with AI agents",
        icon: MessageCircle,
        path: "chat",
        component: Chat
      },
      {
        name: "Training",
        description: "Train and improve agents",
        icon: BookOpen,
        path: "training",
        component: Training
      },
      {
        name: "Prompts",
        description: "Manage agent prompts",
        icon: Code,
        path: "prompts",
        component: Prompts
      }
    ]
  },
  systemManagement: {
    title: "System Management",
    description: "System-wide settings and analytics",
    items: [
      {
        name: "Usage Statistics",
        description: "View system usage metrics",
        icon: BarChart3,
        path: "usageStats",
        component: UsageStats
      },
      {
        name: "Admin Management",
        description: "Manage admin users",
        icon: Users,
        path: "adminManagement",
        component: AdminManagement
      },
      {
        name: "Billing",
        description: "Manage billing and subscriptions",
        icon: Receipt,
        path: "billing",
        component: BillingManagement
      },
      {
        name: "Audit Logs",
        description: "View system audit logs",
        icon: ClipboardList,
        path: "auditLogs",
        component: AuditLogs
      },
      {
        name: "Tenant Management",
        description: "Manage system tenants",
        icon: Settings,
        path: "tenantManagement",
        component: TenantManagement
      }
    ]
  }
};

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

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Dashboard stats cards */}
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Total Agents</h3>
              <p className="text-2xl">{stats.totalAgents}</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Total Users</h3>
              <p className="text-2xl">{stats.totalUsers}</p>
            </div>
            <div className="p-4 border rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Total Conversations</h3>
              <p className="text-2xl">{stats.totalConversations}</p>
            </div>
          </div>
          
          {Object.entries(navigationSections).map(([key, section]) => (
            <div key={key} className="mb-8">
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <p className="text-gray-600 mb-4">{section.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="h-5 w-5" />
                      <h3 className="font-semibold">{item.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      );
    }

    const allItems = [
      ...navigationSections.agentManagement.items,
      ...navigationSections.systemManagement.items,
    ];
    const selectedItem = allItems.find((item) => item.path === currentView);

    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return (
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Component />
          </Suspense>
        </ErrorBoundary>
      );
    }

    return <div>Page not found</div>;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        {currentView !== 'dashboard' && (
          <button
            onClick={() => handleNavigation('dashboard')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold">
          {currentView === 'dashboard' ? 'Admin Dashboard' : 
           navigationSections.agentManagement.items.find((item) => item.path === currentView)?.name || 
           navigationSections.systemManagement.items.find((item) => item.path === currentView)?.name || 
           'Not Found'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default AdminDashboard;