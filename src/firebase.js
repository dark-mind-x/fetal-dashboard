import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBGl8mNiLY0QAMhSvqeK6I7JDWskRTGxJM",
  authDomain: "fetal-monitoring-99d41.firebaseapp.com",
  databaseURL: "https://fetal-monitoring-99d41-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fetal-monitoring-99d41",
  storageBucket: "fetal-monitoring-99d41.firebasestorage.app",
  messagingSenderId: "1089070202312",
  appId: "1:1089070202312:web:1cde0f345366ff966a14fd",
  measurementId: "G-4HDTQSY4Z0"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
