// components/milestoneFunnels/MilestoneCard.js

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import MilestoneProgress from "./MilestoneProgress";
import { ChevronRight } from "lucide-react";

const MilestoneCard = ({
  milestone,
  onClick, // Pass from parent if needed
  isSelected,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!milestone?.name) return null;

  const {
    name = "Untitled Milestone",
    description = "",
    progress = 0,
    funnelName = "",
  } = milestone;

  return (
    <Card
      className={`p-4 transition-all duration-200 cursor-pointer hover:shadow-md
        ${isSelected ? "ring-2 ring-blue-500" : ""}
        ${isHovered ? "bg-gray-50" : ""}`}
      onClick={() => onClick?.(milestone)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${name} milestone from ${funnelName}`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-grow">
          <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>
        <ChevronRight
          className={`h-5 w-5 transform transition-transform duration-200 
            ${isHovered ? "translate-x-1" : ""} text-gray-400`}
        />
      </div>

      {/* Progress Meter */}
      <div className="mt-4">
        <MilestoneProgress
          progress={progress}
          isAnimated={true}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </div>

      {/* Simple Funnel Label */}
      <div className="mt-3 text-sm text-gray-500">{funnelName}</div>
    </Card>
  );
};

export default MilestoneCard;
