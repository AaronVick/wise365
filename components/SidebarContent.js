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
import { agents } from '../data/agents';

const SidebarContent = ({ 
  currentUser, 
  setCurrentChat, 
  nestedChats, 
  projects, 
  goals,
  isGoalModalOpen,
  setIsGoalModalOpen,
  resources,
  GoalCreationModal,
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
            <Accordion type="multiple" collapsible className="w-full">
              <AccordionItem value="agents">
                <AccordionTrigger>Agents</AccordionTrigger>
                <AccordionContent>
                  {Object.entries(agents).map(([category, categoryAgents]) => (
                    <div key={category} className="mb-4">
                      <h4 className="font-bold text-lg mb-2">{category}</h4>
                      {categoryAgents.map((agent) => (
                        <Accordion key={agent.id} type="single" collapsible className="w-full">
                          <AccordionItem value={agent.id}>
                            {/* Agent Name and Role */}
                            <AccordionTrigger
                              className="flex justify-between items-center py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() =>
                                router.push(`/chat/${agent.id}-default`) // Navigate to default chat on click
                              }
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{agent.name}</span>
                                <span className="text-sm text-gray-500 ml-4">{agent.role}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              {/* Sub-Chats */}
                              {nestedChats[agent.id]
                                ?.filter((subChat) => !subChat.isDefault) // Exclude default chat
                                .map((subChat) => (
                                  <div
                                    key={subChat.id}
                                    className="py-2 cursor-pointer hover:bg-gray-200 ml-4"
                                    onClick={() => router.push(`/chat/${subChat.id}`)} // Navigate to subchat
                                  >
                                    <p className="text-sm text-white">{subChat.displayName}</p>
                                  </div>
                                ))}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>




            {/* Projects Section */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="projects">
                <AccordionTrigger>Projects</AccordionTrigger>
                <AccordionContent>
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.description}</p>
                      </div>
                      <Button variant="link" className="text-blue-500">
                        View Details
                      </Button>
                    </div>
                  ))}
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
                    {goals.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No goals available. Right-click to add a new goal.
                      </p>
                    ) : (
                      goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="flex items-center justify-between py-2 border-b cursor-pointer hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium">{goal.title}</p>
                            <p className="text-sm text-gray-500">{goal.status}</p>
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
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{resource.templateName}</p>
                        <p className="text-sm text-gray-500">{resource.description}</p>
                      </div>
                      <Button variant="link" className="text-blue-500">
                        Access
                      </Button>
                    </div>
                  ))}
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