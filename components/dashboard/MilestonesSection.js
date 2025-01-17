// components/dashboard/MilestonesSection.js
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import MilestoneCard from "@/components/milestoneFunnels/MilestoneCard";
import { evaluateUserMilestones } from "@/components/milestoneFunnels/funnelEvaluator";

const MilestonesSection = ({ currentUser, setCurrentChat }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMilestoneVisuals = async () => {
      console.log("Evaluating milestones for progress meters:", currentUser);
      setLoading(true);
      setError(null);

      try {
        // Call the funnel evaluation function
        const evaluatedMilestones = evaluateUserMilestones(currentUser);

        if (!evaluatedMilestones || evaluatedMilestones.length === 0) {
          console.warn("No milestones evaluated, defaulting to 0% progress.");
          setMilestones([
            {
              id: "onboarding",
              name: "Onboarding Progress",
              progress: 0, // Default progress
              description: "Complete onboarding tasks to get started.",
            },
          ]);
        } else {
          console.log("Evaluated milestones:", evaluatedMilestones);
          setMilestones(evaluatedMilestones);
        }
      } catch (err) {
        console.error("Error evaluating milestones:", err);
        setError("Failed to load milestones. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.authenticationID) {
      fetchMilestoneVisuals();
    } else {
      console.error("No authentication ID found for the current user.");
      setError("User authentication ID is missing.");
    }
  }, [currentUser]);

  const handleMilestoneClick = (milestone) => {
    try {
      console.log(`Milestone clicked: ${milestone.name}`);

      // Set up chat based on milestone details
      if (milestone.agent && milestone.prompt) {
        console.log(`Routing to chat with agent: ${milestone.agent}`);
        setCurrentChat({
          agentId: milestone.agent,
          title: `Chat with ${milestone.agent}`,
          participants: [currentUser.authenticationID, milestone.agent],
          prompt: milestone.prompt, // Injected prompt for the agent
        });

        // Optionally, implement navigation to the chat page
        // router.push(`/chat/${milestone.agent}`);
      } else {
        console.warn("Milestone does not have agent or prompt data.");
      }
    } catch (error) {
      console.error("Error handling milestone click:", error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Milestones</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading milestones...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              onClick={() => handleMilestoneClick(milestone)}
              className="cursor-pointer"
            >
              <MilestoneCard
                milestone={milestone}
                currentUser={currentUser}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No milestones found.</div>
      )}
    </Card>
  );
};

export default MilestonesSection;
