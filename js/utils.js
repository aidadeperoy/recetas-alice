// Pure, browser- and node-safe helpers. No DOM, no network.

export function youtubeIdFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function youtubeEmbedUrl(url) {
  const id = youtubeIdFromUrl(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function formatMinutes(mins) {
  const n = Number(mins);
  if (!n || n <= 0) return "";
  const h = Math.floor(n / 60);
  const m = n % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

export function totalTime(recipe) {
  const prep = Number(recipe?.tiempo_prep) || 0;
  const cook = Number(recipe?.tiempo_coccion) || 0;
  return prep + cook;
}

export function validateRecipe(recipe) {
  const errors = [];
  if (!recipe?.titulo || !recipe.titulo.trim()) {
    errors.push("El titulo es obligatorio");
  }
  if (!Array.isArray(recipe?.ingredientes) || recipe.ingredientes.length === 0) {
    errors.push("Anade al menos un ingrediente");
  }
  if (!Array.isArray(recipe?.pasos) || recipe.pasos.length === 0) {
    errors.push("Anade al menos un paso");
  }
  return errors;
}

export const CATEGORIES = [
  "Entrantes", "Sopas", "Ensaladas", "Carnes", "Pescados",
  "Arroces", "Pastas", "Vegetariano", "Postres", "Reposteria", "Otros",
];

export function buildGeminiPrompt(transcript) {
  return [
    "Eres un asistente de cocina. El siguiente texto es la transcripcion de una receta explicada en voz alta.",
    "Devuelve UNICAMENTE un objeto JSON valido (sin texto adicional, sin markdown) con estas claves:",
    "titulo (string), descripcion (string), categoria (string, una de: " + CATEGORIES.join(", ") + "),",
    "tiempo_prep (numero en minutos), tiempo_coccion (numero en minutos), raciones (numero),",
    "ingredientes (array de strings, cada uno un ingrediente con cantidad),",
    "pasos (array de strings ordenados), consejos (string).",
    "Si algun dato no se menciona, usa cadena vacia, 0 o array vacio segun corresponda.",
    "",
    "Transcripcion:",
    transcript,
  ].join("\n");
}

export function parseGeminiRecipe(raw) {
  if (!raw || typeof raw !== "string") throw new Error("Respuesta vacia de la IA");
  let text = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("La IA no devolvio un JSON valido");
  }
  return {
    titulo: obj.titulo || "",
    descripcion: obj.descripcion || "",
    categoria: obj.categoria || "Otros",
    tiempo_prep: Number(obj.tiempo_prep) || 0,
    tiempo_coccion: Number(obj.tiempo_coccion) || 0,
    raciones: Number(obj.raciones) || 0,
    ingredientes: Array.isArray(obj.ingredientes) ? obj.ingredientes : [],
    pasos: Array.isArray(obj.pasos) ? obj.pasos : [],
    consejos: obj.consejos || "",
  };
}
