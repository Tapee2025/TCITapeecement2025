import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// Replace with your Firebase config values
const firebaseConfig = {
  apiKey: "AIzaSyDHx6qL3oUtAhER8iZk1DpXKDtjX1cqV5Q",
  authDomain: "tapee-cement-loyalty.firebaseapp.com",
  projectId: "tapee-cement-loyalty",
  storageBucket: "tapee-cement-loyalty.appspot.com",
  messagingSenderId: "578165970123",
  appId: "1:578165970123:web:96a5cc79f6bd3e95d91e73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;