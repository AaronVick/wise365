// pages/api/files.js
import fs from 'fs';
import path from 'path';
import { getAuth } from 'firebase-admin/auth';
import '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    console.error('Invalid request method:', req.method);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Verify authentication token if present in headers
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split('Bearer ')[1];
      try {
        await getAuth().verifyIdToken(token);
      } catch (authError) {
        console.error('Authentication error:', authError);
        return res.status(401).json({ success: false, message: 'Invalid authentication token' });
      }
    }

    // Safely resolve the data folder path
    const dataFolderPath = path.resolve(process.cwd(), 'data');
    
    try {
      // Check if the data directory exists
      if (!fs.existsSync(dataFolderPath)) {
        console.error('Data directory not found:', dataFolderPath);
        return res.status(404).json({ 
          success: false, 
          message: 'Data directory not found' 
        });
      }

      // Read directory contents
      const allFiles = fs.readdirSync(dataFolderPath);
      
      // Filter for valid seed data files (.js or .json)
      const validFiles = allFiles.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.js' || ext === '.json';
      });

      // Sort files alphabetically
      validFiles.sort();

      console.log('Available seed files:', validFiles);

      // Return the list of valid files
      res.status(200).json({ 
        success: true, 
        files: validFiles,
        path: process.env.NODE_ENV === 'development' ? dataFolderPath : undefined 
      });
    } catch (fsError) {
      console.error('File system error:', fsError);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to read data directory',
        error: fsError.message 
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}