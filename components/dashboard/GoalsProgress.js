// components/dashboard/GoalsProgress.js

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import firebaseService from "@/lib/services/firebaseService";
import ChatInterface from "@/components/ChatInterface";

const GoalsSection = ({ currentUser, setCurrentChat }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGoals = async () => {
      console.log("Fetching goals for user:", currentUser);
      setLoading(true);
      setError(null);

      try {
        const queryParams = [{ field: "userId", operator: "==", value: currentUser?.authenticationID }];
        if (currentUser?.teamId) {
          queryParams.push({ field: "teamId", operator: "==", value: currentUser.teamId });
        }

        const goalsData = await firebaseService.queryCollection("goals", {
          where: queryParams,
        });

        console.log("Goals fetched successfully:", goalsData);
        setGoals(goalsData);
      } catch (err) {
        console.error("Error fetching goals:", err);
        setError("Failed to fetch goals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.authenticationID) {
      fetchGoals();
    } else {
      console.error("No authentication ID found for the current user.");
      setError("User authentication ID is missing.");
    }
  }, [currentUser]);

  const handleGoalClick = async (goal) => {
    try {
      console.log(`Goal clicked: ${goal.title}`);

      // Check or create conversation for the goal
      const existingConversation = await firebaseService.queryCollection("conversations", {
        where: [
          { field: "conversationName", operator: "==", value: goal.title },
        ],
      });

      let conversationId;
      if (existingConversation.length > 0) {
        conversationId = existingConversation[0].id;
        console.log("Existing conversation found:", conversationId);
      } else {
        console.log("No existing conversation, creating a new one.");
        const newConversation = await firebaseService.create("conversations", {
          conversationName: goal.title,
          agentId: goal.agentId || "default-agent",
          participants: [currentUser.authenticationID, goal.agentId || "default-agent"],
          isDefault: false,
          projectId: goal.parentTaskId || null,
        });
        conversationId = newConversation.id;
      }

      // Route to chat
      setCurrentChat({
        chatId: conversationId,
        agentId: goal.agentId || "default-agent",
        title: `Goal: ${goal.title}`,
        participants: [currentUser.authenticationID, goal.agentId || "default-agent"],
      });
    } catch (error) {
      console.error("Error handling goal click:", error);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Goals</h3>
      {loading ? (
        <div className="text-center text-gray-500">Loading goals...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => handleGoalClick(goal)}
              className="cursor-pointer"
            >
              <div className="p-4 border rounded-lg shadow-sm hover:bg-gray-50">
                <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                <p className="text-sm text-gray-500">{goal.description}</p>
                <div className="text-xs text-gray-400">
                  Status: {goal.status || "unknown"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No goals found.</div>
      )}
    </Card>
  );
};

export default GoalsSection;
