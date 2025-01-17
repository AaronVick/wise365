// components/dashboard/ProjectsSection.js

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import firebaseService from '@/lib/services/firebaseService';

const ProjectsSection = ({ currentUser }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('Fetching projects for user:', currentUser);

        const queryParams = {
          where: [
            { field: 'userId', operator: '==', value: currentUser.authenticationID },
          ],
        };

        if (currentUser.teamId) {
          queryParams.where.push({ field: 'teamId', operator: '==', value: currentUser.teamId });
        }

        const fetchedProjects = await firebaseService.queryCollection('projectNames', queryParams);

        console.log('Projects fetched successfully:', fetchedProjects);

        setProjects(fetchedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Projects</h3>
      {loading ? (
        <p>Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="space-y-2">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant="ghost"
              className="w-full justify-between text-gray-800 hover:bg-gray-100"
              onClick={() => console.log('Navigate to project:', project.ProjectName)}
            >
              {project.ProjectName || 'Unnamed Project'}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No projects found</p>
      )}
      <Button
        variant="ghost"
        onClick={() => console.log('Create a new project')}
        className="w-full justify-start text-gray-400 mt-4"
      >
        New Project
      </Button>
    </Card>
  );
};

export default ProjectsSection;

