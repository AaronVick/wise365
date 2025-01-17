// components/dashboard/QuickStats.js

import React from "react";
import { Card } from "@/components/ui/card";


const QuickStats = ({ recentActivity, currentUser }) => {
  // Debug: Log incoming props
  console.log("QuickStats Component Loaded");
  console.log("Recent Activity:", recentActivity);
  console.log("Current User:", currentUser);

  // Null checks and calculated stats
  const activeConversations = recentActivity?.length || 0;
  const teamMembers = currentUser?.teamMembers?.length || 0;
  const activeProjects = 0; // Update this if a project count is available

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Active Conversations */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Active Conversations</h4>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold">{activeConversations}</span>
          <span className="text-sm text-gray-500 ml-2">conversations</span>
        </div>
        {activeConversations === 0 && (
          <p className="text-xs text-gray-400 mt-2">No recent conversations.</p>
        )}
      </Card>

      {/* Team Members */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Team Members</h4>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold">{teamMembers}</span>
          <span className="text-sm text-gray-500 ml-2">members</span>
        </div>
        {teamMembers === 0 && (
          <p className="text-xs text-gray-400 mt-2">No team members found.</p>
        )}
      </Card>

      {/* Active Projects */}
      <Card className="p-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-2">Active Projects</h4>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold">{activeProjects}</span>
          <span className="text-sm text-gray-500 ml-2">projects</span>
        </div>
        {activeProjects === 0 && (
          <p className="text-xs text-gray-400 mt-2">No active projects.</p>
        )}
      </Card>
    </div>
  );
};

export default QuickStats;
