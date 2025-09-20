import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBQjdav3EJ-o2fl8BBPCeTUbbOUEiflvo",
  authDomain: "votacion-70997.firebaseapp.com",
  projectId: "votacion-70997",
  storageBucket: "votacion-70997.firebasestorage.app",
  messagingSenderId: "513606297869",
  appId: "1:513606297869:web:07cdf5dd38b80a83c12844",
  measurementId: "G-1PJQPN31BW"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
