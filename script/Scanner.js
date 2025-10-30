// Scanner.js (versión integrada con Firebase Firestore + Storage)
import {
  getFirestore, collection, addDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Accesos globales a Firebase
const db = window.db;
const storage = window.storage;

document.addEventListener("DOMContentLoaded", () => {
  const inputBuscar = document.querySelector("#buscar");
  const inputEscanear = document.querySelector("#escanear");
  const listaEscaneos = document.querySelector(".scans");
  const STORAGE_KEY = "inventario_scans";

  // lee scans desde localStorage
  function readScans() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error leyendo storage:", e);
      return [];
    }
  }

  // guarda scans (array)
  function saveScans(scans) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
    } catch (e) {
      console.error("Error guardando storage:", e);
    }
  }

  // agrega un scan nuevo
  function addScan(scan) {
    const scans = readScans();
    scans.unshift(scan);
    if (scans.length > 200) scans.splice(200);
    saveScans(scans);
    actualizarUltimos();
  }

  // muestra los últimos
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

  // muestra detalle
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

  // elimina scan
  function eliminarScan(ts) {
    const scans = readScans().filter(s => s.ts !== ts);
    saveScans(scans);
    actualizarUltimos();
  }

  // búsqueda local
  inputBuscar.addEventListener("input", e => {
    const filtro = e.target.value.toLowerCase();
    document.querySelectorAll(".scan-row").forEach(row => {
      const text = row.querySelector(".scan-text")?.textContent?.toLowerCase() || "";
      row.style.display = text.includes(filtro) ? "" : "none";
    });
  });

  // procesar QR (guardar en Firebase)
  async function procesarQR(data, thumb = null) {
    let contenido = data?.trim() || "";
    const partes = contenido.split("|");
    const nombre = partes.find(p => p.startsWith("Caja:"))?.split(":")[1]?.trim() || "Sin nombre";
    const ubicacion = partes.find(p => p.startsWith("Ubicacion:"))?.split(":")[1]?.trim() || "N/A";
    const detalles = partes.slice(2).join(", ") || contenido;

    const scanObj = {
      nombre,
      ubicacion,
      detalles,
      raw: contenido,
      ts: Date.now(),
      thumb
    };

    addScan(scanObj);

    // Subir miniatura si existe
    let qrURL = null;
    if (thumb) {
      const blob = await (await fetch(thumb)).blob();
      const storageRef = ref(storage, `qr/${nombre}.jpg`);
      await uploadBytes(storageRef, blob);
      qrURL = await getDownloadURL(storageRef);
    }

    // Guardar en Firestore
    await addDoc(collection(db, "cajas"), {
      nombre,
      ubicacion,
      detalles,
      qr: qrURL,
      fecha: new Date().toISOString()
    });

    const alerta = document.createElement("div");
    alerta.innerHTML = `<b>📦 Caja:</b> ${nombre}<br><b>📍 Ubicación:</b> ${ubicacion}`;
    Object.assign(alerta.style, {
      position: "fixed",
      bottom: "25px",
      right: "25px",
      background: "#0f172a",
      color: "#00dfc4",
      padding: "14px 20px",
      borderRadius: "12px",
      zIndex: "9999"
    });
    document.body.appendChild(alerta);
    setTimeout(() => alerta.remove(), 4000);
  }

  // inicializar
  actualizarUltimos();
});
