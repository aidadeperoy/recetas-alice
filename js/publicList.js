import { listRecipes } from "./recipesApi.js";
import { CATEGORIES, formatMinutes, totalTime, escapeHtml } from "./utils.js";

const gridEl = document.getElementById("grid");
const estadoEl = document.getElementById("estado");
const buscarEl = document.getElementById("buscar");
const filtroEl = document.getElementById("filtro-categoria");

let allRecipes = [];

for (const c of CATEGORIES) {
  const opt = document.createElement("option");
  opt.value = c; opt.textContent = c;
  filtroEl.appendChild(opt);
}

function cardHtml(r) {
  const foto = r.foto_url
    ? `<img src="${escapeHtml(r.foto_url)}" alt="${escapeHtml(r.titulo)}" loading="lazy" />`
    : `<div class="sin-foto">🍽️</div>`;
  const t = formatMinutes(totalTime(r));
  return `
    <a class="tarjeta" href="receta.html?id=${encodeURIComponent(r.id)}">
      ${foto}
      <div class="cuerpo">
        <span class="etiqueta">${escapeHtml(r.categoria || "Otros")}</span>
        <h3>${escapeHtml(r.titulo)}</h3>
        <div class="meta">${t ? "⏱ " + t : ""}</div>
      </div>
    </a>`;
}

function render(list) {
  if (list.length === 0) {
    gridEl.innerHTML = "";
    estadoEl.textContent = "No hay recetas que coincidan.";
    estadoEl.style.display = "block";
    return;
  }
  estadoEl.style.display = "none";
  gridEl.innerHTML = list.map(cardHtml).join("");
}

function applyFilters() {
  const q = buscarEl.value.trim().toLowerCase();
  const cat = filtroEl.value;
  const filtered = allRecipes.filter((r) => {
    const matchesQ = !q || (r.titulo || "").toLowerCase().includes(q);
    const matchesCat = !cat || r.categoria === cat;
    return matchesQ && matchesCat;
  });
  render(filtered);
}

buscarEl.addEventListener("input", applyFilters);
filtroEl.addEventListener("change", applyFilters);

async function init() {
  try {
    allRecipes = await listRecipes();
    render(allRecipes);
  } catch (err) {
    estadoEl.textContent = "Error al cargar las recetas.";
    console.error(err);
  }
}
init();
