// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// Debug: Log config status
console.log(`Firebase config loaded - projectId: ${firebaseConfig.projectId ? 'present' : 'missing'}`);

// Check if config is valid
const isConfigValid = Object.values(firebaseConfig).every(value => value !== "");
if (!isConfigValid) {
  console.error("Firebase configuration is incomplete. Some environment variables are missing.");
}

// Initialize with default null value
let db: any = null;
let functions: any = null;

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  // Initialize Firestore with settings for better network handling
  db = getFirestore(app);

  // Initialize Functions
  functions = getFunctions(app);

  // Connect to emulator in development
  if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log("Connected to Firebase Functions emulator");
  }

  // Force long polling in production to solve connection issues
  if (import.meta.env.PROD) {
    db.settings({
      experimentalForceLongPolling: true,
      useFetchStreams: false
    });
    console.log("Firebase Firestore using long polling for better production connectivity");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { db, functions }; 