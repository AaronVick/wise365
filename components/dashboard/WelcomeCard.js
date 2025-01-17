// components/dashboard/WelcomeCard.js

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { serverTimestamp } from "firebase/firestore";
import firebaseService from "@/lib/services/firebaseService";


const WelcomeCard = ({ currentUser, setCurrentChat, setHasShawnChat }) => {
  const startShawnChat = async () => {
    console.log("Initializing chat with Shawn...");
    try {
      // Validate user data
      if (!currentUser?.authenticationID) {
        console.error("No authentication ID found for the current user");
        return;
      }

      // Log current user info
      console.log("Current User:", currentUser);

      // Create new conversation in 'conversationNames'
      const chatData = {
        agentId: "shawn",
        conversationName: "Chat with Shawn",
        userId: currentUser.authenticationID,
        isDefault: true,
        timestamp: serverTimestamp(),
      };
      console.log("Creating conversation with data:", chatData);

      const newChat = await firebaseService.create("conversationNames", chatData);
      console.log("New conversation created:", newChat);

      // Add an initial system message in 'conversations'
      const initialMessage = {
        agentId: "shawn",
        content: "Started conversation with Shawn",
        conversationName: newChat.id,
        from: "shawn",
        isDefault: true,
        timestamp: serverTimestamp(),
        type: "system",
      };
      console.log("Creating initial system message:", initialMessage);

      await firebaseService.create("conversations", initialMessage);
      console.log("Initial system message created successfully");

      // Update the current chat state
      setCurrentChat({
        id: newChat.id,
        agentId: "shawn",
        title: "Chat with Shawn",
        participants: [currentUser.authenticationID, "shawn"],
        isDefault: true,
        conversationName: newChat.id,
      });
      console.log("Current chat state updated");

      // Set Shawn chat as active
      setHasShawnChat(true);
      console.log("Shawn chat is now active");
    } catch (error) {
      console.error("Error starting Shawn chat:", error);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-semibold">S</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Welcome to Business Wise365!</h3>
          <p className="text-gray-600 mb-4">
            Hi, I'm Shawn, your personal guide to our AI team. I'll help you navigate our platform
            and connect you with the right experts for your business needs.
          </p>
          <Button onClick={startShawnChat} className="bg-blue-600 hover:bg-blue-700 text-white">
            Chat with Shawn
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default WelcomeCard;
