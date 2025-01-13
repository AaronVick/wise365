import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { 
  Home, 
  Users, 
  Calendar, 
  Settings,
  LogOut,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserData(userDoc.data());
            console.log('User data fetched:', userDoc.data());
          } else {
            console.error('No user document found. Redirecting to login...');
            router.replace('/');
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
        } finally {
          setIsLoadingUserData(false);
        }
      }
    };

    if (!loading && user) {
      fetchUserData();
    } else if (!loading && !user) {
      console.log('No user found, redirecting to login...');
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSidebarResizeStart = (e) => {
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    
    const handleMouseMove = (e) => {
      const delta = e.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + delta, 200), window.innerWidth / 3);
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (loading || isLoadingUserData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className="bg-gray-900 text-white flex flex-col"
        style={{
          width: `${sidebarWidth}px`,
          minWidth: '200px',
          maxWidth: '400px'
        }}
      >
        {/* Home and Title Bar */}
        <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
          <Button variant="ghost" className="text-white hover:text-white">
            <Home className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Business Wise365</h1>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Projects Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="projects">
                <AccordionTrigger className="text-white">
                  Projects
                </AccordionTrigger>
                <AccordionContent>
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <div key={project.id} className="py-2 px-4 hover:bg-gray-800 rounded">
                        <p className="text-sm">{project.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-4">No projects yet</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-white hover:text-white hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Goals Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="goals">
                <AccordionTrigger className="text-white">
                  Goals
                </AccordionTrigger>
                <AccordionContent>
                  {goals.length > 0 ? (
                    goals.map((goal) => (
                      <div key={goal.id} className="py-2 px-4 hover:bg-gray-800 rounded">
                        <p className="text-sm">{goal.title}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-4">No goals yet</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-white hover:text-white hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Resources Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="resources">
                <AccordionTrigger className="text-white">
                  Resources
                </AccordionTrigger>
                <AccordionContent>
                  {resources.length > 0 ? (
                    resources.map((resource) => (
                      <div key={resource.id} className="py-2 px-4 hover:bg-gray-800 rounded">
                        <p className="text-sm">{resource.name}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 px-4">No resources yet</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        {/* User section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                {userData.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{userData.name}</p>
              <p className="text-xs text-gray-400">{userData.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:text-white hover:bg-gray-800"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={handleSidebarResizeStart}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">User ID: {userData.userId}</p>
                  <p className="text-sm text-gray-600">Role: {userData.role}</p>
                  <p className="text-sm text-gray-600">Auth ID: {user.uid}</p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">No recent activity</p>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full">Create New Project</Button>
                <Button variant="outline" className="w-full">View Reports</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;