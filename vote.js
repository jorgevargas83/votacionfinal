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
const welcomeMsg = document.getElementById("welcomeMsg");
const judgePhoto = document.getElementById("judgePhoto");

let validatedCode = null;

// Cambiar entre modos
document.getElementById("publicMode").onclick = () => {
  document.getElementById("roleSelect").style.display = "none";
  document.getElementById("publicSection").style.display = "block";
};

document.getElementById("judgeMode").onclick = () => {
  document.getElementById("roleSelect").style.display = "none";
  document.getElementById("judgeForm").style.display = "block";
};

// Actualizar slider
scoreInput.addEventListener("input", () => {
  scoreValue.textContent = scoreInput.value;
});

// Validar juez
document.getElementById("validateCode").onclick = async () => {
  const code = document.getElementById("code").value.trim().toUpperCase();
  if (!code) return alert("⚠️ Escribe tu carnet de juez");

  const pollRef = doc(db, "polls", pollId);
  const pollSnap = await getDoc(pollRef);
  if (!pollSnap.exists()) return alert("❌ Encuesta no encontrada.");
  if (pollSnap.data().is_open === false) return alert("🚫 Encuesta cerrada.");

  // Buscar juez
  const judgesSnap = await getDocs(
    query(collection(db, "judges"), where("pollId", "==", pollId), where("code", "==", code))
  );
  if (judgesSnap.empty) return alert("❌ Código de juez no válido.");

  // Verificar si ya votó
  const existingSnap = await getDocs(
    query(collection(db, "votes"), where("pollId", "==", pollId), where("code", "==", code))
  );
  if (!existingSnap.empty) return alert("⚠️ Este juez ya votó.");

  validatedCode = code;

  welcomeMsg.textContent = "✅ Juez validado, puede emitir su voto.";
  welcomeMsg.style.display = "block";
  document.getElementById("scoreSection").style.display = "block";
  document.getElementById("validateCode").disabled = true;
  document.getElementById("code").disabled = true;
};

// Enviar voto de juez
document.getElementById("voteBtn").onclick = async () => {
  if (!validatedCode) return alert("⚠️ Primero valida tu carnet de juez.");
  const score = parseFloat(scoreInput.value);

  await addDoc(collection(db, "votes"), {
    pollId,
    code: validatedCode,
    role: "judge",
    score,
  });

  alert("✅ Voto del juez registrado correctamente");
  document.getElementById("judgeForm").style.display = "none";
};

// Enviar voto público
document.getElementById("publicVoteBtn").onclick = async () => {
  await addDoc(collection(db, "votes"), {
    pollId,
    role: "public",
    code: "PUBLICO",
    score: 10,
  });

  alert("✅ Gracias por tu voto público");
  document.getElementById("publicSection").innerHTML = "<h3>🎉 ¡Tu voto fue registrado!</h3>";
};
