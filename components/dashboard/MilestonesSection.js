// components/dashboard/MilestonesSection.js

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import MilestoneCard from "@/components/milestoneFunnels/MilestoneCard";
import { evaluateUserFunnels } from "@/components/milestoneFunnels/funnelEvaluator";
import { fetchUserFunnels, fetchUserFunnelData } from "@/lib/services/milestoneService";

const MilestonesSection = ({ currentUser, setCurrentChat }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProactiveMilestones = async () => {
      console.log("Starting to fetch proactive milestones for user:", currentUser);

      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch funnel definitions
        console.log("Fetching funnels for user:", currentUser.authenticationID);
        const funnels = await fetchUserFunnels(currentUser.authenticationID);
        console.log("Fetched funnels:", funnels);

        // Step 2: Fetch user-specific funnel data
        console.log("Fetching user funnel data for user:", currentUser.authenticationID);
        const userFunnelData = await fetchUserFunnelData(currentUser.authenticationID);
        console.log("Fetched user funnel data:", userFunnelData);

        // Step 3: Evaluate user funnels to determine next milestones
        console.log("Evaluating user funnels to determine milestones...");
        const evaluatedFunnels = evaluateUserFunnels(funnels, currentUser, userFunnelData);
        console.log("Evaluated funnels:", evaluatedFunnels);

        // Step 4: Extract milestones for proactive guidance
        console.log("Extracting milestones from evaluated funnels...");
        const proactiveMilestones = [
          ...evaluatedFunnels.inProgress,
          ...evaluatedFunnels.ready,
        ].flatMap((funnel) =>
          funnel.milestones.map((milestone) => ({
            ...milestone,
            funnelName: funnel.name,
          }))
        );
        console.log("Proactive milestones extracted:", proactiveMilestones);

        // Step 5: Update state with milestones
        setMilestones(
          proactiveMilestones.length > 0
            ? proactiveMilestones
            : [
                {
                  id: "onboarding",
                  name: "Onboarding Progress",
                  progress: 0,
                  description: "Start here to get onboarded and begin your journey.",
                },
              ]
        );
      } catch (err) {
        console.error("Error fetching proactive milestones:", err);
        setError("Failed to load milestones. Please try again later.");
      } finally {
        console.log("Finished fetching proactive milestones.");
        setLoading(false);
      }
    };

    if (currentUser?.authenticationID) {
      fetchProactiveMilestones();
    } else {
      console.error("No authentication ID found for the current user.");
      setError("User authentication ID is missing.");
    }
  }, [currentUser]);

  const handleMilestoneClick = (milestone) => {
    console.log("Milestone clicked:", milestone);

    if (milestone.agent && milestone.prompt) {
      console.log("Routing to chat with agent:", milestone.agent);
      setCurrentChat({
        agentId: milestone.agent,
        title: `Chat with ${milestone.agent}`,
        participants: [currentUser.authenticationID, milestone.agent],
        prompt: milestone.prompt,
      });
    } else {
      console.warn("Milestone does not have agent or prompt data:", milestone);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Your Next Steps</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading milestones...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div
              key={`${milestone.funnelName}-${milestone.name}`}
              onClick={() => handleMilestoneClick(milestone)}
              className="cursor-pointer"
            >
              <MilestoneCard milestone={milestone} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No milestones available.</div>
      )}
    </Card>
  );
};

export default MilestonesSection;
