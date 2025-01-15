// pages/api/updateAgentData.js

import { getFirestore } from 'firebase-admin/firestore';
import "@/lib/firebaseAdmin"; // Ensure Admin SDK is initialized

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lastProcessedId, batchSize = 10 } = req.body;

    // Step 1: Fetch all agents into a map
    const agentsSnapshot = await db.collection('agents').get();
    const agentsMap = {};
    agentsSnapshot.forEach((doc) => {
      const data = doc.data();
      agentsMap[data.agentId] = data.agentName;
    });

    // Step 2: Query `agentData` in batches
    let query = db.collection('agentData').orderBy('__name__').limit(batchSize);
    if (lastProcessedId) {
      const lastDoc = await db.collection('agentData').doc(lastProcessedId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        lastProcessedId: null,
        updatedCount: 0,
        hasMore: false,
        updates: [],
      });
    }

    const updates = [];
    let lastId = null;

    // Step 3: Process each record in the batch
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const agentId = data.agentId; // Current agentId in `agentData`
      lastId = doc.id;

      // If the agentId is already a name, skip it
      if (Object.values(agentsMap).includes(agentId)) {
        continue;
      }

      // If agentId matches an entry in `agents`, update it
      const newAgentId = agentsMap[agentId];
      if (newAgentId) {
        updates.push({
          id: doc.id,
          oldAgentId: agentId,
          newAgentId,
        });

        // Update the document in Firestore
        await db.collection('agentData').doc(doc.id).update({
          agentId: newAgentId,
        });
      }
    }

    // Step 4: Return results
    return res.status(200).json({
      success: true,
      lastProcessedId: lastId,
      updatedCount: updates.length,
      hasMore: snapshot.size === batchSize,
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
