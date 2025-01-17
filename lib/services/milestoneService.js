// lib/services/milestoneService.js

import firebaseService from "@/lib/services/firebaseService";

// Fetch funnel definitions from the backend
export const fetchUserFunnels = async (userId) => {
  return firebaseService.query("funnels", {
    where: [{ field: "userId", operator: "==", value: userId }],
  });
};

// Fetch user-specific funnel data
export const fetchUserFunnelData = async (userId) => {
  const data = await firebaseService.query("funnelData", {
    where: [{ field: "userId", operator: "==", value: userId }],
  });

  return data.reduce((acc, funnel) => {
    acc[funnel.funnelName] = funnel;
    return acc;
  }, {});
};
