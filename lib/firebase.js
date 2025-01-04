// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_CLIENT_ID, // Replaces "apiKey"
  authDomain: process.env.FIREBASE_AUTH_URI, // Replaces "authDomain"
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`, // Firebase default storage bucket format
  messagingSenderId: process.env.FIREBASE_PRIVATE_KEY_ID, // Replaces "messagingSenderId"
  appId: process.env.FIREBASE_TYPE // Replaces "appId"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
