import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_CLIENT_ID,
  authDomain: process.env.FIREBASE_AUTH_URI,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.FIREBASE_PRIVATE_KEY_ID,
  appId: process.env.FIREBASE_TYPE,
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // Added Firestore export
export { signInWithEmailAndPassword, createUserWithEmailAndPassword };
export default app;
