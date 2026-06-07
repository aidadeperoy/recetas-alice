import { supabase } from "./supabaseClient.js";
import {
  listRecipes, createRecipe, updateRecipe, deleteRecipe, uploadPhoto,
} from "./recipesApi.js";
import { CATEGORIES, validateRecipe, escapeHtml } from "./utils.js";
import { isSpeechSupported, createRecorder } from "./speech.js";
import { structureRecipe } from "./gemini.js";

const views = {
  login: document.getElementById("vista-login"),
  lista: document.getElementById("vista-lista"),
  grabar: document.getElementById("vista-grabar"),
  form: document.getElementById("vista-form"),
};
function show(name) {
  for (const k of Object.keys(views)) views[k].classList.toggle("oculto", k !== name);
}

// Populate category select.
const catSel = document.getElementById("f-categoria");
for (const c of CATEGORIES) {
  const o = document.createElement("option");
  o.value = c; o.textContent = c; catSel.appendChild(o);
}

let editingId = null;
let recorder = null;

// ---------- AUTH ----------
document.getElementById("btn-login").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("login-error");
  errEl.textContent = "";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = "Email o contrasena incorrectos."; return; }
  await enterApp();
});

document.getElementById("btn-logout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  show("login");
});

async function enterApp() {
  show("lista");
  await refreshList();
}

// ---------- LIST ----------
async function refreshList() {
  const ul = document.getElementById("lista-recetas");
  ul.innerHTML = "";
  let recipes = [];
  try { recipes = await listRecipes(); }
  catch (e) { console.error(e); return; }
  for (const r of recipes) {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${escapeHtml(r.titulo)}</span>
      <span class="acciones">
        <button data-edit="${escapeHtml(r.id)}">✏️</button>
        <button data-del="${escapeHtml(r.id)}">🗑️</button>
      </span>`;
    ul.appendChild(li);
  }
  ul.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => startEdit(b.dataset.edit, recipes)));
  ul.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => removeRecipe(b.dataset.del)));
}

async function removeRecipe(id) {
  if (!confirm("¿Borrar esta receta?")) return;
  try { await deleteRecipe(id); await refreshList(); }
  catch (e) { alert("No se pudo borrar."); console.error(e); }
}

// ---------- FORM HELPERS ----------
function linesToArray(text) {
  return text.split("\n").map((s) => s.trim()).filter(Boolean);
}
function arrayToLines(arr) {
  return (arr || []).join("\n");
}
function fillForm(r) {
  document.getElementById("f-titulo").value = r.titulo || "";
  document.getElementById("f-categoria").value = r.categoria || "Otros";
  document.getElementById("f-descripcion").value = r.descripcion || "";
  document.getElementById("f-prep").value = r.tiempo_prep || "";
  document.getElementById("f-coccion").value = r.tiempo_coccion || "";
  document.getElementById("f-raciones").value = r.raciones || "";
  document.getElementById("f-ingredientes").value = arrayToLines(r.ingredientes);
  document.getElementById("f-pasos").value = arrayToLines(r.pasos);
  document.getElementById("f-consejos").value = r.consejos || "";
  document.getElementById("f-youtube").value = r.video_youtube || "";
  document.getElementById("f-foto").value = "";
}
function readForm() {
  return {
    titulo: document.getElementById("f-titulo").value.trim(),
    categoria: document.getElementById("f-categoria").value,
    descripcion: document.getElementById("f-descripcion").value.trim(),
    tiempo_prep: Number(document.getElementById("f-prep").value) || 0,
    tiempo_coccion: Number(document.getElementById("f-coccion").value) || 0,
    raciones: Number(document.getElementById("f-raciones").value) || 0,
    ingredientes: linesToArray(document.getElementById("f-ingredientes").value),
    pasos: linesToArray(document.getElementById("f-pasos").value),
    consejos: document.getElementById("f-consejos").value.trim(),
    video_youtube: document.getElementById("f-youtube").value.trim(),
  };
}

function startManual() {
  editingId = null;
  fillForm({ categoria: "Otros" });
  document.getElementById("procesando").classList.add("oculto");
  document.getElementById("form-error").textContent = "";
  show("form");
}
function startEdit(id, recipes) {
  const r = recipes.find((x) => x.id === id);
  if (!r) return;
  editingId = id;
  fillForm(r);
  document.getElementById("procesando").classList.add("oculto");
  document.getElementById("form-error").textContent = "";
  show("form");
}

document.getElementById("btn-manual").addEventListener("click", startManual);
document.getElementById("btn-cancelar-form").addEventListener("click", enterApp);

// ---------- SAVE ----------
document.getElementById("btn-guardar").addEventListener("click", async () => {
  const errEl = document.getElementById("form-error");
  errEl.textContent = "";
  const recipe = readForm();
  const errors = validateRecipe(recipe);
  if (errors.length) { errEl.textContent = errors.join(". "); return; }

  const btn = document.getElementById("btn-guardar");
  btn.disabled = true;
  try {
    const fileInput = document.getElementById("f-foto");
    if (fileInput.files[0]) {
      recipe.foto_url = await uploadPhoto(fileInput.files[0]);
    }
    if (editingId) await updateRecipe(editingId, recipe);
    else await createRecipe(recipe);
    await enterApp();
  } catch (e) {
    errEl.textContent = "Error al guardar. Revisa la conexion.";
    console.error(e);
  } finally {
    btn.disabled = false;
  }
});

// ---------- VOICE ----------
document.getElementById("btn-grabar").addEventListener("click", () => {
  const errEl = document.getElementById("grabar-error");
  errEl.textContent = "";
  document.getElementById("transcripcion").textContent = "";
  if (!isSpeechSupported()) {
    errEl.textContent = "Tu navegador no soporta dictado. Abre la web en Chrome.";
    show("grabar");
    return;
  }
  const transEl = document.getElementById("transcripcion");
  recorder = createRecorder({
    onText: ({ finalText, interim }) => {
      transEl.textContent = finalText + " " + interim;
      transEl.dataset.final = finalText;
    },
    onError: (e) => { errEl.textContent = e.message; },
  });
  if (recorder) { recorder.start(); show("grabar"); }
});

document.getElementById("btn-cancelar-grabar").addEventListener("click", () => {
  if (recorder) recorder.stop();
  enterApp();
});

document.getElementById("btn-parar").addEventListener("click", async () => {
  if (recorder) recorder.stop();
  const transEl = document.getElementById("transcripcion");
  const transcript = (transEl.dataset.final || transEl.textContent || "").trim();
  if (!transcript) {
    document.getElementById("grabar-error").textContent = "No se capto audio. Intenta de nuevo.";
    return;
  }
  // Go to form, show processing, then fill with AI result.
  editingId = null;
  fillForm({ categoria: "Otros" });
  document.getElementById("form-error").textContent = "";
  const procesando = document.getElementById("procesando");
  procesando.classList.remove("oculto");
  show("form");
  try {
    const r = await structureRecipe(transcript);
    fillForm(r);
  } catch (e) {
    document.getElementById("form-error").textContent =
      "La IA no pudo procesar el audio. Puedes rellenar la receta a mano.";
    document.getElementById("f-descripcion").value = transcript;
    console.error(e);
  } finally {
    procesando.classList.add("oculto");
  }
});

// ---------- BOOTSTRAP ----------
async function boot() {
  const { data } = await supabase.auth.getSession();
  if (data.session) await enterApp();
  else show("login");
}
boot();
