// pages/admin/index.js

import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { Box, Flex, Grid, Text, Button, Heading, IconButton } from '@chakra-ui/react';
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

// Lazy load components
const ManageAgents = dynamic(() => import('./manage'), { ssr: false });
const Chat = dynamic(() => import('./chat'), { ssr: false });
const Training = dynamic(() => import('./training'), { ssr: false });
const Prompts = dynamic(() => import('./prompts'), { ssr: false });
const AgentStats = dynamic(() => import('./agentStats'), { ssr: false });
const AdminManagement = dynamic(() => import('./adminManagement'), { ssr: false });
const UsageStats = dynamic(() => import('./usageStats'), { ssr: false });
const BillingManagement = dynamic(() => import('./billingManagement'), { ssr: false });
const AuditLogs = dynamic(() => import('./auditLogs'), { ssr: false });
const TenantManagement = dynamic(() => import('./tenantManagement'), { ssr: false });

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
          getDocs(collection(db, 'conversations')),
        ]);

        setStats({
          totalAgents: agentsSnap.size,
          totalUsers: usersSnap.size,
          totalConversations: conversationsSnap.size,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load stats');
      }
    };

    fetchStats();
  }, []);

  const navigationSections = {
    agentManagement: {
      title: "Agent Management Hub",
      description: "Manage and monitor AI agents",
      items: [
        { name: 'Agent Configuration', icon: Bot, component: ManageAgents, description: 'Create and configure AI agents', path: 'manage' },
        { name: 'Agent Training', icon: BookOpen, component: Training, description: 'Train and configure agent behaviors', path: 'training' },
        { name: 'Agent Prompts', icon: Code, component: Prompts, description: 'Manage agent prompts and templates', path: 'prompts' },
        { name: 'Chat Interface', icon: MessageCircle, component: Chat, description: 'Test and monitor agent conversations', path: 'chat' },
        { name: 'Performance Analytics', icon: BarChart3, component: AgentStats, description: 'View agent interaction statistics', path: 'agentStats' },
      ],
    },
    systemManagement: {
      title: "System Administration",
      description: "Manage system settings and users",
      items: [
        { name: 'Admin Management', icon: Users, component: AdminManagement, description: 'Manage system administrators', path: 'adminManagement' },
        { name: 'Usage Statistics', icon: LineChart, component: UsageStats, description: 'System-wide usage metrics', path: 'usageStats' },
        { name: 'Tenant Management', icon: Users, component: TenantManagement, description: 'Manage Users', path: 'tenantManagement' },
        { name: 'Billing Management', icon: Receipt, component: BillingManagement, description: 'Manage subscriptions and billing', path: 'billingManagement' },
        { name: 'Audit Logs', icon: ClipboardList, component: AuditLogs, description: 'View system audit trails', path: 'auditLogs' },
        { name: 'System Settings', icon: Settings, component: () => <div>Settings coming soon...</div>, description: 'Configure system-wide settings', path: 'settings' },
      ],
    },
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const renderNavigationSection = (section) => (
    <Box mb={8}>
      <Heading size="md" mb={2}>{section.title}</Heading>
      <Text color="gray.500" mb={4}>{section.description}</Text>
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
        {section.items.map((item) => (
          <Box
            key={item.name}
            p={4}
            borderWidth={1}
            borderRadius="md"
            boxShadow="md"
            _hover={{ boxShadow: 'lg', transform: 'translateY(-4px)', transition: 'all 0.2s' }}
          >
            <Flex align="center" mb={4}>
              <Box bg="blue.50" p={2} borderRadius="md" mr={3}>
                <item.icon size={24} color="blue" />
              </Box>
              <Heading size="sm">{item.name}</Heading>
            </Flex>
            <Text mb={4}>{item.description}</Text>
            <Button colorScheme="blue" width="full" onClick={() => handleNavigation(item.path)}>
              Access
            </Button>
          </Box>
        ))}
      </Grid>
    </Box>
  );

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <>
          <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(3, 1fr)' }} gap={6} mb={8}>
            <Box p={4} borderWidth={1} borderRadius="md" boxShadow="md">
              <Text>Total Agents</Text>
              <Heading size="lg">{stats.totalAgents}</Heading>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md" boxShadow="md">
              <Text>Active Users</Text>
              <Heading size="lg">{stats.totalUsers}</Heading>
            </Box>
            <Box p={4} borderWidth={1} borderRadius="md" boxShadow="md">
              <Text>Total Conversations</Text>
              <Heading size="lg">{stats.totalConversations}</Heading>
            </Box>
          </Grid>
          {renderNavigationSection(navigationSections.agentManagement)}
          {renderNavigationSection(navigationSections.systemManagement)}
        </>
      );
    }

    const selectedItem = [
      ...navigationSections.agentManagement.items,
      ...navigationSections.systemManagement.items,
    ].find((item) => item.path === currentView);

    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return <Component />;
    }

    return <Text>Page not found</Text>;
  };

  if (error) {
    return (
      <Box p={4} bg="red.50" borderWidth={1} borderColor="red.200" borderRadius="md">
        <Heading size="sm" color="red.600">Error</Heading>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box maxW="7xl" mx="auto" py={8} px={4}>
      <Flex align="center" mb={8}>
        {currentView !== 'dashboard' && (
          <IconButton
            icon={<ArrowLeft />}
            aria-label="Go back"
            onClick={() => handleNavigation('dashboard')}
            mr={4}
          />
        )}
        <Heading>{currentView === 'dashboard' ? 'Admin Dashboard' : navigationSections.agentManagement.items.find((item) => item.path === currentView)?.name || 'Not Found'}</Heading>
      </Flex>
      {renderContent()}
    </Box>
  );
};

export default AdminDashboard;
