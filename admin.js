import { db } from "./app.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

document.getElementById("createPoll").onclick = async function () {
  const title = (document.getElementById("title").value || "").trim();
  if (!title) return alert("⚠️ El título es obligatorio");

  try {
    // 1️⃣ Crear encuesta en Firestore
    const pollRef = await addDoc(collection(db, "polls"), {
      title,
      is_open: true
    });

    const pollId = pollRef.id;

    // 2️⃣ Crear jueces automáticamente
    const judges = [
      {
        code: "JUEZ1",
        name: "Ing. Chinchilla",
        photo: "https://drive.google.com/uc?export=view&id=1_ct5WtotaYDi3lxgri1aNgf5sojC8ojC"
      },
      {
        code: "JUEZ2",
        name: "Ing. Villatoro",
        photo: "https://drive.google.com/uc?export=view&id=1lAqor5HSJi-SH731ifu5bR3uVLepvgx1"
      },
      {
        code: "JUEZ3",
        name: "Ing. Guzmán",
        photo: "https://drive.google.com/uc?export=view&id=1_ct5WtotaYDi3lxgri1aNgf5sojC8ojC"
      }
    ];

    for (const j of judges) {
      await addDoc(collection(db, "judges"), {
        pollId,
        code: j.code,
        name: j.name,
        photo: j.photo
      });
    }

    // 3️⃣ Crear público automáticamente
    const publicCodes = ["PUBLICO1", "PUBLICO2", "PUBLICO3"];
    for (const p of publicCodes) {
      await addDoc(collection(db, "public"), { pollId, code: p });
    }

    alert("✅ Encuesta creada con jueces y público incluidos.");

    // 4️⃣ Generar enlace y QR de votación
    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "<h3>Votar</h3>";

    QRCode.toCanvas(voteLink, { width: 200 }, function (err, canvas) {
      if (err) console.error(err);
      qrContainer.appendChild(canvas);
    });

    const linkElement = document.createElement("p");
    linkElement.innerHTML = `<a href="${voteLink}" target="_blank">${voteLink}</a>`;
    qrContainer.appendChild(linkElement);

    // 5️⃣ Generar QR de Resultados
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;
    const resultsQR = document.getElementById("resultsQR");
    resultsQR.innerHTML = "<h3>Resultados en Vivo</h3>";

    QRCode.toCanvas(resultsLink, { width: 200 }, function (err, canvas) {
      if (err) console.error(err);
      resultsQR.appendChild(canvas);
    });

    const resultsElement = document.createElement("p");
    resultsElement.innerHTML = `<a href="${resultsLink}" target="_blank">${resultsLink}</a>`;
    resultsQR.appendChild(resultsElement);

  } catch (error) {
    console.error("❌ Error creando la encuesta:", error);
    alert("Ocurrió un error al crear la encuesta. Revisa la consola.");
  }
};
