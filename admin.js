import { db } from "./app.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// CREAR ENCUESTA
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

    alert("✅ Encuesta creada con éxito");

    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;

    // QR de Votación
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "<h3>Votar</h3>";
    QRCode.toCanvas(voteLink, { width: 200 }, (err, canvas) => {
      if (!err) qrContainer.appendChild(canvas);
    });
    qrContainer.innerHTML += `<p><a href="${voteLink}" target="_blank">${voteLink}</a></p>`;

    // QR de Resultados
    const resultsQR = document.getElementById("resultsQR");
    resultsQR.innerHTML = "<h3>Resultados en Vivo</h3>";
    QRCode.toCanvas(resultsLink, { width: 200 }, (err, canvas) => {
      if (!err) resultsQR.appendChild(canvas);
    });
    resultsQR.innerHTML += `<p><a href="${resultsLink}" target="_blank">${resultsLink}</a></p>`;
  } catch (error) {
    console.error("Error creando encuesta:", error);
    alert("Ocurrió un error al crear la encuesta.");
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
    await addDoc(collection(db, "judges"), {
      code,
      name,
      photo
    });

    alert(`✅ Juez ${name} registrado correctamente`);
    document.getElementById("judgeCode").value = "";
    document.getElementById("judgeName").value = "";
    document.getElementById("judgePhoto").value = "";
  } catch (error) {
    console.error("Error registrando juez:", error);
    alert("❌ Hubo un error registrando el juez.");
  }
};
