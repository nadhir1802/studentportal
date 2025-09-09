import { getDatabase, ref, push, get, update } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

const auth = getAuth();
const db = getDatabase();
const storage = getStorage();

const shareBtn = document.getElementById("shareMatBtn");
const materialsList = document.getElementById("materialsList");
const matTitle = document.getElementById("matTitle");
const matCourse = document.getElementById("matCourse");
const matDesc = document.getElementById("matDesc");
const matFile = document.getElementById("matFile");
const searchInput = document.getElementById("materialsSearch");

let currentUser = null;

auth.onAuthStateChanged(user => {
  if (!user) window.location.href = "signin.html";
  else currentUser = user;
  loadMaterials();
});

async function loadMaterials() {
  const snapshot = await get(ref(db, "materials"));
  materialsList.innerHTML = "";
  if (!snapshot.exists()) return;
  const materials = snapshot.val();
  const q = searchInput?.value.toLowerCase() || "";
  
  Object.entries(materials)
    .filter(([id, m]) => (m.title + m.course + m.desc).toLowerCase().includes(q))
    .sort((a,b) => b[1].timestamp - a[1].timestamp)
    .forEach(([id, m]) => {
      const div = document.createElement("div");
      div.className = "material-card card";
      div.innerHTML = `
        <h4>${m.title}</h4>
        <p><strong>Course:</strong> ${m.course}</p>
        <p>${m.desc}</p>
        <p><strong>Uploader:</strong> ${m.uploaderName}</p>
        <div class="row">
          ${m.fileUrl ? `<a href="${m.fileUrl}" target="_blank" class="btn small">Download</a>` : ""}
          ${m.access === "protected" ? `<span class="small-note">🔒 Protected</span>` : ""}
        </div>
      `;
      materialsList.appendChild(div);
    });
}

searchInput?.addEventListener("input", loadMaterials);

shareBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("Please login");

  const title = matTitle.value.trim();
  const course = matCourse.value.trim();
  const desc = matDesc.value.trim();
  const file = matFile.files[0];

  if (!title || !course || !desc) return alert("Fill all fields");

  let fileUrl = "";
  let fileName = "";

  if (file) {
    const storageRef = sRef(storage, `materials/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    fileUrl = await getDownloadURL(storageRef);
    fileName = file.name;
  }

  const newMatRef = push(ref(db, "materials"));
  await newMatRef.set({
    title,
    course,
    desc,
    fileUrl,
    fileName,
    access: "public", 
    uploaderId: currentUser.uid,
    uploaderName: currentUser.email,
    timestamp: Date.now()
  });

  matTitle.value = "";
  matCourse.value = "";
  matDesc.value = "";
  matFile.value = "";

  loadMaterials();
});