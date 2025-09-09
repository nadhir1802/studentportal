import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, push, set, get, onChildAdded, update } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Firebase config
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
const db = getDatabase(app);


const badgeEl = document.getElementById("userBadge");
const groupNameEl = document.getElementById("groupName");
const groupDescEl = document.getElementById("groupDesc");
const createGroupBtn = document.getElementById("createGroupBtn");
const groupsListEl = document.getElementById("groupsList");
const chatSectionEl = document.getElementById("chatSection");
const chatTitleEl = document.getElementById("chatTitle");
const chatMessagesEl = document.getElementById("chatMessages");
const chatInputEl = document.getElementById("chatInput");
const sendMsgBtn = document.getElementById("sendMsgBtn");

let currentUser = null;
let activeGroupId = null;

//Auth Check
onAuthStateChanged(auth, async (user) => {
    if (!user) window.location.href = "signin.html";
    else {
        currentUser = user;
        badgeEl.textContent = `👤 ${user.email}`;
        await loadGroups();
    }
});

//Logout
window.logout = async function() {
    await signOut(auth);
    window.location.href = "signin.html";
};

//Create Group
createGroupBtn.addEventListener("click", async () => {
    if (!currentUser || !currentUser.uid) {
        alert("User not authenticated.");
        return;
    }

    const name = groupNameEl.value.trim();
    const desc = groupDescEl.value.trim();
    if (!name) return alert("Enter a group name!");

    try {
        const groupsRef = ref(db, "groups");
        const newGroupRef = push(groupsRef);

        await set(newGroupRef, {
            name,
            description: desc,
            createdBy: currentUser.uid,
            members: { [currentUser.uid]: true },
            createdAt: Date.now()
        });

        groupNameEl.value = "";
        groupDescEl.value = "";

        await loadGroups();
        alert("Group created!");
    } catch (err) {
        console.error("Failed to create group:", err);
        alert("Error creating group: " + err.message);
    }
});

//Load Group
async function loadGroups() {
    groupsListEl.innerHTML = "";

    try {
        const snapshot = await get(ref(db, "groups"));
        if (snapshot.exists()) {
            const groups = snapshot.val();
            Object.entries(groups).forEach(([id, group]) => {
                if (!group.members || !group.members[currentUser.uid]) return; // only show users groups

                const groupEl = document.createElement("div");
                groupEl.className = "group-card card";
                groupEl.innerHTML = `
                    <h3>${group.name}</h3>
                    <p>${group.description}</p>
                    <div class="row small-gap">
                        <button class="btn" data-id="${id}" data-action="chat">Chat</button>
                        <button class="btn alt" data-id="${id}" data-action="leave">Leave</button>
                    </div>
                `;
                groupsListEl.appendChild(groupEl);
            });

            
            groupsListEl.querySelectorAll("button").forEach(btn => {
                btn.addEventListener("click", handleGroupAction);
            });
        }
    } catch (err) {
        console.error("Failed to load groups:", err);
    }
}

//Handle Group Actions
async function handleGroupAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const groupId = btn.dataset.id;

    if (action === "chat") {
        activeGroupId = groupId;
        chatSectionEl.style.display = "block";
        chatTitleEl.textContent = `Group Chat: ${btn.closest(".group-card").querySelector("h3").innerText}`;
        chatMessagesEl.innerHTML = "";
        loadGroupMessages(groupId);
    } else if (action === "leave") {
        try {
            await update(ref(db, `groups/${groupId}/members/${currentUser.uid}`), null);
            if (activeGroupId === groupId) chatSectionEl.style.display = "none";
            await loadGroups();
        } catch (err) {
            console.error("Failed to leave group:", err);
        }
    }
}

// sSend Message
sendMsgBtn.addEventListener("click", async () => {
    const text = chatInputEl.value.trim();
    if (!text || !activeGroupId) return;

    try {
        const msgRef = push(ref(db, `groupMessages/${activeGroupId}`));
        await set(msgRef, {
            senderId: currentUser.uid,
            senderName: currentUser.email,
            content: text,
            timestamp: Date.now()
        });

        chatInputEl.value = "";
    } catch (err) {
        console.error("Failed to send message:", err);
    }
});

// --- Load Group Messages
function loadGroupMessages(groupId) {
    const msgsRef = ref(db, `groupMessages/${groupId}`);
    onChildAdded(msgsRef, snapshot => {
        const msg = snapshot.val();
        const msgEl = document.createElement("div");
        msgEl.className = "chat-message";
        msgEl.innerHTML = `<strong>${msg.senderName}</strong>: ${msg.content}`;
        chatMessagesEl.appendChild(msgEl);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    });
}