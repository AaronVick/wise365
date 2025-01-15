// components/SidebarContent.js
import React from 'react';
import { useRouter } from 'next/router';
import { Home, Settings, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from './Accordion';
import GoalCreationModal from './GoalCreationModal';

const SidebarContent = ({ 
  currentUser, 
  setCurrentChat, 
  nestedChats = {}, 
  projects = [], 
  goals = [],
  isGoalModalOpen,
  setIsGoalModalOpen,
  resources = [],
  sidebarWidth,
  agents = {},
}) => {
  const router = useRouter();


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className="bg-gray-900 text-white flex flex-col"
        style={{ width: `${sidebarWidth}px`, resize: 'horizontal', overflow: 'hidden' }}
      >
        {/* Home and Title Bar */}
        <div className="p-4 border-b border-gray-700 flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setCurrentChat(null)}>
            <Home className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold">Dashboard</h1>
        </div>
  
        {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            
            
           {/* Agents Section */}
<Accordion type="multiple" className="w-full">
  <AccordionItem value="agents">
    <AccordionTrigger>Agents</AccordionTrigger>
    <AccordionContent>
      {agents && Object.entries(agents).length > 0 ? (
        Object.entries(agents).map(([category, categoryAgents]) => (
          <div key={category} className="mb-4">
            <h4 className="font-bold text-lg mb-2">{category}</h4>
            {Array.isArray(categoryAgents) && categoryAgents.length > 0 ? (
              categoryAgents.map((agent) => (
                <div key={agent.id} className="mb-2">
                  <div
                    className="flex items-center justify-between py-2 px-4 hover:bg-gray-100 cursor-pointer rounded"
                    onClick={() => {
                      setCurrentChat({
                        id: `${agent.id}-default`,
                        agentId: agent.id,
                        isDefault: true,
                        title: `${agent.name} Conversation`,
                        conversationName: `${agent.id}-default`,
                      });
                      router.push(`/chat/${agent.id}-default`);
                    }}
                  >
                    <span className="font-medium">{agent.name || 'Unknown Agent'}</span>
                    <span className="text-sm text-gray-500">{agent.role || 'No Role'}</span>
                  </div>
                  
                  {/* Sub-conversations */}
                  {Array.isArray(nestedChats[agent.id]) && nestedChats[agent.id].length > 0 && (
                    <div className="ml-4 mt-1">
                      {nestedChats[agent.id]
                        .filter(chat => !chat.isDefault)
                        .map(subChat => (
                          <div
                            key={subChat.id}
                            className="py-2 px-4 cursor-pointer hover:bg-gray-100 rounded text-sm"
                            onClick={() => {
                              setCurrentChat({
                                id: subChat.id,
                                agentId: agent.id,
                                isDefault: false,
                                title: subChat.displayName || 'Untitled Chat',
                                conversationName: subChat.id,
                              });
                              router.push(`/chat/${subChat.id}`);
                            }}
                          >
                            <p className="text-gray-600">{subChat.displayName || 'Unnamed Chat'}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No agents available in this category.</p>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500">No agents data available.</p>
      )}
    </AccordionContent>
  </AccordionItem>
</Accordion>





{/* Projects Section */}
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="projects">
    <AccordionTrigger>Projects</AccordionTrigger>
    <AccordionContent>
      {Array.isArray(projects) && projects.length > 0 ? (
        projects.map((project) => (
          <div key={project.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-gray-500">{project.description}</p>
            </div>
            <Button variant="link" className="text-blue-500">
              View Details
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No projects available.</p>
      )}
    </AccordionContent>
  </AccordionItem>
</Accordion>



{/* Goals Section */}
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="goals">
    <AccordionTrigger>Goals</AccordionTrigger>
    <AccordionContent>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setIsGoalModalOpen(true); // Open the modal on right-click
        }}
      >
        {Array.isArray(goals) && goals.length > 0 ? (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center justify-between py-2 border-b cursor-pointer hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{goal.title || 'Untitled Goal'}</p>
                <p className="text-sm text-gray-500">{goal.status || 'No Status Provided'}</p>
              </div>
              <Button
                variant="link"
                className="text-blue-500"
                onClick={() => router.push(`/goal/${goal.id}`)} // Navigate to the goal's page
              >
                View Goal
              </Button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">
            No goals available. Right-click to add a new goal.
          </p>
        )}
      </div>
    </AccordionContent>
  </AccordionItem>
</Accordion>



            <GoalCreationModal
              isOpen={isGoalModalOpen}
              onClose={() => setIsGoalModalOpen(false)}
              onSubmit={async (formData) => {
                try {
                  // Save new goal to Firebase
                  await addDoc(collection(db, 'goals'), {
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    priority: formData.priority,
                    agentId: formData.agentId,
                    dueDate: formData.dueDate,
                    status: 'not_started',
                    userId: currentUser.uid,
                    teamId: currentUser.teamId || '',
                    createdAt: serverTimestamp(),
                  });

                  // Refresh goals
                  fetchGoals(); // Use the existing fetchGoals function
                  setIsGoalModalOpen(false); // Close the modal
                } catch (error) {
                  console.error('Error creating goal:', error);
                }
              }}
              agents={Object.values(agents).flat()} // Pass all agents if necessary
            />




            {/* Resources Section */}
<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="resources">
    <AccordionTrigger>Resources</AccordionTrigger>
    <AccordionContent>
      {Array.isArray(resources) && resources.length > 0 ? (
        resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-center justify-between py-2 border-b cursor-pointer hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{resource.templateName || 'Untitled Resource'}</p>
              <p className="text-sm text-gray-500">{resource.description || 'No Description Available'}</p>
            </div>
            <Button
              variant="link"
              className="text-blue-500"
              onClick={() => console.log(`Accessing resource ${resource.id}`)} // Add your logic here
            >
              Access
            </Button>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          No resources available. Check back later!
        </p>
      )}
    </AccordionContent>
  </AccordionItem>
</Accordion>


          </ScrollArea>


  
        {/* Settings Button */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="ghost" className="w-full">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
        </div>
      </div>
  
      {/* Resize Handle */}
      <div
        className="w-1 cursor-ew-resize bg-gray-700"
        onMouseDown={(e) => {
          e.preventDefault();
          document.addEventListener('mousemove', handleSidebarResize);
          document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', handleSidebarResize);
          });
        }}
      />
  
      {/* Main Content */}
      <div className="flex-1">
        {currentChat ? (
          <ChatInterface
            chatId={currentChat.id}
            agentId={currentChat.agentId}
            userId={currentUser.uid}
            isDefault={currentChat.isDefault}
            title={currentChat.title}
            conversationName={currentChat.conversationName}
            projectId={currentChat.projectId}
            projectName={currentChat.projectName}
          />
        ) : (
          <DashboardContent 
            currentUser={currentUser}
            currentTool={currentTool}
            onToolComplete={() => setCurrentTool(null)}
            setCurrentTool={setCurrentTool}
/>
        )}
      </div>
    </div>
  );  
};


  export default SidebarContent;