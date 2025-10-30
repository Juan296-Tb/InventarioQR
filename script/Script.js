const agregarBtn = document.getElementById('agregarContenido');
const contenedor = document.getElementById('contenidos');
const generarBtn = document.getElementById('generarQR');
const qrPreview = document.getElementById('qrPreview');

// Agregar campos dinámicos
agregarBtn.addEventListener('click', () => {
  const div = document.createElement('div');
  div.classList.add('contenido-item');
  div.innerHTML = `
    <input type="number" placeholder="Cantidad" class="cantidad" min="1" style="width:80px;">
    <input type="text" placeholder="Producto" class="producto" style="width:calc(100% - 90px);">
  `;
  contenedor.appendChild(div);
});

// Generar QR
generarBtn.addEventListener('click', () => {
  const nombreCaja = document.getElementById("nombreCaja").value.trim();
  const ubicacion = document.getElementById("ubicacion").value.trim();
  const contenidos = Array.from(document.querySelectorAll(".contenido-item")).map(item => {
    const cantidad = item.querySelector(".cantidad").value.trim();
    const producto = item.querySelector(".producto").value.trim();
    return `${cantidad}x ${producto}`;
  });

  if (!nombreCaja || contenidos.length === 0) {
    alert("Completa el nombre de la caja y al menos un contenido.");
    return;
  }

  const resumen = `Caja:${nombreCaja}|Ubicacion:${ubicacion || "N/A"}|${contenidos.join(",")}`;
  qrPreview.innerHTML = "";

  new QRCode(qrPreview, {
    text: resumen,
    width: 220,
    height: 220,
    colorDark: "#00dfc4",
    colorLight: "#0f172a",
    correctLevel: QRCode.CorrectLevel.M
  });
});

// Descargar QR
document.getElementById("downloadQR").addEventListener("click", () => {
  const canvas = document.querySelector("#qrPreview canvas");
  if (!canvas) return alert("Genera un QR primero.");
  const link = document.createElement("a");
  link.download = "codigoQR.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
