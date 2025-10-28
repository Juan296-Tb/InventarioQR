document.addEventListener("DOMContentLoaded", () => {
  const inputBuscar = document.querySelector("#buscar");
  const inputEscanear = document.querySelector("#escanear");
  const listaEscaneos = document.querySelector(".scans");
  const ultimos = [];

  if (!inputEscanear) {
    console.error("No se encontró el campo Escanear QR.");
    return;
  }

  // 🔍 Buscar cajas
  inputBuscar.addEventListener("input", e => {
    const filtro = e.target.value.toLowerCase();
    document.querySelectorAll(".scan-row .scan-text").forEach(span => {
      const visible = span.textContent.toLowerCase().includes(filtro);
      span.closest(".scan-row").style.display = visible ? "" : "none";
    });
  });

  // 📸 Al tocar campo escanear
  inputEscanear.addEventListener("click", () => {
    const usarCamara = confirm("¿Deseas usar la cámara? (Cancelar para subir imagen)");
    usarCamara ? abrirCamara() : subirImagen();
  });

  // === CÁMARA ===
  function abrirCamara() {
    if (typeof Html5Qrcode === "undefined") {
      alert("Error: No se cargó html5-qrcode.");
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "qrOverlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0,0,0,0.9)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: "9999"
    });

    const btnCerrar = document.createElement("button");
    btnCerrar.textContent = "Cerrar";
    Object.assign(btnCerrar.style, {
      background: "#00dfc4", border: "none", padding: "8px 14px",
      borderRadius: "8px", color: "#0f172a", fontWeight: "bold",
      cursor: "pointer", marginBottom: "10px"
    });

    const vista = document.createElement("div");
    vista.id = "reader";
    vista.style.width = "80%";
    vista.style.maxWidth = "400px";
    vista.style.borderRadius = "10px";
    vista.style.overflow = "hidden";

    overlay.appendChild(btnCerrar);
    overlay.appendChild(vista);
    document.body.appendChild(overlay);

    const qr = new Html5Qrcode("reader");
    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      text => {
        qr.stop().then(() => overlay.remove());
        procesarQR(text);
      }
    );

    btnCerrar.addEventListener("click", () => {
      qr.stop().then(() => overlay.remove());
    });
  }

  // === SUBIR IMAGEN ===
  function subirImagen() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;

      if (typeof Html5Qrcode === "undefined") {
        alert("Error: No se cargó html5-qrcode.");
        return;
      }

      const qr = new Html5Qrcode("temp-reader");
      qr.scanFile(file, true)
        .then(text => procesarQR(text))
        .catch(() => alert("No se pudo leer el QR."));
    });
  }

  // === PROCESAR QR ===
  function procesarQR(data) {
    let contenido = data;
    const partes = contenido.split("|");
    const nombre = partes.find(p => p.startsWith("Caja:"))?.split(":")[1]?.trim() || "Sin nombre";
    const ubicacion = partes.find(p => p.startsWith("Ubicacion:"))?.split(":")[1]?.trim() || "N/A";
    const detalles = partes.slice(2).join(", ");

    ultimos.unshift({ nombre, ubicacion, detalles });
    actualizarUltimos();

    // 🔔 Mostrar alerta
    const alerta = document.createElement("div");
    alerta.innerHTML = `
      <b>📦 Caja:</b> ${nombre}<br>
      <b>📍 Ubicación:</b> ${ubicacion}<br>
      <b>🧩 Contenido:</b> ${detalles}
    `;
    Object.assign(alerta.style, {
      position: "fixed",
      bottom: "25px",
      right: "25px",
      background: "#0f172a",
      color: "#00dfc4",
      padding: "14px 20px",
      borderRadius: "12px",
      boxShadow: "0 0 10px rgba(0,0,0,0.5)",
      zIndex: "9999",
      fontSize: "15px"
    });
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 6000);
  }

  function actualizarUltimos() {
    listaEscaneos.innerHTML = "";
    ultimos.slice(0, 5).forEach(qr => {
      const row = document.createElement("div");
      row.className = "scan-row";
      row.innerHTML = `
        <div class="scan-left">
          <i class="fa-solid fa-qrcode"></i>
          <span class="scan-text">${qr.nombre}</span>
        </div>
        <span class="badge ok">OK</span>
      `;
      listaEscaneos.appendChild(row);
    });
  }
});
