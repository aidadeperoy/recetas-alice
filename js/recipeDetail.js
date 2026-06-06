import { getRecipe } from "./recipesApi.js";
import { formatMinutes, youtubeEmbedUrl } from "./utils.js";

const contenido = document.getElementById("contenido");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render(r) {
  const foto = r.foto_url
    ? `<img class="receta-foto" src="${esc(r.foto_url)}" alt="${esc(r.titulo)}" />`
    : "";
  const meta = [
    r.categoria ? `🏷 ${esc(r.categoria)}` : "",
    r.tiempo_prep ? `🔪 Prep: ${formatMinutes(r.tiempo_prep)}` : "",
    r.tiempo_coccion ? `🔥 Coccion: ${formatMinutes(r.tiempo_coccion)}` : "",
    r.raciones ? `🍽 ${r.raciones} raciones` : "",
  ].filter(Boolean).map((m) => `<span>${m}</span>`).join("");

  const ingredientes = (r.ingredientes || []).map((i) => `<li>${esc(i)}</li>`).join("");
  const pasos = (r.pasos || []).map((p) => `<li>${esc(p)}</li>`).join("");
  const embed = youtubeEmbedUrl(r.video_youtube);
  const video = embed
    ? `<div class="seccion"><h2>Video</h2><div class="video-wrap"><iframe src="${embed}" allowfullscreen loading="lazy"></iframe></div></div>`
    : "";
  const consejos = r.consejos
    ? `<div class="seccion"><h2>Consejos</h2><p>${esc(r.consejos)}</p></div>`
    : "";

  document.title = (r.titulo ? esc(r.titulo) + " · " : "") + "Las Recetas de Alice";
  contenido.innerHTML = `
    ${foto}
    <h1 class="receta-titulo">${esc(r.titulo)}</h1>
    ${r.descripcion ? `<p>${esc(r.descripcion)}</p>` : ""}
    <div class="receta-meta">${meta}</div>
    <div class="seccion"><h2>Ingredientes</h2><ul>${ingredientes}</ul></div>
    <div class="seccion"><h2>Paso a paso</h2><ol>${pasos}</ol></div>
    ${video}
    ${consejos}
    <p><a href="index.html">← Volver a todas las recetas</a></p>`;
}

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
