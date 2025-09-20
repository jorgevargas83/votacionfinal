import { db } from "./app.js";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const params = new URLSearchParams(location.search);
const pollId = params.get("poll");
const resultsDiv = document.getElementById("results");
const closePollBtn = document.getElementById("closePollBtn");

// 🏷️ Datos de jueces con nombre y foto
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


if (closePollBtn) {
  closePollBtn.onclick = async () => {
    if (confirm("¿Cerrar encuesta? Nadie podrá votar después.")) {
      await updateDoc(doc(db, "polls", pollId), { is_open: false });
      alert("✅ Encuesta cerrada");
      closePollBtn.disabled = true;
    }
  };
}

async function loadParticipants() {
  const judgesSnap = await getDocs(query(collection(db, "judges"), where("pollId", "==", pollId)));
  const publicSnap = await getDocs(query(collection(db, "public"), where("pollId", "==", pollId)));

  return {
    judges: judgesSnap.docs.map((d) => d.data().code),
    publics: publicSnap.docs.map((d) => d.data().code),
  };
}

loadParticipants().then(({ judges, publics }) => listenVotes(judges, publics));

function listenVotes(judges, publics) {
  const q = query(collection(db, "votes"), where("pollId", "==", pollId));

  onSnapshot(q, (snapshot) => {
    let sumJudges = 0, sumPublic = 0, countPublic = 0;
    const judgeScores = {};
    snapshot.forEach((doc) => {
      const v = doc.data();
      if (v.role === "judge") {
        sumJudges += v.score;
        judgeScores[v.code] = v.score;
      }
      if (v.role === "public") {
        sumPublic += v.score;
        countPublic++;
      }
    });

    const avgPublic = countPublic > 0 ? sumPublic / countPublic : 0;
    const total = sumJudges + avgPublic;

    let html = `<h2>Total: ${total.toFixed(1)} puntos</h2><h3>Jueces</h3><ul>`;
    judges.forEach((j) => {
      const info = judgesInfo[j] || { name: j, photo: "" };
      const score = judgeScores[j] ?? null;
      html += `<li class="judge-item">
        ${info.photo ? `<img src="${info.photo}" class="judge-photo">` : ""}
        <span class="judge-name">${info.name}</span> ${score !== null ? "✅" : "❌"}
        ${score !== null
          ? `<div class="progress"><div class="progress-bar" style="width:${(score/10)*100}%">${score.toFixed(1)}</div></div>`
          : ""}
      </li>`;
    });
    html += `</ul><h3>Público</h3>
      <div class="progress"><div class="progress-bar public" style="width:${(avgPublic/10)*100}%">${avgPublic.toFixed(1)}</div></div>`;
    resultsDiv.innerHTML = html;
  });
}

