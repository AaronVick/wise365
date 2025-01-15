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

    // Step 1: Query `agentData` in batches
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

    // Step 2: Process each record in the batch
    for (const doc of snapshot.docs) {
      const agentData = doc.data();
      const agentId = agentData.agentId; // Current `agentId` in `agentData`
      lastId = doc.id;

      // Fetch corresponding agent record
      const agentDoc = await db.collection('agents').doc(agentId).get();

      // If the agent record exists, update `agentId` to the `agentName`
      if (agentDoc.exists) {
        const agent = agentDoc.data();
        if (agent.agentName) {
          updates.push({
            id: doc.id,
            oldAgentId: agentId,
            newAgentId: agent.agentName,
          });

          // Update the `agentData` record
          await db.collection('agentData').doc(doc.id).update({
            agentId: agent.agentName,
          });
        }
      }
    }

    // Step 3: Return results
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
