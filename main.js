/*
Imports all modules and starts the first game of Jezzball
*/
"use strict";
   <script defer type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
        import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyC4bjg7lVwd8FU8MREaPhBsBENv5qmiYYM",
            authDomain: "calendrier-de-l-avent-54e3a.firebaseapp.com",
            databaseURL: "https://calendrier-de-l-avent-54e3a-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "calendrier-de-l-avent-54e3a",
            storageBucket: "calendrier-de-l-avent-54e3a.appspot.com",
            messagingSenderId: "850639567855",
            appId: "1:850639567855:web:0d799a1ecca005fcff141a",
            measurementId: "G-PC1W7RYVEH"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        let userId = '';
        let totalPlayCountGame17 = 0;
        let highestScore = 0;

onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                document.getElementById('userStatus').innerText = `Bienvenue : ${user.email}`;

                const userRef = doc(db, 'users', userId);
                const docSnap = await getDoc(userRef);

                if (!docSnap.exists()) {
                    await setDoc(userRef, { userId: userId, highestScoreGame17: 0, UserEmail: user.email });
                } else {
                    const userData = docSnap.data();
    
                    highestScore = userData.highestScoreGame17 || 0;
                    UserEmail: user.email
              
                }
            } else {
                window.location.href = 'login.html';
            }
        });


import { initGame } from './game.js';
initGame();
