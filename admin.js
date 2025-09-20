import { db } from "./app.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const judgesList = document.getElementById("judgesList");
const qrContainer = document.getElementById("qrContainer");
const resultsQR = document.getElementById("resultsQR");

// Función para cargar jueces en la lista
async function loadJudges() {
  judgesList.innerHTML = "Cargando jueces...";
  try {
    const snapshot = await getDocs(collection(db, "judges"));
    if (snapshot.empty) {
      judgesList.innerHTML = "<p>No hay jueces registrados.</p>";
      return;
    }

    const uniqueJudges = new Map();
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.name && data.code && !uniqueJudges.has(data.code)) {
        uniqueJudges.set(data.code, { id: docSnap.id, ...data });
      }
    });

    judgesList.innerHTML = "";
    uniqueJudges.forEach(judge => {
      const div = document.createElement("div");
      div.classList.add("judge-item");
      div.innerHTML = `
        <input type="checkbox" value="${judge.id}">
        <img src="${judge.photo || "https://via.placeholder.com/28"}" alt="${judge.name}" width="28" height="28">
        <span>${judge.name} (${judge.code})</span>
      `;
      judgesList.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando jueces:", error);
    judgesList.innerHTML = "❌ Error al cargar jueces.";
  }
}

await loadJudges();

// Crear Encuesta
document.getElementById("createPoll").onclick = async function () {
  const title = (document.getElementById("title").value || "").trim();
  const photoURL = (document.getElementById("photoURL").value || "").trim();

  if (!title) return alert("⚠️ El nombre es obligatorio");

  try {
    const pollRef = await addDoc(collection(db, "polls"), {
      title,
      photo: photoURL,
      is_open: true
    });

    const pollId = pollRef.id;
    const selected = document.querySelectorAll("#judgesList input:checked");
    let totalJueces = 0;

    for (const checkbox of selected) {
      const judgeDoc = await getDoc(doc(db, "judges", checkbox.value));
      if (judgeDoc.exists()) {
        const judgeData = judgeDoc.data();
        await addDoc(collection(db, "judges"), {
          pollId,
          code: judgeData.code,
          name: judgeData.name,
          photo: judgeData.photo
        });
        totalJueces++;
      }
    }

    const publicCodes = ["PUBLICO1", "PUBLICO2", "PUBLICO3"];
    for (const p of publicCodes) {
      await addDoc(collection(db, "public"), { pollId, code: p });
    }

    alert(`✅ Encuesta creada con ${totalJueces} jueces.`);

    // Generar Links y QR
    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;

    qrContainer.innerHTML = `<h3>Votar</h3>`;
    const voteCanvas = document.createElement("canvas");
    qrContainer.appendChild(voteCanvas);
    QRCode.toCanvas(voteCanvas, voteLink, { width: 180 }, err => {
      if (err) console.error("Error generando QR de votación:", err);
    });
    qrContainer.innerHTML += `<p><a href="${voteLink}" target="_blank">${voteLink}</a></p>
    <button onclick="navigator.clipboard.writeText('${voteLink}')">📋 Copiar Link</button>`;

    resultsQR.innerHTML = `<h3>Resultados en Vivo</h3>`;
    const resultsCanvas = document.createElement("canvas");
    resultsQR.appendChild(resultsCanvas);
    QRCode.toCanvas(resultsCanvas, resultsLink, { width: 180 }, err => {
      if (err) console.error("Error generando QR de resultados:", err);
    });
    resultsQR.innerHTML += `<p><a href="${resultsLink}" target="_blank">${resultsLink}</a></p>
    <button onclick="navigator.clipboard.writeText('${resultsLink}')">📋 Copiar Link</button>`;

    // Limpiar formulario
    document.getElementById("title").value = "";
    document.getElementById("photoURL").value = "";
    document.querySelectorAll("#judgesList input:checked").forEach(cb => cb.checked = false);

  } catch (error) {
    console.error("Error creando encuesta:", error);
    alert("❌ Error al crear la encuesta.");
  }
};

// Registrar Juez
document.getElementById("registerJudge").onclick = async function () {
  const code = (document.getElementById("judgeCode").value || "").trim();
  const name = (document.getElementById("judgeName").value || "").trim();
  const photo = (document.getElementById("judgePhoto").value || "").trim();

  if (!code || !name || !photo) return alert("⚠️ Completa todos los campos.");

  try {
    await addDoc(collection(db, "judges"), { code, name, photo });
    alert(`✅ Juez ${name} registrado.`);

    // Limpiar formulario de registro
    document.getElementById("judgeCode").value = "";
    document.getElementById("judgeName").value = "";
    document.getElementById("judgePhoto").value = "";

    await loadJudges();
  } catch (error) {
    console.error("Error registrando juez:", error);
    alert("❌ Error al registrar juez.");
  }
};
