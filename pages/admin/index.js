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
  Container,
  useColorModeValue,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';
import { 
  Bot, 
  MessageCircle, 
  BookOpen, 
  BarChart3, 
  Code,
  ArrowLeft,
  Users
} from 'lucide-react';

// Simple loading component
const LoadingComponent = () => (
  <Box p={4} textAlign="center">
    <Text>Loading...</Text>
  </Box>
);

// Simple error component
const ErrorComponent = ({ message }) => (
  <Box p={4} bg="red.50" borderRadius="lg" color="red.500" textAlign="center">
    <Text>{message}</Text>
  </Box>
);

// Basic dynamic import wrapper
const DynamicComponent = ({ importFunc }) => {
  const Component = dynamic(importFunc, {
    ssr: false,
    loading: LoadingComponent
  });
  return <Component />;
};

// Navigation Components - kept minimal
const ManageAgents = () => <DynamicComponent importFunc={() => import('./manage')} />;
const Chat = () => <DynamicComponent importFunc={() => import('./chat')} />;
const Training = () => <DynamicComponent importFunc={() => import('./training')} />;
const Prompts = () => <DynamicComponent importFunc={() => import('./prompts')} />;
const AgentStats = () => <DynamicComponent importFunc={() => import('./agentStats')} />;

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalAgents: 0,
    totalUsers: 0,
    totalConversations: 0,
  });
  const [error, setError] = useState(null);

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

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

  const navigationItems = [
    { name: 'Agent Configuration', icon: Bot, component: ManageAgents, description: 'Create and configure AI agents', path: 'manage' },
    { name: 'Agent Training', icon: BookOpen, component: Training, description: 'Train and configure agent behaviors', path: 'training' },
    { name: 'Agent Prompts', icon: Code, component: Prompts, description: 'Manage agent prompts and templates', path: 'prompts' },
    { name: 'Chat Interface', icon: MessageCircle, component: Chat, description: 'Test and monitor agent conversations', path: 'chat' },
    { name: 'Performance Analytics', icon: BarChart3, component: AgentStats, description: 'View agent interaction statistics', path: 'agentStats' },
  ];

  const renderContent = () => {
    if (currentView === 'dashboard') {
      return (
        <Container maxW="container.xl" py={6}>
          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
            <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Total Agents</Text>
              <Text fontSize="3xl" fontWeight="bold">{stats.totalAgents}</Text>
              <Flex align="center" color="gray.500" mt={2}>
                <Bot size={14} style={{ marginRight: '6px' }} />
                <Text fontSize="sm">Active AI Agents</Text>
              </Flex>
            </Box>
            <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Active Users</Text>
              <Text fontSize="3xl" fontWeight="bold">{stats.totalUsers}</Text>
              <Flex align="center" color="gray.500" mt={2}>
                <Users size={14} style={{ marginRight: '6px' }} />
                <Text fontSize="sm">Total Platform Users</Text>
              </Flex>
            </Box>
            <Box p={6} bg={bgColor} borderRadius="lg" boxShadow="sm">
              <Text fontSize="sm" color="gray.500">Total Conversations</Text>
              <Text fontSize="3xl" fontWeight="bold">{stats.totalConversations}</Text>
              <Flex align="center" color="gray.500" mt={2}>
                <MessageCircle size={14} style={{ marginRight: '6px' }} />
                <Text fontSize="sm">Active Interactions</Text>
              </Flex>
            </Box>
          </SimpleGrid>

          {/* Navigation Grid */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
            {navigationItems.map((item) => (
              <Box
                key={item.name}
                p={6}
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Flex align="center" mb={4}>
                  <Box bg="blue.50" p={2} borderRadius="lg" mr={3}>
                    <item.icon size={24} color="blue" />
                  </Box>
                  <Heading size="sm">{item.name}</Heading>
                </Flex>
                <Text mb={4} color="gray.500">{item.description}</Text>
                <Button
                  colorScheme="blue"
                  width="full"
                  onClick={() => setCurrentView(item.path)}
                >
                  Access
                </Button>
              </Box>
            ))}
          </Grid>
        </Container>
      );
    }

    const selectedItem = navigationItems.find(item => item.path === currentView);
    if (selectedItem?.component) {
      const Component = selectedItem.component;
      return (
        <Box p={4}>
          <Component />
        </Box>
      );
    }

    return <Text>Page not found</Text>;
  };

  if (error) {
    return <ErrorComponent message={error} />;
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex direction="column">
        <Box bg={bgColor} px={4} borderBottom="1px" borderColor={borderColor}>
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

        <Box flex="1" p={4}>
          {renderContent()}
        </Box>
      </Flex>
    </Box>
  );
};

export default AdminDashboard;