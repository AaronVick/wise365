// pages/api/files.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const dataFolderPath = path.resolve('./data'); // Path to the `data` folder
    const allFiles = fs.readdirSync(dataFolderPath); // Read all files in the folder
    const validFiles = allFiles.filter((file) => file.endsWith('.js') || file.endsWith('.json')); // Only .js or .json files

    console.log('Available files:', validFiles);

    res.status(200).json({ success: true, files: validFiles });
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch files.' });
  }
}
