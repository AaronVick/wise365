// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Debug: Log environment variables (safely)
console.log('Firebase Environment Check:', {
  // Client-side variables
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // Server-side variables
  hasServerClientId: !!process.env.FIREBASE_CLIENT_ID,
  hasServerProjectId: !!process.env.FIREBASE_PROJECT_ID,
});

// Use the NEXT_PUBLIC_ variables for client-side Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,           // Changed from FIREBASE_CLIENT_ID
  authDomain: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,  // Changed to use project ID
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,     // Changed from FIREBASE_PROJECT_ID
  storageBucket: `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // Changed from PRIVATE_KEY_ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID             // Changed from FIREBASE_TYPE
};

// Debug: Log the config (without sensitive data)
console.log('Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 8) : 'missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  hasAppId: !!firebaseConfig.appId
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.error('Firebase Config State:', {
    apiKeyLength: firebaseConfig.apiKey?.length || 0,
    authDomainSet: !!firebaseConfig.authDomain,
    projectIdSet: !!firebaseConfig.projectId
  });
  throw error;
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export default app;