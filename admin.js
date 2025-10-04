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

// 🔹 Cargar jueces registrados desde Firestore
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

// 🔹 Crear Encuesta
document.getElementById("createPoll").onclick = async function () {
  const title = (document.getElementById("title").value || "").trim();
  const photoURL = (document.getElementById("photoURL").value || "").trim();

  if (!title) return alert("⚠️ El nombre es obligatorio");

  try {
    // Crear documento en Firestore
    const pollRef = await addDoc(collection(db, "polls"), {
      title,
      photo: photoURL,
      is_open: true
    });

    const pollId = pollRef.id;
    const selected = document.querySelectorAll("#judgesList input:checked");
    let totalJueces = 0;

    // Asociar jueces a la encuesta
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

    // Crear carnets de público automáticamente
    const publicCodes = ["PUBLICO1", "PUBLICO2", "PUBLICO3"];
    for (const p of publicCodes) {
      await addDoc(collection(db, "public"), { pollId, code: p });
    }

    alert(`✅ Encuesta creada con ${totalJueces} jueces.`);

    // 🟢 Generar enlaces y QR
    const voteLink = `${window.location.origin}/vote.html?poll=${pollId}`;
    const resultsLink = `${window.location.origin}/results.html?poll=${pollId}`;

    function generarQR(container, titulo, link) {
      container.innerHTML = `
        <div class="qr-title">${titulo}</div>
      `;
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);
      QRCode.toCanvas(canvas, link, { width: 180 }, err => {
        if (err) console.error("Error generando QR:", err);
      });

      const btns = document.createElement("div");
      btns.classList.add("qr-buttons");
      btns.innerHTML = `
        <p><a href="${link}" target="_blank">${link}</a></p>
        <button onclick="navigator.clipboard.writeText('${link}'); mostrarToast('📋 Enlace copiado')">Copiar Link</button>
        <button onclick="descargarQR('${titulo}', '${link}')">⬇️ Descargar QR</button>
      `;
      container.appendChild(btns);
    }

    // 🔹 Descargar QR como imagen
    window.descargarQR = function (titulo, link) {
      const canvas = document.createElement("canvas");
      QRCode.toCanvas(canvas, link, { width: 512 }, () => {
        const enlace = document.createElement("a");
        enlace.download = `${titulo}.png`;
        enlace.href = canvas.toDataURL("image/png");
        enlace.click();
        mostrarToast("✅ QR descargado");
      });
    };

    // 🔹 Pequeño mensaje visual (toast)
    window.mostrarToast = function (mensaje) {
      const toast = document.createElement("div");
      toast.textContent = mensaje;
      toast.style.position = "fixed";
      toast.style.bottom = "20px";
      toast.style.right = "20px";
      toast.style.background = "#007bff";
      toast.style.color = "white";
      toast.style.padding = "10px 20px";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
      toast.style.zIndex = "9999";
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    };

    // 🔹 Renderizar los QR
    qrContainer.innerHTML = "";
    resultsQR.innerHTML = "";
    generarQR(qrContainer, "📲 Escanea para Votar", voteLink);
    generarQR(resultsQR, "📈 Escanea para Ver Resultados", resultsLink);

    // 🧹 Limpiar formulario
    document.getElementById("title").value = "";
    document.getElementById("photoURL").value = "";
    document.querySelectorAll("#judgesList input:checked").forEach(cb => cb.checked = false);

  } catch (error) {
    console.error("Error creando encuesta:", error);
    alert("❌ Error al crear la encuesta.");
  }
};

// 🔹 Registrar nuevo juez
document.getElementById("registerJudge").onclick = async function () {
  const code = (document.getElementById("judgeCode").value || "").trim();
  const name = (document.getElementById("judgeName").value || "").trim();
  const photo = (document.getElementById("judgePhoto").value || "").trim();

  if (!code || !name || !photo) return alert("⚠️ Completa todos los campos.");

  try {
    await addDoc(collection(db, "judges"), { code, name, photo });
    alert(`✅ Juez ${name} registrado.`);

    // Limpiar formulario
    document.getElementById("judgeCode").value = "";
    document.getElementById("judgeName").value = "";
    document.getElementById("judgePhoto").value = "";

    await loadJudges();
  } catch (error) {
    console.error("Error registrando juez:", error);
    alert("❌ Error al registrar juez.");
  }
};
