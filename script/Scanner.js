// Scanner.js (reemplaza el anterior)
document.addEventListener("DOMContentLoaded", () => {
  const inputBuscar = document.querySelector("#buscar");
  const inputEscanear = document.querySelector("#escanear");
  const listaEscaneos = document.querySelector(".scans");
  const STORAGE_KEY = "inventario_scans";
  // Cargar historial guardado
const guardados = JSON.parse(localStorage.getItem("historialQR") || "[]");
ultimos.push(...guardados);
actualizarUltimos();


  // lee scans desde localStorage (devuelve array)
  function readScans() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo storage:", e);
      return [];
    }
  }

  // guarda scans (array) en localStorage
  function saveScans(scans) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    } catch (e) {
      console.error("Error guardando storage:", e);
    }
  }

  // agrega un scan nuevo al principio
  function addScan(scan) {
    const scans = readScans();
    scans.unshift(scan);
    // limitar a 200 registros (ajustable)
    if (scans.length > 200) scans.splice(200);
    saveScans(scans);
    actualizarUltimos();
  }

  // muestra los últimos scans en el panel izquierdo
  function actualizarUltimos() {
    const scans = readScans();
    listaEscaneos.innerHTML = "";
    if (!scans.length) {
      listaEscaneos.innerHTML = `<div style="color: #9aa6b0; padding:10px">No hay escaneos todavía</div>`;
      return;
    }

    scans.slice(0, 20).forEach(qr => {
      const row = document.createElement("div");
      row.className = "scan-row";
      row.innerHTML = `
        <div style="display:flex; gap:10px; align-items:center;">
          <div style="width:44px; height:44px; border-radius:8px; overflow:hidden; background:#071018; display:flex; align-items:center; justify-content:center;">
            ${qr.thumb ? `<img src="${qr.thumb}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-qrcode" style="color:var(--accent); font-size:18px;"></i>`}
          </div>
          <div style="display:flex; flex-direction:column;">
            <span class="scan-text" style="font-weight:700; color:var(--text);">${qr.nombre}</span>
            <small style="color:var(--muted)">${qr.ubicacion} · ${new Date(qr.ts).toLocaleString()}</small>
          </div>
        </div>
        <span class="badge ok">OK</span>
      `;
      row.addEventListener("click", () => mostrarDetalle(qr));
      listaEscaneos.appendChild(row);
    });
  }

  // cuando hacen click en un registro muestra detalle (alert modal simple)
  function mostrarDetalle(qr) {
    const detalle = document.createElement("div");
    detalle.style = `
      position:fixed; left:0; top:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center;
      background:rgba(0,0,0,0.7); z-index:99999; padding:20px;
    `;
    detalle.innerHTML = `
      <div style="background:var(--card); border-radius:12px; max-width:720px; width:100%; padding:18px; color:var(--text);">
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="width:120px; height:120px; border-radius:8px; overflow:hidden; background:#071018; display:flex; align-items:center; justify-content:center;">
            ${qr.thumb ? `<img src="${qr.thumb}" style="width:100%; height:100%; object-fit:cover;">` : `<i class="fa-solid fa-qrcode" style="color:var(--accent); font-size:36px;"></i>`}
          </div>
          <div style="flex:1;">
            <h3 style="margin:0 0 6px 0">${qr.nombre}</h3>
            <div style="color:var(--muted); font-size:13px; margin-bottom:8px;">Ubicación: ${qr.ubicacion}</div>
            <pre style="background:rgba(255,255,255,0.03); padding:8px; border-radius:8px; color:var(--muted); max-height:140px; overflow:auto;">${qr.detalles}</pre>
            <div style="color:var(--muted); font-size:12px; margin-top:8px;">Registrado: ${new Date(qr.ts).toLocaleString()}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
          <button id="btnCerrarDetalle" style="background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--muted); padding:8px 12px; border-radius:8px;">Cerrar</button>
          <button id="btnEliminarDetalle" style="background:var(--danger); border:none; color:#fff; padding:8px 12px; border-radius:8px;">Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(detalle);
    detalle.querySelector("#btnCerrarDetalle").addEventListener("click", () => detalle.remove());
    detalle.querySelector("#btnEliminarDetalle").addEventListener("click", () => {
      eliminarScan(qr.ts);
      detalle.remove();
    });
  }

  // elimina un scan por timestamp
  function eliminarScan(ts) {
    const scans = readScans().filter(s => s.ts !== ts);
    saveScans(scans);
    actualizarUltimos();
  }

  // búsqueda local en la lista mostrada (filtro)
  inputBuscar.addEventListener("input", e => {
    const filtro = e.target.value.toLowerCase();
    document.querySelectorAll(".scan-row").forEach(row => {
      const text = row.querySelector(".scan-text")?.textContent?.toLowerCase() || "";
      row.style.display = text.includes(filtro) ? "" : "none";
    });
  });

  // Clic en campo "escanear": opción cámara / subir imagen
  inputEscanear.addEventListener("click", () => {
    const usarCamara = confirm("¿Deseas usar la cámara? (Cancelar para subir imagen)");
    usarCamara ? abrirCamara() : subirImagen();
  });

  // ===== CÁMARA =====
  async function abrirCamara() {
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
      zIndex: "9999", padding: "18px"
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
    vista.style.width = "100%";
    vista.style.maxWidth = "420px";
    vista.style.borderRadius = "10px";
    vista.style.overflow = "hidden";

    overlay.appendChild(btnCerrar);
    overlay.appendChild(vista);
    document.body.appendChild(overlay);

    const qr = new Html5Qrcode("reader");
    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 280, height: 280 } },
      async text => {
        // intenta capturar thumbnail desde el video
        let thumb = null;
        try {
          const video = document.querySelector("#reader video");
          if (video) {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 300;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumb = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch (e) {
          console.warn("No se pudo capturar miniatura:", e);
        }
        await qr.stop();
        overlay.remove();
        procesarQR(text, thumb);
      },
      error => {
        //console.log("QR decode error:", error);
      }
    );

    btnCerrar.addEventListener("click", () => {
      qr.stop().then(() => overlay.remove()).catch(()=>overlay.remove());
    });
  }

  // ===== SUBIR IMAGEN =====
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

    // Crear contenedor temporal para el escáner
    let tempDiv = document.createElement("div");
    tempDiv.id = "temp-reader";
    tempDiv.style.display = "none"; // invisible
    document.body.appendChild(tempDiv);

    const qr = new Html5Qrcode("temp-reader");
    qr.scanFile(file, true)
      .then(text => {
        procesarQR(text);
        qr.clear();  // limpiar instancia
        tempDiv.remove(); // eliminar contenedor
      })
      .catch(err => {
        console.error("Error leyendo QR:", err);
        alert("⚠️ No se pudo leer el código QR. Intenta con una imagen más clara.");
        qr.clear();
        tempDiv.remove();
      });
  });
}


      // mostramos un loader simple
      const loader = document.createElement("div");
      loader.style = "position:fixed;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:99999";
      loader.innerHTML = `<div style="background:var(--card);padding:18px;border-radius:10px;color:var(--muted)">Leyendo imagen...</div>`;
      document.body.appendChild(loader);

      const qr = new Html5Qrcode(/* element id not needed for scanFile */ "temp-reader");
      qr.scanFile(file, true)
        .then(async (text) => {
          // crear miniatura con FileReader
          let thumb = null;
          try {
            thumb = await fileToDataUrlResized(file, 300, 300);
          } catch (err) {
            console.warn("No se pudo crear miniatura:", err);
          }
          document.body.removeChild(loader);
          procesarQR(text, thumb);
        })
        .catch(err => {
          document.body.removeChild(loader);
          alert("No se pudo leer el QR.");
          console.error(err);
        });
    });
  
  

  // helper: convierte File a dataURL y la redimensiona a maxW,maxH (canvas)
  function fileToDataUrlResized(file, maxW = 300, maxH = 300) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
          const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
        img.src = ev.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ===== PROCESAR QR (parsed, guardado y UI) =====
  function procesarQR(data, thumb = null) {
    let contenido = data?.trim() || "";
    // si viene la etiqueta DATA:base64 descodificar
    if (contenido.startsWith("DATA:")) {
      try {
        const encoded = contenido.replace(/^DATA:/, "");
        contenido = decodeURIComponent(escape(atob(encoded)));
      } catch (e) {
        console.warn("Error decoding base64 payload:", e);
      }
    }

    const partes = contenido.split("|");
    const nombre = partes.find(p => p.startsWith("Caja:"))?.split(":")[1]?.trim() || "Sin nombre";
    const ubicacion = partes.find(p => p.startsWith("Ubicacion:"))?.split(":")[1]?.trim() || "N/A";
    const detalles = partes.slice(2).join(", ") || contenido;

    // construir el objeto a guardar
    const scanObj = {
      nombre,
      ubicacion,
      detalles,
      raw: contenido,
      ts: Date.now(),
      thumb // puede ser null
    };

    addScan(scanObj);

    // notificación visual breve
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
    setTimeout(() => alerta.remove(), 5000);

    // actualizar campo de entrada (opcional)
    const inputBuscar = document.querySelector("#buscar");
    if (inputBuscar) {
      inputBuscar.value = nombre;
      // disparar evento input para filtrar
      inputBuscar.dispatchEvent(new Event("input"));
    }
  }

  // inicializa la vista con lo que hay en storage
  actualizarUltimos();
navigator.serviceWorker.register("service-worker.js")
// Guardar el historial localmente
localStorage.setItem("historialQR", JSON.stringify(ultimos));

