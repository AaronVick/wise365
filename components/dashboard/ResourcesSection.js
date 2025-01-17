// components/dashboard/ResourcesSection.js

import React, { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import firebaseService from "@/lib/services/firebaseService";


const ResourcesSection = ({ currentUser }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      console.log("Fetching resources for user:", currentUser);
      if (!currentUser?.teamId) {
        console.error("No team ID found for the current user.");
        return;
      }

      setLoading(true);
      try {
        const resourcesData = await firebaseService.queryCollection("resources", {
          where: [{ field: "teamId", operator: "==", value: currentUser.teamId }],
        });
        console.log("Resources fetched successfully:", resourcesData);
        setResources(resourcesData);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [currentUser]);

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resources</h3>
        {process.env.NODE_ENV === "development" && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              console.log("Seeding templates...");
              try {
                const response = await fetch("/api/seed", { method: "POST" });
                const data = await response.json();
                console.log("Templates seeded successfully:", data);
                alert("Templates seeded successfully!");
              } catch (error) {
                console.error("Error seeding templates:", error);
                alert("Error seeding templates.");
              }
            }}
          >
            Seed Templates
          </Button>
        )}
      </div>
      <div className="text-sm text-gray-500">
        {loading ? (
          <div className="text-center py-4">Loading resources...</div>
        ) : resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource) => (
              <Button
                key={resource.id}
                variant="ghost"
                className="w-full justify-between text-left hover:bg-gray-100"
                onClick={() => {
                  console.log("Resource clicked:", resource);
                  alert(`You selected the resource: ${resource.name}`);
                }}
              >
                <div className="text-left">
                  <h4 className="text-sm font-medium text-gray-900">{resource.name}</h4>
                  <p className="text-xs text-gray-600">{resource.description}</p>
                </div>
                <span className="text-blue-600">View</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">No resources found.</div>
        )}
      </div>
    </Card>
  );
};

export default ResourcesSection;
