// Firebase core imports
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase Auth & Firestore
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBlpxhjMOXaM5H1tnWn43zbR2-8Ic7UpPE",
  authDomain: "hirushattendence.firebaseapp.com",
  projectId: "hirushattendence",
  storageBucket: "hirushattendence.firebasestorage.app",
  messagingSenderId: "250443068584",
  appId: "1:250443068584:web:556e706495e180f281be9d",
  measurementId: "G-4C6EMLP9WJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Auth, Firestore, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;