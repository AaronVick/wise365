// pages/api/updateAgentData.js

import { db } from "@/lib/firebase";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lastProcessedId, batchSize = 10 } = req.body;

    // Get agents mapping
    const agentsSnapshot = await db.collection('agents').get();
    const agentsMap = {};
    agentsSnapshot.forEach((doc) => {
      const data = doc.data();
      agentsMap[data.agentId] = data.agentName;
    });

    // Query the next batch of agentData documents
    let query = db.collection('agentData').orderBy('__name__').limit(batchSize);
    if (lastProcessedId) {
      const lastDoc = await db.collection('agentData').doc(lastProcessedId).get();
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    const updates = [];
    let lastId = null;

    // Process each document in the batch
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const agentId = data.agentId;
      lastId = doc.id;

      if (agentsMap[agentId]) {
        const newAgentId = agentsMap[agentId];
        updates.push({
          id: doc.id,
          oldAgentId: agentId,
          newAgentId: newAgentId,
        });

        // Update the document
        await db.collection('agentData').doc(doc.id).update({
          agentId: newAgentId,
        });
      }
    }

    // Return the results
    return res.status(200).json({
      success: true,
      lastProcessedId: lastId,
      updatedCount: updates.length,
      hasMore: !snapshot.empty && snapshot.size === batchSize,
      updates,
    });
  } catch (error) {
    console.error('Error processing agent data update:', error);
    return res.status(500).json({
      error: error.message,
      success: false,
    });
  }
}