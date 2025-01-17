// components/DashboardSidebar.js
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { 
  Home,
  LogOut,
  Plus,
  Bot,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Target,
  BookOpen,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from "@/lib/utils";

const DashboardSidebar = ({ 
  agents = [], 
  projects = [],
  userData = {},
  isCollapsed,
  sidebarWidth,
  minWidth,
  maxWidth,
  nestedChats = {},
  onCollapse,
  onResize,
  onAgentClick,
  onProjectClick,
  onProjectDetails,
  onAgentContextMenu,
  onSignOut,
  onSubChatClick,
  setCurrentTool
}) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div 
      className={cn(
        "relative bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : ""
      )}
      style={{ 
        width: isCollapsed ? `${minWidth}px` : `${sidebarWidth}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`
      }}
    >
      {/* Logo and Home */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-white hover:text-white"
          onClick={() => setCurrentTool(null)}
        >
          <Home className="h-5 w-5" />
        </Button>
        {!isCollapsed && (
          <h1 className="text-lg font-bold truncate">Business Wise365</h1>
        )}
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Agents Categories */}
          {!isCollapsed ? (
            <Accordion type="multiple" className="w-full">
              {/* Administrative Category */}
              <AccordionItem value="Administrative">
                <AccordionTrigger className="text-white hover:text-white px-3">
                  Administrative
                </AccordionTrigger>
                <AccordionContent>
                  {/* Shawn - Always First */}
                  {agents['Administrative']?.map(agent => {
                    if (agent.id === 'shawn') {
                      return (
                        <div 
                          key={agent.id}
                          className="px-4 py-2 mb-2 hover:bg-gray-800 rounded cursor-pointer"
                          onClick={() => onAgentClick(agent)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-white truncate">{agent.name}</h4>
                              <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                            </div>
                            <Bot className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* Other Administrative Agents */}
                  {agents['Administrative']?.filter(agent => agent.id !== 'shawn').map(agent => (
                    <div key={agent.id} className="mb-2">
                      <div
                        className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer"
                        onClick={() => onAgentClick(agent)}
                        onContextMenu={(e) => onAgentContextMenu(e, agent)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white truncate">{agent.name}</h4>
                            <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                          </div>
                          <Bot className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                      {/* Subchats */}
                      {nestedChats[agent.id]?.length > 0 && (
                        <div className="ml-4 mt-1 space-y-1">
                          {nestedChats[agent.id]
                            .filter(chat => !chat.isDefault)
                            .map(subChat => (
                              <div
                                key={subChat.id}
                                className="px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300"
                                onClick={() => onSubChatClick(agent.id, subChat)}
                              >
                                {subChat.conversationName}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Other Categories */}
              {Object.entries(agents)
                .filter(([category]) => category !== 'Administrative')
                .map(([category, categoryAgents]) => (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="text-white hover:text-white px-3">
                      {category}
                    </AccordionTrigger>
                    <AccordionContent>
                      {categoryAgents.map(agent => (
                        <div key={agent.id} className="mb-2">
                          <div
                            className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => onAgentClick(agent)}
                            onContextMenu={(e) => onAgentContextMenu(e, agent)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white truncate">{agent.name}</h4>
                                <p className="text-xs text-gray-400 truncate">{agent.role}</p>
                              </div>
                              <Bot className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                          {/* Subchats */}
                          {nestedChats[agent.id]?.length > 0 && (
                            <div className="ml-4 mt-1 space-y-1">
                              {nestedChats[agent.id]
                                .filter(chat => !chat.isDefault)
                                .map(subChat => (
                                  <div
                                    key={subChat.id}
                                    className="px-3 py-1 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300"
                                    onClick={() => onSubChatClick(agent.id, subChat)}
                                  >
                                    {subChat.conversationName}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          ) : (
            /* Collapsed view for agents */
            <div className="space-y-4">
              {Object.values(agents).flat().map(agent => (
                <Button
                  key={agent.id}
                  variant="ghost"
                  className="w-full p-2 flex justify-center"
                  onClick={() => onAgentClick(agent)}
                >
                  <Bot className="h-5 w-5 text-gray-400" />
                </Button>
              ))}
            </div>
          )}

          {/* Projects Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Projects</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {projects.map(project => (
              <div
                key={project.id}
                className="px-4 py-2 hover:bg-gray-800 rounded cursor-pointer group"
                onClick={() => onProjectClick(project)}
              >
                {isCollapsed ? (
                  <Briefcase className="h-5 w-5 text-gray-400 mx-auto" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white truncate">{project.ProjectName}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {project.participants?.agent ? `With ${project.participants.agent}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectDetails(project);
                      }}
                    >
                      Details
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Goals Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 mb-2">
                <h2 className="text-sm font-semibold text-muted-foreground">Goals</h2>
              </div>
            )}
            <Button
              variant="ghost"
              className={`${isCollapsed ? 'w-full justify-center' : 'w-full justify-start'} text-white hover:bg-gray-800 px-4`}
              onClick={() => setCurrentTool('goals')}
            >
              {isCollapsed ? (
                <Target className="h-5 w-5 text-gray-400" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Goal
                </>
              )}
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* User Profile Section */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-blue-700">
              {userData?.name?.charAt(0) || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userData?.name}</p>
                <p className="text-xs text-gray-400 truncate">{userData?.role}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-white"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 w-1 h-full cursor-ew-resize bg-gray-700 hover:bg-blue-600 transition-colors"
        onMouseDown={onResize}
      />

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full bg-gray-700 text-white hover:bg-blue-600 z-10"
        onClick={onCollapse}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default DashboardSidebar;