// pages/api/funnelAnalyzer.js

import { collection, getDocs, query, where, updateDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";


/**
 * Fetches funnel data for a team and maps it against global funnel definitions.
 * @param {string} teamId - The team ID to fetch funnel data for.
 * @returns {Object} Mapped funnel progress.
 */
export const mapFunnelDataToFunnels = async (teamId) => {
  try {
    // Step 1: Get all team users
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("teamId", "==", teamId));
    const userSnapshot = await getDocs(userQuery);
    const userIds = userSnapshot.docs.map((doc) => doc.id);

    // Step 2: Get all conversations for team users
    const conversationsRef = collection(db, "conversations");
    const convoQuery = query(conversationsRef, where("participants", "array-contains-any", userIds));
    const convoSnapshot = await getDocs(convoQuery);
    const conversations = convoSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Step 3: Fetch global funnel definitions
    const funnelsRef = collection(db, "funnels");
    const funnelSnapshot = await getDocs(funnelsRef);
    const funnels = funnelSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return { conversations, funnels };
  } catch (error) {
    console.error("Error mapping funnel data to funnels:", error);
    return { conversations: [], funnels: [] };
  }
};

/**
 * Evaluates team progress on funnel milestones.
 * @param {Array} conversations - All conversations for the team.
 * @param {Array} milestones - Milestones for a specific funnel.
 * @returns {Array} Progress for each milestone.
 */
export const evaluateMilestoneProgress = (conversations, milestones) => {
  return milestones.map((milestone) => {
    const relevantConvos = conversations.filter(
      (c) => c.conversationName === milestone.conversationId && !c.reviewed?.[milestone.conversationId]
    );

    const isComplete = milestone.validationLogic
      ? validateMilestoneLogic(relevantConvos, milestone.validationLogic)
      : relevantConvos.length > 0;

    return {
      milestone,
      isComplete,
      relevantConversations: relevantConvos.map((c) => c.id),
    };
  });
};

/**
 * Validates milestone logic based on conversation content.
 * @param {Array} conversations - Conversations linked to the milestone.
 * @param {string} validationLogic - Logic to validate milestone completion.
 * @returns {boolean} Whether the milestone criteria are met.
 */
const validateMilestoneLogic = (conversations, validationLogic) => {
  return conversations.some((convo) =>
    validationLogic.keywords.every((keyword) => convo.content.includes(keyword))
  );
};

/**
 * Aggregates funnelData and determines whether to override or keep existing entries.
 * @param {Object} existingData - Current data in funnelData.
 * @param {Object} newData - Newly extracted data.
 * @returns {Object} Updated funnel data.
 */
export const aggregateFunnelData = (existingData, newData) => {
  const existingTimestamp = new Date(existingData.timestamp).getTime();
  const newTimestamp = new Date(newData.timestamp).getTime();

  if (newData.relevance === "high" || newTimestamp > existingTimestamp) {
    return {
      ...existingData,
      ...newData,
    };
  }

  return existingData;
};

/**
 * Marks conversations as reviewed and logs extracted data for further use.
 * @param {Array} conversationIds - IDs of conversations to mark.
 * @param {string} analysisModule - Name of the file/module performing the analysis.
 * @param {Object} extractionDetails - Details about extracted data.
 */
export const markConversationsReviewed = async (conversationIds, analysisModule, extractionDetails) => {
  try {
    const timestamp = new Date().toISOString();

    for (const convoId of conversationIds) {
      const convoRef = doc(db, "conversations", convoId);

      await updateDoc(convoRef, {
        [`reviewed.${analysisModule}`]: {
          timestamp,
          extracted: !!extractionDetails,
          data: extractionDetails || null,
        },
      });

      if (extractionDetails) {
        const funnelDataRef = doc(db, "funnelData", extractionDetails.funnelId);
        await setDoc(
          funnelDataRef,
          {
            teamId: extractionDetails.teamId,
            userId: extractionDetails.userId,
            milestones: {
              [extractionDetails.milestone]: {
                relevance: extractionDetails.relevance,
                value: extractionDetails.value,
                timestamp,
              },
            },
          },
          { merge: true }
        );
      }
    }
  } catch (error) {
    console.error("Error marking conversations as reviewed:", error);
  }
};

/**
 * Main function to analyze team conversations and update funnel data.
 * @param {string} teamId - The ID of the team to analyze.
 * @param {string} analysisModule - The module performing the analysis.
 */
export const analyzeTeamConversations = async (teamId, analysisModule) => {
  const { conversations, funnels } = await mapFunnelDataToFunnels(teamId);

  for (const funnel of funnels) {
    const milestoneProgress = evaluateMilestoneProgress(conversations, funnel.milestones);

    const analyzedConvos = milestoneProgress.flatMap((m) => m.relevantConversations);
    const extractedData = milestoneProgress
      .filter((m) => m.isComplete)
      .map((m) => ({
        funnelId: funnel.id,
        teamId,
        userId: "user456", // Replace dynamically
        relevance: "high",
        value: `Milestone "${m.milestone.name}" completed.`,
        milestone: m.milestone.name,
      }));

    for (const data of extractedData) {
      const existingData = {}; // Fetch dynamically from funnelData
      const updatedData = aggregateFunnelData(existingData, data);

      await markConversationsReviewed(analyzedConvos, analysisModule, updatedData);
    }
  }
};
