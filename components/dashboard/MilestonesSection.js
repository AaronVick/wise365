// components/dashboard/MilestonesSection.js

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import MilestoneCard from "@/components/milestoneFunnels/MilestoneCard";
import firebaseService from "@/lib/services/firebaseService";

const MilestonesSection = ({ currentUser, setCurrentChat }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch milestones when the component mounts
  useEffect(() => {
    const fetchMilestones = async () => {
      console.log("Fetching milestones for user:", currentUser);
      setLoading(true);
      setError(null);

      try {
        let queryParams = [{ field: "userId", operator: "==", value: currentUser?.authenticationID }];
        if (currentUser?.teamId) {
          queryParams.push({ field: "teamId", operator: "==", value: currentUser.teamId });
        }

        const milestonesData = await firebaseService.queryCollection("milestones", {
          where: queryParams,
        });

        console.log("Milestones fetched successfully:", milestonesData);
        setMilestones(milestonesData);
      } catch (err) {
        console.error("Error fetching milestones:", err);
        setError("Failed to fetch milestones. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.authenticationID) {
      fetchMilestones();
    } else {
      console.error("No authentication ID found for the current user.");
      setError("User authentication ID is missing.");
    }
  }, [currentUser]);

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
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              currentUser={currentUser}
              setCurrentChat={setCurrentChat}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No milestones found.</div>
      )}
    </Card>
  );
};

export default MilestonesSection;
