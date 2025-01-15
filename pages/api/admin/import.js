// pages/api/admin/import.js
import { getFirestore } from 'firebase-admin/firestore';
import '../../../lib/firebaseAdmin';
import agentData from '@/data/seedData';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Starting agentData import process...');
    const db = getFirestore();
    
    // Get all existing agents to map names to IDs
    const agentsSnapshot = await db.collection('agents').get();
    const agentsMap = new Map();
    agentsSnapshot.forEach((doc) => {
      agentsMap.set(doc.data().agentName.toLowerCase(), doc.id);
    });

    // Get existing agentData records to avoid duplicates
    const existingDataSnapshot = await db.collection('agentData').get();
    const existingData = new Set();
    existingDataSnapshot.forEach((doc) => {
      const data = doc.data();
      // Create a unique key for each record using agentId and datatype
      const key = `${data.agentId}_${data.datatype}`;
      existingData.add(key);
    });

    const batch = db.batch();
    let importCount = 0;
    let skipCount = 0;

    for (const record of agentData) {
      // Find the agent ID from the name mapping
      const agentName = record.agentId.toLowerCase();
      const agentId = agentsMap.get(agentName);
      
      if (!agentId) {
        console.warn(`No agent found for name: ${agentName}`);
        continue;
      }

      // Check if this record already exists
      const recordKey = `${agentId}_${record.datatype}`;
      if (existingData.has(recordKey)) {
        console.log(`Skipping existing record: ${recordKey}`);
        skipCount++;
        continue;
      }

      const docRef = db.collection('agentData').doc();
      const timestamp = new Date().toISOString();

      batch.set(docRef, {
        ...record,
        agentId, // Use the mapped agent ID instead of the name
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      console.log(`Added record for agent ${agentName} (${agentId}) to batch.`);
      importCount++;

      // Firebase has a limit of 500 operations per batch
      if (importCount % 400 === 0) {
        await batch.commit();
        console.log(`Committed batch of ${importCount} records`);
        batch = db.batch(); // Start a new batch
      }
    }

    // Commit any remaining records
    if (importCount % 400 !== 0) {
      await batch.commit();
    }

    console.log('Import completed successfully.');
    return res.status(200).json({
      success: true,
      message: `Successfully imported ${importCount} new records. Skipped ${skipCount} existing records.`,
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