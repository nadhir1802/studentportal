import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNgmIM9ZuvZ6XGXBLwwjvcA_0iZFeEFgM",
    authDomain: "xhaw-38afb.firebaseapp.com",
    databaseURL: "https://xhaw-38afb-default-rtdb.firebaseio.com",
    projectId: "xhaw-38afb",
    storageBucket: "xhaw-38afb.appspot.com",
    messagingSenderId: "1083342543018",
    appId: "1:1083342543018:web:197cae3d50914ba34098d3",
    measurementId: "G-86ELK1E11Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function requireAuth(redirectTo = "signin.html") {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = redirectTo;
        }
    });
}

export function showUserBadge(elementId) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById(elementId).innerText = `👤 ${user.email}`;
        }
    });
}

window.logout = async function() {
    await signOut(auth);
    window.location.href = "signin.html";
};

export { auth };