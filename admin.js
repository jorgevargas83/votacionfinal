// Generar Links y QR
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
    <button onclick="navigator.clipboard.writeText('${link}')">📋 Copiar Link</button>
    <button onclick="descargarQR('${titulo}', '${link}')">⬇️ Descargar QR</button>
  `;
  container.appendChild(btns);
}

window.descargarQR = function (titulo, link) {
  const canvas = document.createElement("canvas");
  QRCode.toCanvas(canvas, link, { width: 512 }, () => {
    const enlace = document.createElement("a");
    enlace.download = `${titulo}.png`;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  });
};

qrContainer.innerHTML = "";
resultsQR.innerHTML = "";
generarQR(qrContainer, "📲 Escanea para Votar", voteLink);
generarQR(resultsQR, "📈 Escanea para Ver Resultados", resultsLink);
