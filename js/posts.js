import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  push,
  get,
  update,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

//Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNgmIM9ZuvZ6XGXBLwwjvcA_0iZFeEFgM",
  authDomain: "xhaw-38afb.firebaseapp.com",
  databaseURL: "https://xhaw-38afb-default-rtdb.firebaseio.com",
  projectId: "xhaw-38afb",
  storageBucket: "xhaw-38afb.appspot.com",
  messagingSenderId: "1083342543018",
  appId: "1:1083342543018:web:197cae3d50914ba34098d3",
  measurementId: "G-86ELK1E11Y",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const postType = document.getElementById("postType");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
const postTags = document.getElementById("postTags");
const postBtn = document.getElementById("postBtn");
const feed = document.getElementById("feed");
const search = document.getElementById("feedSearch");

let currentUserProfile = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "signin.html";
  } else {
    try {
      const profileSnap = await get(ref(db, `profiles/${user.uid}`));
      if (profileSnap.exists()) {
        currentUserProfile = profileSnap.val();

        if (!currentUserProfile.id) currentUserProfile.id = user.uid;
      } else {
        alert("Please create your profile first.");
        window.location.href = "profile.html";
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
      alert("Error loading profile");
      window.location.href = "profile.html";
    }
    renderFeed();
  }
});

//  get posts from Firebase
async function getPosts() {
  try {
    const snapshot = await get(ref(db, "posts"));
    const posts = snapshot.exists() ? snapshot.val() : {};
    return Object.entries(posts).map(([id, p]) => ({ id, ...p }));
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    return [];
  }
}

// render feed
async function renderFeed() {
  const posts = await getPosts();
  const q = search?.value?.toLowerCase?.() || "";
  const filtered = posts
    .filter((p) =>
      [p.title, p.content, (p.tags || []).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  feed.innerHTML =
    filtered
      .map((p) => {
        const liked =
          p.likes &&
          currentUserProfile &&
          p.likes.includes(currentUserProfile.id);
        const av = `<div class="avatar-small" style="background:${CC.avatarColor(
          p.authorName
        )}">${CC.initials(p.authorName)}</div>`;
        const tagHtml = (p.tags || [])
          .map((t) => `<span class="tag-pill">#${t}</span>`)
          .join(" ");
        return `
      <div class="post-card" data-id="${p.id}">
        <div class="post-meta">${av}<div><div class="post-title">${
          p.title
        }</div><div class="small-note">${p.authorName} • ${
          p.date
        }</div></div></div>
        <p style="margin:10px 0">${p.content}</p>
        <div class="small-note">${tagHtml}</div>
        <div class="post-actions">
          <button class="action-btn like-btn ${
            liked ? "liked" : ""
          }" data-id="${p.id}">👍 <span class="like-count">${
          (p.likes || []).length
        }</span></button>
          <button class="action-btn" data-action="share" data-id="${
            p.id
          }">🔗 Share</button>
        </div>
      </div>
    `;
      })
      .join("") || "<p>No posts yet. Be the first to post!</p>";
}

//dd post
postBtn.addEventListener("click", async () => {
  if (!currentUserProfile) {
    alert("Please create profile first.");
    location.href = "profile.html";
    return;
  }

  const title = postTitle.value.trim();
  const content = postContent.value.trim();
  if (!title || !content) {
    alert("Fill title and content");
    return;
  }
  const tags = postTags.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const newPostRef = push(ref(db, "posts"));
    await newPostRef.set({
      authorName: currentUserProfile.name || "Anonymous",
      authorId: currentUserProfile.id,
      type: postType?.value || "post",
      title,
      content,
      tags,
      likes: [],
      date: new Date().toLocaleString(),
      timestamp: Date.now(),
    });

    postTitle.value = "";
    postContent.value = "";
    postTags.value = "";

    CC.confettiBurst(14);
    await renderFeed();
  } catch (err) {
    console.error("Failed to post:", err);
    alert("Error posting: " + err.message);
  }
});

feed.addEventListener("click", async (ev) => {
  const likeBtn = ev.target.closest(".like-btn");
  if (likeBtn) {
    const postId = likeBtn.dataset.id;
    if (!currentUserProfile) {
      alert("Please create profile first");
      return;
    }
    const postRef = ref(db, `posts/${postId}/likes`);
    const snapshot = await get(postRef);
    let likes = snapshot.exists() ? snapshot.val() : [];
    const idx = likes.indexOf(currentUserProfile.id);
    if (idx === -1) likes.push(currentUserProfile.id), CC.confettiBurst(8);
    else likes.splice(idx, 1);
    await update(ref(db, `posts/${postId}`), { likes });
    await renderFeed();
  }

  const shareBtn = ev.target.closest('[data-action="share"]');
  if (shareBtn) {
    const postId = shareBtn.dataset.id;
    navigator.clipboard
      ?.writeText(location.href + "?post=" + postId)
      .then(() => alert("Link copied!"));
  }
});

// --- Search
search && search.addEventListener("input", renderFeed);
