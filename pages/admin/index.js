// pages/admin/index.js
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import {
  Box,
  Flex,
  Grid,
  Text,
  Button,
  Heading,
  IconButton,
  useColorMode,
  useColorModeValue,
  Container,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Divider,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast
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
  LineChart,
  Sun,
  Moon
} from 'lucide-react';

// Error Boundary Component
const ErrorFallback = ({ error }) => {
  const bgColor = useColorModeValue('red.50', 'red.900');
  const borderColor = useColorModeValue('red.200', 'red.700');
  const textColor = useColorModeValue('red.600', 'red.200');

  return (
    <Box
      p={6}
      m={4}
      bg={bgColor}
      borderWidth={1}
      borderColor={borderColor}
      borderRadius="lg"
      textAlign="center"
    >
      <Heading size="md" color={textColor} mb={2}>
        Error
      </Heading>
      <Text color={textColor}>
        {error?.message || "An unexpected error occurred"}
      </Text>
    </Box>
  );
};

// Loading Component
const LoadingComponent = () => (
  <Box p={4} textAlign="center">
    <Text>Loading...</Text>
  </Box>
);

// Dynamic Component Wrapper
const DynamicComponent = ({ importFunc }) => {
  const Component = dynamic(importFunc, {
    ssr: false,
    loading: LoadingComponent
  });

  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      <Component />
    </ReactErrorBoundary>
  );
};

// Navigation Components
const ManageAgents = () => <DynamicComponent importFunc={() => import('./manage')} />;
const Chat = () => <DynamicComponent importFunc={() => import('./chat')} />;
const Training = () => <DynamicComponent importFunc={() => import('./training')} />;
const Prompts = () => <DynamicComponent importFunc={() => import('./prompts')} />;
const AgentStats = () => <DynamicComponent importFunc={() => import('./agentStats')} />;
const AdminManagement = () => <DynamicComponent importFunc={() => import('./adminManagement')} />;
const UsageStats = () => <DynamicComponent importFunc={() => import('./usageStats')} />;
const BillingManagement = () => <DynamicComponent importFunc={() => import('./billingManagement')} />;
const AuditLogs = () => <DynamicComponent importFunc={() => import('./auditLogs')} />;
const TenantManagement = () => <DynamicComponent importFunc={() => import('./tenantManagement')} />;

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalConversations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const descriptionColor = useColorModeValue('gray.600', 'gray.400');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
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
        toast({
          title: 'Error loading statistics',
          description: 'Please try refreshing the page',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const navigationSections = {
    agentManagement: {
      title: "Agent Management Hub",
      description: "Configure and monitor AI agents across your organization",
      items: [
        { name: 'Agent Configuration', icon: Bot, component: ManageAgents, description: 'Create and configure AI agents', path: 'manage', badge: 'Core' },
        { name: 'Agent Training', icon: BookOpen, component: Training, description: 'Train and configure agent behaviors', path: 'training' },
        { name: 'Agent Prompts', icon: Code, component: Prompts, description: 'Manage agent prompts and templates', path: 'prompts' },
        { name: 'Chat Interface', icon: MessageCircle, component: Chat, description: 'Test and monitor agent conversations', path: 'chat' },
        { name: 'Performance Analytics', icon: BarChart3, component: AgentStats, description: 'View agent interaction statistics', path: 'agentStats' },
      ],
    },
    systemManagement: {
      title: "System Administration",
      description: "Manage system settings, users, and monitor platform usage",
      items: [
        { name: 'Admin Management', icon: Users, component: AdminManagement, description: 'Manage system administrators', path: 'adminManagement' },
        { name: 'Usage Statistics', icon: LineChart, component: UsageStats, description: 'System-wide usage metrics', path: 'usageStats' },
        { name: 'Tenant Management', icon: Users, component: TenantManagement, description: 'Manage organization users', path: 'tenantManagement' },
        { name: 'Billing Management', icon: Receipt, component: BillingManagement, description: 'Manage subscriptions and billing', path: 'billingManagement' },
        { name: 'Audit Logs', icon: ClipboardList, component: AuditLogs, description: 'View system audit trails', path: 'auditLogs' },
        { name: 'System Settings', icon: Settings, component: () => <Box p={4}>Settings coming soon...</Box>, description: 'Configure system-wide settings', path: 'settings' },
      ],
    },
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
    toast({
      title: 'Navigation',
      description: `Navigated to ${view}`,
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const renderStatCard = (label, value, icon, helpText) => (
    <Stat
      px={6}
      py={4}
      bg={cardBg}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      transition="all 0.3s"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
    >
      <StatLabel fontSize="sm" color={descriptionColor}>
        {label}
      </StatLabel>
      <StatNumber fontSize="3xl" fontWeight="bold" color={textColor}>
        {isLoading ? '-' : value.toLocaleString()}
      </StatNumber>
      <StatHelpText>
        <Flex align="center" color={descriptionColor}>
          {icon}
          {helpText}
        </Flex>
      </StatHelpText>
    </Stat>
  );

  const renderNavigationSection = (section) => (
    <Box mb={8}>
      <Heading size="lg" mb={2} color={textColor}>{section.title}</Heading>
      <Text color={descriptionColor} mb={6}>{section.description}</Text>
      <Grid 
        templateColumns={{ 
          base: 'repeat(1, 1fr)', 
          md: 'repeat(2, 1fr)', 
          lg: 'repeat(3, 1fr)' 
        }} 
        gap={6}
      >
        {section.items.map((item) => (
          <Box
            key={item.name}
            p={6}
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
            transition="all 0.3s"
            _hover={{ 
              boxShadow: 'lg', 
              transform: 'translateY(-4px)',
            }}
          >
            <Flex align="center" mb={4}>
              <Box 
                bg={useColorModeValue('blue.50', 'blue.900')} 
                p={2} 
                borderRadius="lg" 
                mr={3}
              >
                <item.icon 
                  size={24} 
                  color={useColorModeValue('#2B6CB0', '#90CDF4')} 
                />
              </Box>
              <Box flex="1">
                <Heading size="md" color={textColor}>{item.name}</Heading>
                {item.badge && (
                  <Badge 
                    ml={2} 
                    colorScheme="blue" 
                    variant="subtle"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Box>
            </Flex>
            <Text mb={4} color={descriptionColor}>{item.description}</Text>
            <Button
              colorScheme="blue"
              width="full"
              onClick={() => handleNavigation(item.path)}
              borderRadius="lg"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
            >
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
        <Container maxW="container.xl" py={8}>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            {renderStatCard(
              'Total Agents',
              stats.totalAgents,
              <Bot size={14} style={{ marginRight: '6px' }} />,
              'Active AI Agents'
            )}
            {renderStatCard(
              'Active Users',
              stats.totalUsers,
              <Users size={14} style={{ marginRight: '6px' }} />,
              'Total Platform Users'
            )}
            {renderStatCard(
              'Total Conversations',
              stats.totalConversations,
              <MessageCircle size={14} style={{ marginRight: '6px' }} />,
              'Active Interactions'
            )}
          </SimpleGrid>

          <Divider my={8} />
          
          {renderNavigationSection(navigationSections.agentManagement)}
          {renderNavigationSection(navigationSections.systemManagement)}
        </Container>
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
        <Box p={4}>
          <Breadcrumb mb={4}>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setCurrentView('dashboard')}>
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{selectedItem.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
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

  if (error) {
    return <ErrorFallback error={{ message: error }} />;
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex direction="column">
        <Box
          bg={bgColor}
          px={6}
          py={4}
          borderBottom="1px"
          borderColor={borderColor}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center">
              {currentView !== 'dashboard' && (
                <IconButton
                  icon={<ArrowLeft />}
                  onClick={() => setCurrentView('dashboard')}
                  variant="ghost"
                  aria-label="Return to dashboard"
                  mr={4}
                />
              )}
              <Heading size="lg" color={textColor}>Admin Dashboard</Heading>
            </Flex>
            <IconButton
              icon={colorMode === 'light' ? <Moon /> : <Sun />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle color mode"
            />
          </Flex>
        </Box>

        <Box flex="1" p={4}>
          <ReactErrorBoundary FallbackComponent={ErrorFallback}>
            {renderContent()}
          </ReactErrorBoundary>
        </Box>
      </Flex>
    </Box>
  );
};

export default AdminDashboard;