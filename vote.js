import { db } from "./app.js";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const pollId = params.get("poll");
const scoreInput = document.getElementById("score");
const scoreValue = document.getElementById("scoreValue");
const validateBtn = document.getElementById("validateCode");
const welcomeMsg = document.getElementById("welcomeMsg");
const judgePhoto = document.getElementById("judgePhoto");

let validatedCode = null;
let validatedRole = null;

scoreInput.addEventListener("input", () => {
  scoreValue.textContent = scoreInput.value;
});

// Mapa de jueces con nombre y foto (mismo que en results.js)
const judgesInfo = {
  JUEZ1: {
    name: "Ing. Chinchilla",
    photo: "https://drive.google.com/uc?export=view&id=1_ct5WtotaYDi3lxgri1aNgf5sojC8ojC"
  },
  JUEZ2: {
    name: "Ing. Villatoro",
    photo: "https://drive.google.com/uc?export=view&id=1lAqor5HSJi-SH731ifu5bR3uVLepvgx1"
  },
  JUEZ3: {
    name: "Ing. Guzmán",
    photo: "https://drive.google.com/uc?export=view&id=1pcIwoTWJMpnx0AZ8ngYS0Hm1xYM-r2E1"
  }
};

// Paso 1: Validar carnet
validateBtn.onclick = async () => {
  const code = document.getElementById("code").value.trim().toUpperCase();
  if (!code) return alert("⚠️ Escribe tu carnet");

  // Verificar si encuesta existe y está abierta
  const pollRef = doc(db, "polls", pollId);
  const pollSnap = await getDoc(pollRef);
  if (!pollSnap.exists()) return alert("❌ Encuesta no encontrada.");
  if (pollSnap.data().is_open === false) return alert("🚫 Encuesta cerrada.");

  // Buscar si el carnet pertenece a jueces o público
  const judgesSnap = await getDocs(
    query(collection(db, "judges"), where("pollId", "==", pollId), where("code", "==", code))
  );
  const publicSnap = await getDocs(
    query(collection(db, "public"), where("pollId", "==", pollId), where("code", "==", code))
  );

  let role = judgesSnap.empty ? (publicSnap.empty ? null : "public") : "judge";
  if (!role) return alert("❌ Código inválido");

  // Verificar si ya votó
  const existingSnap = await getDocs(
    query(collection(db, "votes"), where("pollId", "==", pollId), where("code", "==", code))
  );
  if (!existingSnap.empty) return alert("⚠️ Este carnet ya votó.");

  // ✅ Validación exitosa
  validatedCode = code;
  validatedRole = role;

  // Mostrar mensaje y foto si es juez
  if (role === "judge") {
    const info = judgesInfo[code] || { name: code, photo: "" };
    welcomeMsg.textContent = `✅ Bienvenido, ${info.name}. Puede emitir su voto.`;
    welcomeMsg.style.color = "green";
    welcomeMsg.style.display = "block";

    if (info.photo) {
      judgePhoto.src = info.photo;
      judgePhoto.style.display = "block";
    }
  } else {
    welcomeMsg.textContent = "✅ Bienvenido, Público. Puede emitir su voto.";
    welcomeMsg.style.color = "green";
    welcomeMsg.style.display = "block";
    judgePhoto.style.display = "none";
  }

  // Mostrar slider
  document.getElementById("scoreSection").style.display = "block";
  validateBtn.disabled = true;
  document.getElementById("code").disabled = true;
};

// Paso 2: Enviar voto
document.getElementById("voteBtn").onclick = async () => {
  if (!validatedCode) return alert("⚠️ Primero valida tu carnet.");
  const score = parseFloat(scoreInput.value);

  await addDoc(collection(db, "votes"), { pollId, code: validatedCode, role: validatedRole, score });
  alert("✅ Voto registrado correctamente");
  document.getElementById("voteForm").style.display = "none";
};
