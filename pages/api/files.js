// pages/api/files.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { collection } = req.query;

  if (!collection) {
    console.error('Missing collection query parameter.');
    return res.status(400).json({ success: false, message: 'Missing collection query parameter' });
  }

  try {
    // Define the path to the `data` folder
    const dataFolderPath = path.resolve('./data');

    // Read all files in the folder
    const allFiles = fs.readdirSync(dataFolderPath);

    // Filter files relevant to the specified collection
    const collectionFiles = allFiles.filter((file) => {
      // Match files based on collection name
      return file.toLowerCase().includes(collection.toLowerCase()) && (file.endsWith('.js') || file.endsWith('.json'));
    });

    console.log(`Files for collection "${collection}":`, collectionFiles);

    // Return the list of files
    res.status(200).json({ success: true, files: collectionFiles });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ success: false, message: 'Error retrieving files.' });
  }
}
