// components/dashboard/GoalsProgress.js

import React, { useState, useEffect } from "react";
import { Target } from "lucide-react";
import { format } from "date-fns";
import { Card, Button } from "@/components/ui";
import firebaseService from "@/lib/services/firebaseService";


const GoalsProgress = ({ currentUser }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch goals when the component mounts
  useEffect(() => {
    const fetchGoals = async () => {
      console.log("Fetching goals for user:", currentUser);
      if (!currentUser?.authenticationID) {
        console.error("No authentication ID found for the current user.");
        return;
      }

      setLoading(true);
      try {
        const goalsData = await firebaseService.queryCollection("goals", {
          where: [{ field: "userId", operator: "==", value: currentUser.authenticationID }],
        });
        console.log("Goals fetched successfully:", goalsData);
        setGoals(goalsData);
      } catch (error) {
        console.error("Error fetching goals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [currentUser]);

  const handleAddGoal = () => {
    console.log("Add Goal button clicked.");
    // Implement the modal or functionality to add a goal
    alert("Add Goal functionality not yet implemented.");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Current Goals</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleAddGoal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-gray-500 py-4">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No goals found.</div>
        ) : (
          goals.slice(0, 3).map((goal) => (
            <div
              key={goal.id}
              className="p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      goal.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : goal.status === "in_progress"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {goal.status.replace("_", " ")}
                  </span>
                  <span className="text-sm text-gray-500">
                    Due {format(new Date(goal.dueDate.seconds * 1000), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <h4 className="font-medium mb-1">{goal.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
            </div>
          ))
        )}

        {goals.length > 3 && (
          <Button
            variant="link"
            className="w-full mt-2"
            onClick={() => console.log("View All Goals clicked")}
          >
            View All Goals
          </Button>
        )}
      </div>
    </Card>
  );
};

export default GoalsProgress;
