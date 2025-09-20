import { db } from "./app.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const judgesList = document.getElementById("judgesList");

// 🔄 Función para cargar lista de jueces
async function loadJudges() {
  judgesList.innerHTML = "Cargando jueces...";
  try {
    const snapshot = await getDocs(collection(db, "judges"));

    if (snapshot.empty) {
      judgesList.innerHTML = "<p>No hay jueces registrados aún.</p>";
      return;
    }

    // Usar Map para evitar duplicados
    const uniqueJudges = new Map();

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.name && data.code) {
        if (!uniqueJudges.has(data.code)) {
          uniqueJudges.set(data.code, { id: docSnap.id, ...data });
        }
      }
    });

    judgesList.innerHTML = "";
    uniqueJudges.forEach(judge => {
      const div = document.createElement("div");
      div.classList.add("judge-item");
      div.innerHTML = `
        <input type="checkbox" value="${judge.id}">
        <img src="${judge.photo || "https://via.placeholder.com/28"}" alt="${judge.name}">
        <span>${judge.name} (${judge.code})</span>
      `;
      judgesList.appendChild(div);
    });

  } catch (error) {
    console.error("Error cargando jueces:", error);
    judgesList.innerHTML = "❌ Error al cargar jueces.";
  }
}

// Ejecutar al cargar la página
await loadJudges();

// CREAR ENCUESTA
document.getElementById("createPoll").onclick = async function () {
  const title = (document.getElementById("title").value || "").trim();
  const photoURL = (document.getElementById("photoURL").value || "").trim();

  if (!title) return alert("⚠️ El nombre es obligatorio");

  try {
    // Crear encuesta en Firestore
    const pollRef = await addDoc(collection(db, "polls"), {
      title,
      photo: photoURL,
      is_open: true
    });
    const pollId = pollRef.id;

    // Obtener jueces seleccionados
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

    // Crear público por defecto
    const publicCodes = ["PUBLICO1", "PUBLICO2", "PUBLICO3"];
    for (const p of publicCodes) {
      await addDoc(collection(db, "public"), { pollId, code: p });
    }

    alert(`✅ Encuesta creada con ${totalJueces} jueces seleccionados.`);

    // Mostrar QR
    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;

    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "<h3>Votar</h3>";
    QRCode.toCanvas(voteLink, { width: 200 }, (err, canvas) => {
      if (!err) qrContainer.appendChild(canvas);
    });
    qrContainer.innerHTML += `<p><a href="${voteLink}" target="_blank">${voteLink}</a></p>`;

    const resultsQR = document.getElementById("resultsQR");
    resultsQR.innerHTML = "<h3>Resultados en Vivo</h3>";
    QRCode.toCanvas(resultsLink, { width: 200 }, (err, canvas) => {
      if (!err) resultsQR.appendChild(canvas);
    });
    resultsQR.innerHTML += `<p><a href="${resultsLink}" target="_blank">${resultsLink}</a></p>`;

    // Limpiar campos de encuesta
    document.getElementById("title").value = "";
    document.getElementById("photoURL").value = "";

    // Desmarcar jueces seleccionados
    document.querySelectorAll("#judgesList input:checked").forEach(cb => (cb.checked = false));

  } catch (error) {
    console.error("Error creando encuesta:", error);
    alert("❌ Error al crear la encuesta.");
  }
};

// REGISTRAR JUEZ
document.getElementById("registerJudge").onclick = async function () {
  const code = (document.getElementById("judgeCode").value || "").trim();
  const name = (document.getElementById("judgeName").value || "").trim();
  const photo = (document.getElementById("judgePhoto").value || "").trim();

  if (!code || !name || !photo) {
    return alert("⚠️ Completa todos los campos antes de registrar.");
  }

  try {
    await addDoc(collection(db, "judges"), { code, name, photo });

    alert(`✅ Juez ${name} registrado correctamente`);

    // Limpiar campos
    document.getElementById("judgeCode").value = "";
    document.getElementById("judgeName").value = "";
    document.getElementById("judgePhoto").value = "";

    // Refrescar lista de jueces
    await loadJudges();
  } catch (error) {
    console.error("Error registrando juez:", error);
    alert("❌ Hubo un error registrando el juez.");
  }
};
