import { db } from "./app.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const createPollBtn = document.getElementById("createPoll");
const resultsLink = document.getElementById("resultsLink");

createPollBtn.onclick = async () => {
  const title = document.getElementById("title").value.trim();
  if (!title) return alert("Escribe un título");

  const pollRef = await addDoc(collection(db, "polls"), { title, is_open: true });
  const pollId = pollRef.id;

  // Crear jueces y público
  for (let i = 1; i <= 3; i++) {
    await addDoc(collection(db, "judges"), { pollId, code: `JUEZ${i}` });
    await addDoc(collection(db, "public"), { pollId, code: `PUBLICO${i}` });
  }

  const voteUrl = `${location.origin}/vote.html?poll=${pollId}`;
  resultsLink.href = `results.html?poll=${pollId}`;
  resultsLink.style.display = "block";

  QRCode.toCanvas(document.getElementById("qrCanvas"), voteUrl, { width: 200 });
  document.getElementById("qrContainer").style.display = "block";
};
