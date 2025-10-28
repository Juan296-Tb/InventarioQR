const agregarBtn = document.getElementById('agregarContenido');
const contenedor = document.getElementById('contenidos');
const generarBtn = document.getElementById('generarQR');
const qrPreview = document.getElementById('qrPreview');

let contador = 0;

// Agregar nuevos campos dinámicos
agregarBtn.addEventListener('click', () => {
  contador++;
  const div = document.createElement('div');
  div.classList.add('contenido-item');
  div.innerHTML = `
    <input type="number" placeholder="Cantidad" class="cantidad" min="1" style="width:80px; display:inline-block; margin-right:8px;">
    <input type="text" placeholder="Producto" class="producto" style="width: calc(100% - 100px); display:inline-block;">
  `;
  contenedor.appendChild(div);
});

// Generar QR con los datos
document.addEventListener("DOMContentLoaded", () => {

  // ✅ Aquí ya el DOM está cargado, por lo tanto los elementos existen
  const generarBtn = document.getElementById("generarBtn");
  const qrPreview = document.getElementById("qrPreview");
document.getElementById("generarQR").addEventListener("click", () => {
  const nombreCaja = document.getElementById("nombreCaja").value.trim();
  const ubicacion = document.getElementById("ubicacion").value.trim();
  const contenidos = Array.from(document.querySelectorAll(".contenido-item")).map(item => {
    const cantidad = item.querySelector(".cantidad").value.trim();
    const producto = item.querySelector(".producto").value.trim();
    return `${cantidad}x ${producto}`;
  });

  // Si no hay nombre o contenido, mostramos advertencia
  if (!nombreCaja || contenidos.length === 0) {
    alert("Completa el nombre de la caja y al menos un contenido.");
    return;
  }

  // 🔹 Versión compacta del texto (resumen)
  const resumen = `Caja:${nombreCaja}|Ubicacion:${ubicacion || "N/A"}|${contenidos.join(",")}`;

  // 🔹 En caso de que aún sea largo, codificamos en base64
  let data = resumen;
  if (resumen.length > 400) {
    const encoded = btoa(unescape(encodeURIComponent(resumen)));
    data = `DATA:${encoded}`;
  }

  // Limpiamos el contenedor del QR
  const qrPreview = document.getElementById("qrPreview");
  qrPreview.innerHTML = "";

  // 🔹 Generamos QR seguro
  new QRCode(qrPreview, {
    text: data,
    width: 220,
    height: 220,
    colorDark: "#00dfc4",
    colorLight: "#0f172a",
    correctLevel: QRCode.CorrectLevel.L
  });
});
});

