import { db } from "./app.js";
import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// 🔄 Cargar lista de jueces al cargar la página
async function loadJudges() {
  const listContainer = document.getElementById("judgesList");
  listContainer.innerHTML = "Cargando jueces...";

  try {
    const snapshot = await getDocs(collection(db, "judges"));
    if (snapshot.empty) {
      listContainer.innerHTML = "<p>No hay jueces registrados aún.</p>";
      return;
    }

    listContainer.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.classList.add("judge-item");
      div.innerHTML = `
        <input type="checkbox" value="${doc.id}">
        <img src="${data.photo}" alt="${data.name}">
        <span>${data.name} (${data.code})</span>
      `;
      listContainer.appendChild(div);
    });
  } catch (error) {
    console.error("Error cargando jueces:", error);
    listContainer.innerHTML = "❌ Error al cargar jueces.";
  }
}

await loadJudges();

// CREAR ENCUESTA
document.getElementById("createPoll").onclick = async function () {
  const title = (document.getElementById("title").value || "").trim();
  const photoURL = (document.getElementById("photoURL").value || "").trim();
  if (!title) return alert("⚠️ El nombre es obligatorio");

  try {
    // 1️⃣ Crear la encuesta
    const pollRef = await addDoc(collection(db, "polls"), {
      title,
      photo: photoURL,
      is_open: true
    });
    const pollId = pollRef.id;

    // 2️⃣ Obtener jueces seleccionados
    const selected = document.querySelectorAll("#judgesList input:checked");
    let totalJueces = 0;

    for (const checkbox of selected) {
      const judgeDoc = await getDocs(collection(db, "judges"));
      const judgeData = judgeDoc.docs.find(d => d.id === checkbox.value)?.data();
      if (judgeData) {
        await addDoc(collection(db, "judges"), {
          pollId,
          code: judgeData.code,
          name: judgeData.name,
          photo: judgeData.photo
        });
        totalJueces++;
      }
    }

    // 3️⃣ Público por defecto
    const publicCodes = ["PUBLICO1", "PUBLICO2", "PUBLICO3"];
    for (const p of publicCodes) {
      await addDoc(collection(db, "public"), { pollId, code: p });
    }

    alert(`✅ Encuesta creada con ${totalJueces} jueces seleccionados.`);

    // 4️⃣ Mostrar QR
    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;

    const qr
