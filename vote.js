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

scoreInput.addEventListener("input", () => {
  scoreValue.textContent = scoreInput.value;
});

document.getElementById("voteBtn").onclick = async () => {
  // ✅ Verificar si encuesta está abierta
  const pollRef = doc(db, "polls", pollId);
  const pollSnap = await getDoc(pollRef);

  if (!pollSnap.exists()) return alert("❌ Encuesta no encontrada.");
  if (pollSnap.data().is_open === false) {
    alert("🚫 Esta encuesta ya fue cerrada.");
    return;
  }

  const code = document.getElementById("code").value.trim().toUpperCase();
  const score = parseFloat(scoreInput.value);
  if (!code) return alert("Escribe tu carnet");

  const judgesSnap = await getDocs(
    query(collection(db, "judges"), where("pollId", "==", pollId), where("code", "==", code))
  );
  const publicSnap = await getDocs(
    query(collection(db, "public"), where("pollId", "==", pollId), where("code", "==", code))
  );

  let role = judgesSnap.empty ? (publicSnap.empty ? null : "public") : "judge";
  if (!role) return alert("Código inválido");

  // ✅ Validación de voto único
  const existingSnap = await getDocs(
    query(collection(db, "votes"), where("pollId", "==", pollId), where("code", "==", code))
  );
  if (!existingSnap.empty) {
    alert("⚠️ Este carnet ya votó en esta encuesta.");
    return;
  }

  await addDoc(collection(db, "votes"), { pollId, code, role, score });
  alert("✅ Voto registrado");
  document.getElementById("voteForm").style.display = "none";
};
