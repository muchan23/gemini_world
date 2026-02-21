import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyBz3zjeSA6l6Pz6b9yJ9KGHF2lfbsytRN4",
    authDomain: "geminiworld-ecf66.firebaseapp.com",
    projectId: "geminiworld-ecf66",
    storageBucket: "geminiworld-ecf66.firebasestorage.app",
    messagingSenderId: "1007692506411",
    appId: "1:1007692506411:web:7e7ecf49851dd6a53e116e",
    measurementId: "G-YFB8907PFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const functions = getFunctions(app);
