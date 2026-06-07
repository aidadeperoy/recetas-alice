import { getRecipe } from "./recipesApi.js";
import { formatMinutes, youtubeEmbedUrl } from "./utils.js";

const contenido = document.getElementById("contenido");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function render(r) {
  document.title = (r.titulo ? esc(r.titulo) + " · " : "") + "Las Recetas de Alice";

  const foto = r.foto_url
    ? `<img class="receta-foto" src="${esc(r.foto_url)}" alt="${esc(r.titulo)}" />`
    : "";

  const metaItems = [];
  if (r.tiempo_prep) metaItems.push(`<span><strong>${formatMinutes(r.tiempo_prep)}</strong>Preparación</span>`);
  if (r.tiempo_coccion) metaItems.push(`<span><strong>${formatMinutes(r.tiempo_coccion)}</strong>Cocción</span>`);
  if (r.raciones) metaItems.push(`<span><strong>${esc(r.raciones)}</strong>Raciones</span>`);
  const meta = metaItems.length ? `<div class="receta-meta">${metaItems.join("")}</div>` : "";

  const ingredientes = (r.ingredientes || []).map((i) => `<li>${esc(i)}</li>`).join("");
  const pasos = (r.pasos || []).map((p) => `<li>${esc(p)}</li>`).join("");

  const embed = youtubeEmbedUrl(r.video_youtube);
  const video = embed
    ? `<div class="seccion"><h2>Vídeo</h2><div class="video-wrap"><iframe src="${embed}" allowfullscreen loading="lazy"></iframe></div></div>`
    : "";
  const consejos = r.consejos
    ? `<div class="seccion"><h2>Consejos</h2><div class="consejos-caja">${esc(r.consejos)}</div></div>`
    : "";

  const tienePasos = (r.pasos || []).length > 0;
  const acciones = `
    <div class="receta-acciones">
      ${tienePasos ? `<button class="btn-accion principal" id="btn-cocina">👩‍🍳 Modo cocina</button>` : ""}
      <button class="btn-accion" id="btn-imprimir">🖨 Imprimir</button>
      <button class="btn-accion" id="btn-whatsapp">💬 Compartir</button>
    </div>`;

  contenido.innerHTML = `
    ${foto}
    ${r.categoria ? `<p class="receta-categoria">${esc(r.categoria)}</p>` : ""}
    <h1 class="receta-titulo">${esc(r.titulo)}</h1>
    ${r.descripcion ? `<p class="receta-intro">${esc(r.descripcion)}</p>` : ""}
    ${acciones}
    ${meta}
    <div class="seccion"><h2>Ingredientes</h2><ul>${ingredientes}</ul></div>
    <div class="seccion"><h2>Paso a paso</h2><ol>${pasos}</ol></div>
    ${video}
    ${consejos}
    <a class="volver" href="index.html">← Volver a todas las recetas</a>`;

  wireActions(r);
}

function wireActions(r) {
  const imprimir = document.getElementById("btn-imprimir");
  if (imprimir) imprimir.addEventListener("click", () => window.print());

  const whatsapp = document.getElementById("btn-whatsapp");
  if (whatsapp) {
    whatsapp.addEventListener("click", () => {
      const texto = `${r.titulo} — Las Recetas de Alice\n${location.href}`;
      window.open("https://wa.me/?text=" + encodeURIComponent(texto), "_blank");
    });
  }

  const cocina = document.getElementById("btn-cocina");
  if (cocina) cocina.addEventListener("click", () => openCookingMode(r));
}

// ---------- Cooking mode ----------
let wakeLock = null;

async function acquireWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch { /* ignore — keep working without it */ }
}
async function releaseWakeLock() {
  try { if (wakeLock) { await wakeLock.release(); wakeLock = null; } } catch { /* ignore */ }
}

function openCookingMode(r) {
  const pasos = r.pasos || [];
  if (pasos.length === 0) return;
  let i = 0;

  const overlay = document.createElement("div");
  overlay.className = "cocina-overlay";
  overlay.innerHTML = `
    <div class="cocina-top">
      <p class="cocina-titulo">${esc(r.titulo)}</p>
      <button class="cocina-cerrar" aria-label="Cerrar">✕</button>
    </div>
    <div class="cocina-cuerpo">
      <p class="cocina-contador"></p>
      <p class="cocina-paso"></p>
    </div>
    <div class="cocina-nav">
      <button class="anterior">← Anterior</button>
      <button class="siguiente">Siguiente →</button>
    </div>`;
  document.body.appendChild(overlay);

  const contador = overlay.querySelector(".cocina-contador");
  const pasoEl = overlay.querySelector(".cocina-paso");
  const btnPrev = overlay.querySelector(".anterior");
  const btnNext = overlay.querySelector(".siguiente");

  function paint() {
    contador.textContent = `Paso ${i + 1} de ${pasos.length}`;
    pasoEl.textContent = pasos[i];
    btnPrev.disabled = i === 0;
    btnNext.disabled = i === pasos.length - 1;
  }
  btnPrev.addEventListener("click", () => { if (i > 0) { i--; paint(); } });
  btnNext.addEventListener("click", () => { if (i < pasos.length - 1) { i++; paint(); } });

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
    releaseWakeLock();
  }
  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight" && i < pasos.length - 1) { i++; paint(); }
    else if (e.key === "ArrowLeft" && i > 0) { i--; paint(); }
  }
  overlay.querySelector(".cocina-cerrar").addEventListener("click", close);
  document.addEventListener("keydown", onKey);

  paint();
  acquireWakeLock();
}

// Re-acquire the wake lock if the tab becomes visible again mid-cooking.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && document.querySelector(".cocina-overlay")) {
    acquireWakeLock();
  }
});

async function init() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { contenido.innerHTML = `<p class="estado">Receta no encontrada.</p>`; return; }
  try {
    const r = await getRecipe(id);
    render(r);
  } catch (err) {
    contenido.innerHTML = `<p class="estado">No se pudo cargar la receta.</p>`;
    console.error(err);
  }
}
init();
