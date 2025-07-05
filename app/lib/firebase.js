// app/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHL4XTqDr2KJXtl6W_4_oiFfLuHCYLdHI",
  authDomain: "hndl-abc7a.firebaseapp.com",
  projectId: "hndl-abc7a",
  storageBucket: "hndl-abc7a.firebasestorage.app",
  messagingSenderId: "394550616860",
  appId: "1:394550616860:web:8f140218cb3cb78e6fd0d9",
  measurementId: "G-407YESMF9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
