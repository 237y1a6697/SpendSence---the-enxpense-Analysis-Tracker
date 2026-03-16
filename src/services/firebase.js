import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase Project Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyCgXv6AFjeFSmuLk3b3-aUUlohG8-JXziQ",
  authDomain: "spendsense-8ebab.firebaseapp.com",
  projectId: "spendsense-8ebab",
  storageBucket: "spendsense-8ebab.firebasestorage.app",
  messagingSenderId: "689977116571",
  appId: "1:689977116571:web:be8e7a124c611d4b42033e",
  measurementId: "G-XJPCVSR5N9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
