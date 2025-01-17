// components/dashboard/ProjectsSection.js

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card, Button } from "@/components/ui";
import firebaseService from "@/lib/services/firebaseService";


const ProjectsSection = ({ currentUser, setCurrentChat }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      console.log("Fetching projects for user:", currentUser);

      if (!currentUser?.authenticationID) {
        console.error("No authentication ID found for the current user.");
        return;
      }

      setLoading(true);
      try {
        const projectsData = await firebaseService.queryCollection("projectNames", {
          where: [{ field: "userId", operator: "==", value: currentUser.authenticationID }],
        });
        console.log("Projects fetched successfully:", projectsData);
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  const handleProjectClick = async (project) => {
    console.log("Opening project:", project);

    try {
      setCurrentChat({
        id: project.id,
        title: project.name,
        participants: [currentUser.authenticationID],
        conversationName: project.id,
      });
      console.log("Project opened successfully.");
    } catch (error) {
      console.error("Error handling project click:", error);
    }
  };

  const handleNewProject = async () => {
    console.log("Creating a new project...");
    try {
      const newProjectData = {
        name: `New Project ${Date.now()}`,
        userId: currentUser.authenticationID,
        createdAt: new Date().toISOString(),
      };

      const newProject = await firebaseService.create("projectNames", newProjectData);
      console.log("New project created successfully:", newProject);

      setProjects((prevProjects) => [...prevProjects, { ...newProjectData, id: newProject.id }]);
    } catch (error) {
      console.error("Error creating new project:", error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Projects</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading projects...</div>
      ) : projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className="w-full justify-between text-gray-800 hover:bg-gray-100"
              onClick={() => handleProjectClick(project)}
            >
              {project.name}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No projects found.</p>
      )}
      <Button
        variant="ghost"
        onClick={handleNewProject}
        className="w-full justify-start text-gray-400 mt-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        New Project
      </Button>
    </Card>
  );
};

export default ProjectsSection;
