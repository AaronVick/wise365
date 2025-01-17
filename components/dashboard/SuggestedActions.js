// components/dashboard/SuggestedActions.js

import React from "react";
import { Card, Button } from "@/components/ui";

const SuggestedActions = ({
  currentUser,
  handleAgentClick,
  userFunnelData,
  resourcesData,
  setCurrentTool,
}) => {
  // Debugging logs to inspect props
  console.log("SuggestedActions Component Loaded");
  console.log("Current User:", currentUser);
  console.log("User Funnel Data:", userFunnelData);
  console.log("Resources Data:", resourcesData);

  const actions = [
    {
      id: "funnel-analysis",
      name: "Analyze Funnel",
      description: "Evaluate your funnel performance",
      onClick: () => {
        console.log("Analyzing funnel performance...");
        setCurrentTool("funnel-analysis");
      },
    },
    {
      id: "chat-support",
      name: "Connect with Support Agent",
      description: "Get help from a support agent",
      onClick: () => {
        console.log("Connecting with support agent...");
        handleAgentClick({ id: "support-agent", name: "Support Agent" });
      },
    },
    {
      id: "resource-library",
      name: "Browse Resources",
      description: "Explore the resource library",
      onClick: () => {
        console.log("Browsing resources...");
        setCurrentTool("resource-library");
      },
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Suggested Actions</h3>
      <div className="space-y-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            className="w-full justify-between text-left hover:bg-gray-100"
            onClick={action.onClick}
          >
            <div className="text-left">
              <h4 className="text-sm font-medium text-gray-900">{action.name}</h4>
              <p className="text-xs text-gray-600">{action.description}</p>
            </div>
            <span className="text-blue-600">Go</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};

export default SuggestedActions;
