// components/DashboardContent.js

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ScrollArea } from "./ui/scroll-area";
import QuickStats from "./dashboard/QuickStats";
import GoalsProgress from "./dashboard/GoalsProgress";
import MilestonesSection from "./dashboard/MilestonesSection";
import ProjectsSection from "./dashboard/ProjectsSection";
import ResourcesSection from "./dashboard/ResourcesSection";
import SuggestedActions from "./dashboard/SuggestedActions";
import WelcomeCard from "./dashboard/WelcomeCard";

const DashboardContent = ({
  currentUser,
  currentTool,
  setCurrentTool,
  currentChat,
  setCurrentChat,
  hasShawnChat,
  setHasShawnChat,
}) => {
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser?.uid) return;
      try {
        console.log("Fetching user data...");
        const response = await fetch(`/api/users/${currentUser.uid}`);
        const data = await response.json();
        console.log("User data loaded:", data);
        setUserData(data);
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };
    loadUserData();
  }, [currentUser?.uid]);

  if (!currentUser) {
    return <div>Loading user data...</div>;
  }

  return (
    <>
      <div className="bg-white border-b h-16 flex items-center px-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Welcome Card */}
          {!hasShawnChat && (
            <WelcomeCard
              currentUser={currentUser}
              setCurrentChat={setCurrentChat}
              setHasShawnChat={setHasShawnChat}
            />
          )}

          {/* Quick Stats */}
          <QuickStats
            recentActivity={currentChat ? [currentChat] : []}
            currentUser={currentUser}
          />

          {/* Goals Progress */}
          <GoalsProgress currentUser={currentUser} />

          {/* Milestones Section */}
          <MilestonesSection
            currentUser={currentUser}
            setCurrentChat={setCurrentChat}
          />

          {/* Projects Section */}
          <ProjectsSection
            currentUser={currentUser}
            setCurrentChat={setCurrentChat}
          />

          {/* Suggested Actions */}
          <SuggestedActions
            currentUser={currentUser}
            userFunnelData={userData?.funnelData || {}}
            resourcesData={userData?.resources || []}
            setCurrentTool={setCurrentTool}
          />

          {/* Resources Section */}
          <ResourcesSection currentUser={currentUser} />
        </div>
      </ScrollArea>
    </>
  );
};

export default DashboardContent;
