// pages/api/admin/import.js

import { getFirestore } from 'firebase-admin/firestore';
import '../../../lib/firebaseAdmin'; // This handles Firebase initialization
import agentData from '@/data/seedData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Starting agentData import process...');
    const db = getFirestore();

    const agentsSnapshot = await db.collection('agents').get();
    const agentsMap = new Map();
    agentsSnapshot.forEach((doc) => {
      agentsMap.set(doc.data().name, doc.id); // Assuming `name` is unique
    });

    const batch = db.batch();

    agentData.forEach((record) => {
      const agentId = agentsMap.get(record.agentId);
      if (!agentId) {
        console.warn(`No agent found for name: ${record.agentId}`);
        return;
      }

      const docRef = db.collection('agentData').doc();
      const timestamp = new Date().toISOString();

      batch.set(docRef, {
        ...record,
        agentId, // Use fetched agent ID
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      console.log(`Added record for agent ${record.agentId} to batch.`);
    });

    console.log('Committing batch...');
    await batch.commit();
    console.log('Batch committed successfully.');

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${agentData.length} records into agentData collection.`,
    });
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Import failed.',
      error: error.message,
    });
  }
}
