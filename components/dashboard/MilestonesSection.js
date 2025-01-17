// components/dashboard/MilestonesSection.js

import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { serverTimestamp } from "firebase/firestore";
import firebaseService from "../../lib/services/firebaseService";

const MilestonesSection = ({ currentUser, setCurrentChat }) => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch milestones when component mounts
  useEffect(() => {
    const fetchMilestones = async () => {
      console.log("Fetching milestones for user:", currentUser);
      setLoading(true);
      try {
        const milestonesData = await firebaseService.queryCollection("milestones", {
          where: [{ field: "userId", operator: "==", value: currentUser?.authenticationID }],
        });
        console.log("Milestones fetched successfully:", milestonesData);
        setMilestones(milestonesData);
      } catch (error) {
        console.error("Error fetching milestones:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.authenticationID) {
      fetchMilestones();
    } else {
      console.error("No authentication ID found for the current user.");
    }
  }, [currentUser]);

  const handleStartMilestoneChat = async (milestone) => {
    console.log("Starting chat for milestone:", milestone);
    try {
      const chatData = {
        agentId: milestone.id,
        conversationName: `Milestone: ${milestone.title}`,
        userId: currentUser.authenticationID,
        isDefault: false,
        timestamp: serverTimestamp(),
      };
      console.log("Creating conversation with data:", chatData);

      const newChat = await firebaseService.create("conversationNames", chatData);
      console.log("New milestone chat created:", newChat);

      setCurrentChat({
        id: newChat.id,
        agentId: milestone.id,
        title: `Milestone: ${milestone.title}`,
        participants: [currentUser.authenticationID, milestone.id],
        isDefault: false,
        conversationName: newChat.id,
      });

      console.log("Milestone chat started successfully.");
    } catch (error) {
      console.error("Error starting milestone chat:", error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Milestones</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading milestones...</div>
      ) : milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">{milestone.title}</h4>
                <p className="text-xs text-gray-500">{milestone.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStartMilestoneChat(milestone)}
              >
                Start Chat
              </Button>
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
