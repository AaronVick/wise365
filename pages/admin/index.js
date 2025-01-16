// pages/admin/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { 
  Box, 
  Flex, 
  Grid, 
  Text, 
  Button, 
  Heading, 
  IconButton,
  useColorModeValue,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
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

// Lazy load components with error boundaries
const DynamicComponent = ({ importFunc, loadingText = 'Loading...' }) => {
  const Component = dynamic(importFunc, {
    ssr: false,
    loading: () => (
      <Box p={4} textAlign="center">
        <Text>{loadingText}</Text>
      </Box>
    )
  });
  
  return (
    <ErrorBoundary
      fallback={<Box p={4} color="red.500">Error loading component</Box>}
    >
      <Component />
    </ErrorBoundary>
  );
};

const ManageAgents = () => (
  <DynamicComponent importFunc={() => import('./manage')} />
);

const Chat = () => (
  <DynamicComponent importFunc={() => import('./chat')} />
);

const Training = () => (
  <DynamicComponent importFunc={() => import('./training')} />
);

const Prompts = () => (
  <DynamicComponent importFunc={() => import('./prompts')} />
);

const AgentStats = () => (
  <DynamicComponent importFunc={() => import('./agentStats')} />
);

const AdminManagement = () => (
  <DynamicComponent importFunc={() => import('./adminManagement')} />
);

const UsageStats = () => (
  <DynamicComponent importFunc={() => import('./usageStats')} />
);

const BillingManagement = () => (
  <DynamicComponent importFunc={() => import('./billingManagement')} />
);

const AuditLogs = () => (
  <DynamicComponent importFunc={() => import('./auditLogs')} />
);

const TenantManagement = () => (
  <DynamicComponent importFunc={() => import('./tenantManagement')} />
);


const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalConversations: 0,
  });
  const [error, setError] = useState(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
        <Container maxW="container.xl" py={6}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Stat
              px={6}
              py={4}
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: 'md' }}
            >
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Total Agents
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">
                {stats.totalAgents}
              </StatNumber>
              <StatHelpText>
                <Flex align="center" color={useColorModeValue('gray.600', 'gray.400')}>
                  <Bot size={14} style={{ marginRight: '6px' }} />
                  Active AI Agents
                </Flex>
              </StatHelpText>
            </Stat>
  
            <Stat
              px={6}
              py={4}
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: 'md' }}
            >
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Active Users
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">
                {stats.totalUsers}
              </StatNumber>
              <StatHelpText>
                <Flex align="center" color={useColorModeValue('gray.600', 'gray.400')}>
                  <Users size={14} style={{ marginRight: '6px' }} />
                  Total Platform Users
                </Flex>
              </StatHelpText>
            </Stat>
  
            <Stat
              px={6}
              py={4}
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={useColorModeValue('gray.200', 'gray.700')}
              boxShadow="sm"
              transition="all 0.3s"
              _hover={{ boxShadow: 'md' }}
            >
              <StatLabel fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                Total Conversations
              </StatLabel>
              <StatNumber fontSize="3xl" fontWeight="bold">
                {stats.totalConversations}
              </StatNumber>
              <StatHelpText>
                <Flex align="center" color={useColorModeValue('gray.600', 'gray.400')}>
                  <MessageCircle size={14} style={{ marginRight: '6px' }} />
                  Active Interactions
                </Flex>
              </StatHelpText>
            </Stat>
          </SimpleGrid>
  
          <Box mb={8}>
            {renderNavigationSection(navigationSections.agentManagement)}
          </Box>
          <Box>
            {renderNavigationSection(navigationSections.systemManagement)}
          </Box>
        </Container>
      );
    }
  
    const selectedItem = [
      ...navigationSections.agentManagement.items,
      ...navigationSections.systemManagement.items,
    ].find((item) => item.path === currentView);
  
    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return (
        <Box p={4}>
          <Component />
        </Box>
      );
    }
  
    return (
      <Box p={4} textAlign="center">
        <Heading size="md" color="gray.500">Page not found</Heading>
      </Box>
    );
  };
  
  // Error handling component
  if (error) {
    return (
      <Box
        p={6}
        m={4}
        bg={useColorModeValue('red.50', 'red.900')}
        borderWidth={1}
        borderColor={useColorModeValue('red.200', 'red.700')}
        borderRadius="lg"
        textAlign="center"
      >
        <Heading size="md" color={useColorModeValue('red.600', 'red.200')} mb={2}>
          Error
        </Heading>
        <Text color={useColorModeValue('red.500', 'red.300')}>
          {error}
        </Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex direction="column">
        {/* Navigation Header */}
        <Box
          bg={bgColor}
          px={4}
          borderBottom="1px"
          borderColor={borderColor}
        >
          <Flex h={16} alignItems="center" justifyContent="space-between">
            <Heading size="md">Admin Dashboard</Heading>
            {currentView !== 'dashboard' && (
              <IconButton
                icon={<ArrowLeft />}
                onClick={() => setCurrentView('dashboard')}
                variant="ghost"
                aria-label="Return to dashboard"
              />
            )}
          </Flex>
        </Box>

        {/* Main Content */}
        <Box flex="1" p={4}>
          {error ? (
            <Text color="red.500">{error}</Text>
          ) : (
            renderContent()
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default AdminDashboard;