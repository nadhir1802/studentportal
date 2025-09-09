// js/profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, set, get, child, remove } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

// init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// make logout available global
window.logout = async function() {
  try {
    await signOut(auth);
    window.location.href = "signin.html";
  } catch (err) {
    console.error("Logout error:", err);
    alert("Could not log out: " + err.message);
  }
};

// DOM refs
const nameInput = document.getElementById("name");
const courseInput = document.getElementById("course");
const yearInput = document.getElementById("year");
const skillsInput = document.getElementById("skills");
const bioInput = document.getElementById("bio");

const saveBtn = document.getElementById("saveProfileBtn");
const clearBtn = document.getElementById("clearProfileBtn");

const previewSection = document.getElementById("profilePreview");
const profileDisplay = document.getElementById("profileDisplay");
const allProfilesDiv = document.getElementById("allProfiles");

// helper to show / hide preview
function showPreview(profile) {
  profileDisplay.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(profile.name)}</p>
    <p><strong>Course:</strong> ${escapeHtml(profile.course)}</p>
    <p><strong>Year:</strong> ${escapeHtml(profile.year)}</p>
    <p><strong>Skills:</strong> ${escapeHtml(profile.skills)}</p>
    <p><strong>Bio:</strong> ${escapeHtml(profile.bio)}</p>
    <p><strong>Email:</strong> ${escapeHtml(profile.email)}</p>
  `;
  previewSection.classList.remove("hidden");
}

function fillForm(profile) {
  nameInput.value = profile.name || "";
  courseInput.value = profile.course || "";
  yearInput.value = profile.year || "";
  skillsInput.value = profile.skills || "";
  bioInput.value = profile.bio || "";
}

function clearForm() {
  nameInput.value = "";
  courseInput.value = "";
  yearInput.value = "";
  skillsInput.value = "";
  bioInput.value = "";
}

// simple escaping to avoid injecting HTML
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Save profile to Firebase under /profiles/{uid
async function saveProfileToFirebase(uid, profile) {
  const userRef = ref(db, "profiles/" + uid);
  await set(userRef, profile);
}

// Remove profile
async function removeProfileFromFirebase(uid) {
  const userRef = ref(db, "profiles/" + uid);
  await remove(userRef);
}

// Load one profile
async function loadProfileFromFirebase(uid) {
  const dbRef = ref(db);
  const snap = await get(child(dbRef, "profiles/" + uid));
  return snap.exists() ? snap.val() : null;
}

// Load all profiles (object key by uid)
async function loadAllProfilesFromFirebase() {
  const dbRef = ref(db);
  const snap = await get(child(dbRef, "profiles"));
  return snap.exists() ? snap.val() : {};
}

// render other profiles (excludes current user)
function renderAllProfiles(profilesObj = {}, currentUid) {
  allProfilesDiv.innerHTML = "";
  const uids = Object.keys(profilesObj || {});
  if (uids.length === 0) {
    allProfilesDiv.innerHTML = "<p>No profiles yet.</p>";
    return;
  }
  for (const uid of uids) {
    if (uid === currentUid) continue;
    const p = profilesObj[uid];
    const card = document.createElement("div");
    card.className = "card"; // reuse card style
    card.style.marginBottom = "10px";
    card.innerHTML = `
      <h4>${escapeHtml(p.name || "Unnamed")}</h4>
      <p class="small-note"><strong>Course:</strong> ${escapeHtml(p.course || "-")}</p>
      <p class="small-note"><strong>Year:</strong> ${escapeHtml(p.year || "-")}</p>
      <p class="small-note"><strong>Skills:</strong> ${escapeHtml(p.skills || "-")}</p>
      <p class="small-note"><strong>Bio:</strong> ${escapeHtml(p.bio || "-")}</p>
      <p class="small-note"><em>${escapeHtml(p.email || "")}</em></p>
    `;
    allProfilesDiv.appendChild(card);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Save
  saveBtn?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to save a profile.");
      return;
    }

    const profile = {
      name: nameInput.value.trim(),
      course: courseInput.value.trim(),
      year: yearInput.value.trim(),
      skills: skillsInput.value.trim(),
      bio: bioInput.value.trim(),
      email: user.email,
    };

    if (!profile.name) {
      alert("Please enter your name.");
      return;
    }

    try {
      await saveProfileToFirebase(user.uid, profile);
      showPreview(profile);
      alert("Profile saved to Firebase ✅");
  
      const all = await loadAllProfilesFromFirebase();
      renderAllProfiles(all, user.uid);
    } catch (err) {
      console.error(err);
      alert("Error saving profile: " + (err.message || err));
    }
  });


  clearBtn?.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Not logged in.");
      return;
    }
    if (!confirm("Delete your profile from Firebase? This cannot be undone.")) return;
    try {
      await removeProfileFromFirebase(user.uid);
      clearForm();
      previewSection.classList.add("hidden");
      alert("Profile removed.");
      const all = await loadAllProfilesFromFirebase();
      renderAllProfiles(all, user.uid);
    } catch (err) {
      console.error(err);
      alert("Error removing profile: " + (err.message || err));
    }
  });
});

// auth guard + initial load 
onAuthStateChanged(auth, async (user) => {
  const badge = document.getElementById("userBadge");
  if (!user) {
    // Not logged in -> redirect to sign-in
    window.location.href = "signin.html";
    return;
  }
  // show email
  if (badge) badge.innerText = `👤 ${user.email}`;

  try {
    // load my profile to populate form/preview
    const me = await loadProfileFromFirebase(user.uid);
    if (me) {
      fillForm(me);
      showPreview(me);
    }

    // load all profiles for directory
    const allProfiles = await loadAllProfilesFromFirebase();
    renderAllProfiles(allProfiles, user.uid);
  } catch (err) {
    console.error("Error during profile load:", err);
  }
});