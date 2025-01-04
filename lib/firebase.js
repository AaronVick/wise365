// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Debug: Log environment variables (safely)
console.log('Firebase Environment Check:', {
  hasClientId: !!process.env.FIREBASE_CLIENT_ID,
  hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
  hasAuthUri: !!process.env.FIREBASE_AUTH_URI,
  projectId: process.env.FIREBASE_PROJECT_ID
});

const firebaseConfig = {
  apiKey: process.env.FIREBASE_CLIENT_ID,
  authDomain: process.env.FIREBASE_AUTH_URI,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_PRIVATE_KEY_ID,
  appId: process.env.FIREBASE_TYPE
};

// Debug: Log the config (without sensitive data)
console.log('Firebase Config:', {
  hasApiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword };
export default app;